"""Agent-Testing Dashboard — Streamlit UI.

A standalone inspection tool for running and visualising the five pipeline
agents (User Behavior, Churn Prediction, Feature Analysis, Strategy Agent,
Action Agent) against canonical-schema data during development.

Run with:
    streamlit run testing_ui/app.py

The Strategy Agent tab requires the three upstream ML agents to have been
run first in the current session.  The Full Pipeline tab runs all five in
order on a single input.

**LLM API key:** The Strategy Agent will attempt LLM-based reasoning if a
valid ``OPENAI_API_KEY`` (or the key matching ``STRATEGY_LLM_MODEL``) is
set as an environment variable.  If no key is found it falls back to a
deterministic heuristic engine — the dashboard works either way.

This file deliberately does NOT touch or reference any other frontend code in
the repo.  It imports the existing agent ``run()`` functions and adapter
registry directly.
"""

from __future__ import annotations

import json
import sys
import time
import random
from pathlib import Path

import streamlit as st
import pandas as pd
import numpy as np

# ---------------------------------------------------------------------------
# Ensure the project root is importable (so ``agents.*``, ``adapters.*``,
# ``schemas.*`` resolve when Streamlit is launched from any directory).
# ---------------------------------------------------------------------------
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

# The Action Agent uses bare imports (``from config import …``,
# ``from schemas import …``, ``from tools import …``) that would shadow the
# project-root ``schemas/`` package if we naively added ``action_agent/`` to
# sys.path.  Instead we use importlib to load its modules under safe names,
# then inject them so the Action Agent's own ``from X import …`` resolves.
_ACTION_AGENT_DIR = _PROJECT_ROOT / "action_agent"


def _import_action_agent():
    """Lazy-import the Action Agent without polluting sys.path.

    Returns ``(run_action_agent, tools_module)`` or raises ImportError.
    The first call does the heavy lifting; subsequent calls return cached
    modules.
    """
    import importlib.util

    def _load_from(name: str, filepath: Path):
        """Load a single Python file as module *name*."""
        if name in sys.modules:
            return sys.modules[name]
        spec = importlib.util.spec_from_file_location(name, filepath)
        if spec is None or spec.loader is None:
            raise ImportError(f"Cannot build spec for {filepath}")
        mod = importlib.util.module_from_spec(spec)
        sys.modules[name] = mod
        spec.loader.exec_module(mod)
        return mod

    # The Action Agent's own code does ``from config import …``,
    # ``from schemas import …``, ``from tools import …``.  We load
    # them under those bare names only if they are not already loaded.
    # To avoid permanently shadowing the project-root schemas package we
    # save and restore it.
    root_schemas = sys.modules.get("schemas")

    # 1. action_agent/config.py  → module name "config"
    _load_from("config", _ACTION_AGENT_DIR / "config.py")

    # 2. action_agent/schemas.py → temporarily as "schemas"
    #    (the Action Agent does ``from schemas import …``)
    _aa_schemas = _load_from(
        "action_agent_schemas_tmp", _ACTION_AGENT_DIR / "schemas.py"
    )
    sys.modules["schemas"] = _aa_schemas

    # 3. action_agent/tools.py   → module name "tools"
    _load_from("tools", _ACTION_AGENT_DIR / "tools.py")

    # 4. action_agent/agent.py   → module name "agent"
    agent_mod = _load_from("agent", _ACTION_AGENT_DIR / "agent.py")

    # Restore the real project-root schemas package so the rest of
    # the dashboard (agents.strategy_agent, etc.) keeps working.
    if root_schemas is not None:
        sys.modules["schemas"] = root_schemas
    else:
        sys.modules.pop("schemas", None)

    tools_mod = sys.modules.get("tools")
    return agent_mod.run_action_agent, tools_mod


# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="Agent Testing Dashboard",
    page_icon="🧪",
    layout="wide",
    initial_sidebar_state="expanded",
)


# ---------------------------------------------------------------------------
# Data loading (cached so re-runs don't re-parse the CSV)
# ---------------------------------------------------------------------------
@st.cache_data(show_spinner="Loading canonical records …")
def load_all_records() -> list:
    """Load every record via the telco_churn adapter."""
    import adapters  # noqa: delayed import
    load_fn = adapters.get_adapter("telco_churn")
    data_path = _PROJECT_ROOT / "data" / "raw" / "telco_churn.csv"
    return load_fn(data_path)


def get_records(
    all_records: list,
    mode: str,
    n_sample: int = 100,
    customer_id: str | None = None,
) -> list:
    """Subset records according to the chosen selection mode."""
    if mode == "Full dataset":
        return all_records
    elif mode == "Random sample":
        n = min(n_sample, len(all_records))
        return random.sample(all_records, n)
    elif mode == "Single customer":
        matches = [r for r in all_records if r.customer_id == customer_id]
        if not matches:
            st.error(f"Customer ID **{customer_id}** not found in the dataset.")
            st.stop()
        return matches
    return all_records


# ---------------------------------------------------------------------------
# Sidebar — data selection
# ---------------------------------------------------------------------------
st.sidebar.title("🧪 Agent Testing")
st.sidebar.markdown("---")

try:
    all_records = load_all_records()
except Exception as exc:
    st.error(f"**Failed to load data:** {exc}")
    st.stop()

all_customer_ids = sorted({r.customer_id for r in all_records})

st.sidebar.metric("Total records", len(all_records))
st.sidebar.markdown("---")

mode = st.sidebar.radio(
    "Data selection",
    options=["Full dataset", "Random sample", "Single customer"],
    index=1,
    help="Choose what slice of data to feed the agent.",
)

n_sample = 100
selected_customer_id: str | None = None

if mode == "Random sample":
    n_sample = st.sidebar.slider(
        "Sample size", min_value=10, max_value=len(all_records), value=200, step=10,
    )
elif mode == "Single customer":
    selected_customer_id = st.sidebar.selectbox(
        "Customer ID",
        options=all_customer_ids,
        index=0,
    )


# ---------------------------------------------------------------------------
# Helper — error wrapper
# ---------------------------------------------------------------------------
def _run_agent(agent_fn, records: list):
    """Run an agent function, timing it and catching errors for the UI."""
    t0 = time.time()
    try:
        result = agent_fn(records)
        elapsed = time.time() - t0
        return result, elapsed, None
    except Exception as exc:
        elapsed = time.time() - t0
        return None, elapsed, exc


def _show_run_metadata(n_records: int, elapsed: float):
    """Display run metadata bar."""
    col1, col2 = st.columns(2)
    col1.metric("Records processed", f"{n_records:,}")
    col2.metric("Wall time", f"{elapsed:.2f} s")


# ═══════════════════════════════════════════════════════════════════════
# Tabs
# ═══════════════════════════════════════════════════════════════════════
tab_behavior, tab_churn, tab_features, tab_strategy, tab_pipeline = st.tabs([
    "🧩 User Behavior",
    "📉 Churn Prediction",
    "🔬 Feature Analysis",
    "🎯 Strategy & Approvals",
    "🔗 Full Pipeline",
])


# -----------------------------------------------------------------------
# Tab 1 — User Behavior Agent
# -----------------------------------------------------------------------
with tab_behavior:
    st.header("User Behavior Agent")
    st.caption("DBSCAN clustering + autoencoder anomaly scoring")

    if st.button("▶ Run User Behavior Agent", key="run_behavior"):
        records = get_records(all_records, mode, n_sample, selected_customer_id)
        if len(records) < 10:
            st.warning(
                "The User Behavior agent needs at least ~10 records for "
                "meaningful clustering.  Consider using a larger sample."
            )

        with st.spinner("Running User Behavior Agent …"):
            from agents.user_behavior import run as run_behavior
            result, elapsed, error = _run_agent(run_behavior, records)

        if error is not None:
            st.error(f"**Agent error:** `{type(error).__name__}: {error}`")
            st.exception(error)
        else:
            _show_run_metadata(len(records), elapsed)
            st.markdown("---")

            # ---- Cluster profiles table ----
            st.subheader("Cluster Profiles")
            profiles_data = []
            for cp in result.cluster_profiles:
                profiles_data.append({
                    "Cluster ID": cp.cluster_id,
                    "Label": cp.label,
                    "Size": cp.size,
                    "Anomalous": "⚠️ Yes" if cp.is_anomalous else "No",
                    **{f"μ({k})": round(v, 3) for k, v in cp.centroid_features.items()},
                })
            st.dataframe(
                pd.DataFrame(profiles_data),
                use_container_width=True,
                hide_index=True,
            )

            # ---- Anomalous clusters ----
            if result.anomalous_clusters:
                st.subheader("⚠️ Anomalous Clusters")
                for cid in result.anomalous_clusters:
                    matched = [p for p in result.cluster_profiles if p.cluster_id == cid]
                    if matched:
                        p = matched[0]
                        st.warning(
                            f"**Cluster {cid}** — *{p.label}* ({p.size} customers): "
                            f"flagged as anomalous by cohort drift detection."
                        )
            else:
                st.info("No clusters flagged as anomalous.")

            # ---- 2D scatter (PCA) ----
            st.subheader("Customer Scatter (PCA projection)")

            # Rebuild the feature matrix for PCA
            try:
                from agents.user_behavior import _records_to_feature_df
                from sklearn.decomposition import PCA
                from sklearn.preprocessing import StandardScaler as _Scaler

                df_feat = _records_to_feature_df(records)
                feat_cols = [c for c in df_feat.columns if c != "customer_id"]
                X_pca = _Scaler().fit_transform(df_feat[feat_cols].values)
                coords = PCA(n_components=2, random_state=42).fit_transform(X_pca)

                scatter_df = pd.DataFrame({
                    "PC1": coords[:, 0],
                    "PC2": coords[:, 1],
                    "Cluster": [
                        str(cc.cluster_id) for cc in result.customer_clusters
                    ],
                    "Customer": [cc.customer_id for cc in result.customer_clusters],
                    "Anomaly Score": [
                        round(cc.anomaly_score, 4) for cc in result.customer_clusters
                    ],
                })

                st.scatter_chart(
                    scatter_df,
                    x="PC1",
                    y="PC2",
                    color="Cluster",
                    size=6,
                    use_container_width=True,
                )
            except Exception as exc:
                st.warning(f"Could not render PCA scatter: {exc}")

            # ---- Metadata ----
            st.subheader("Run Metadata")
            st.json(result.metadata)


# -----------------------------------------------------------------------
# Tab 2 — Churn Prediction Agent
# -----------------------------------------------------------------------
with tab_churn:
    st.header("Churn Prediction Agent")
    st.caption("Cox Proportional Hazards + Gradient Boosting classifier")

    if st.button("▶ Run Churn Prediction Agent", key="run_churn"):
        records = get_records(all_records, mode, n_sample, selected_customer_id)

        with st.spinner("Running Churn Prediction Agent …"):
            from agents.churn_prediction import run as run_churn
            result, elapsed, error = _run_agent(run_churn, records)

        if error is not None:
            st.error(f"**Agent error:** `{type(error).__name__}: {error}`")
            st.exception(error)
        else:
            _show_run_metadata(len(records), elapsed)
            st.markdown("---")

            # ---- Model metrics ----
            st.subheader("Model Performance")
            met_cols = st.columns(3)
            met_cols[0].metric(
                "Cox C-index",
                f"{result.survival_model_concordance:.4f}",
            )
            met_cols[1].metric(
                "Classifier AUC-ROC",
                f"{result.classifier_metrics.get('auc_roc', 'N/A')}",
            )
            met_cols[2].metric(
                "Classifier F1",
                f"{result.classifier_metrics.get('f1', 'N/A')}",
            )

            # ---- Per-customer risk table ----
            st.subheader("Per-Customer Risk Scores")
            pred_rows = []
            for p in result.predictions:
                pred_rows.append({
                    "Customer ID": p.customer_id,
                    "Risk Score": round(p.risk_score, 4),
                    "Survival P(6m)": round(p.survival_probability_6m, 4),
                    "Median Survival (mo)": (
                        round(p.median_survival_time, 1)
                        if p.median_survival_time is not None else "∞"
                    ),
                    "Churn Reason": p.churn_reason,
                    "Hazard Rate": round(p.hazard_rate, 4),
                })

            pred_df = pd.DataFrame(pred_rows)
            st.dataframe(
                pred_df.sort_values("Risk Score", ascending=False),
                use_container_width=True,
                hide_index=True,
            )

            # ---- Survival curve for selected customer ----
            st.subheader("Survival Curve")
            cust_ids_in_result = [p.customer_id for p in result.predictions]
            sel_cust = st.selectbox(
                "Select customer for survival curve",
                options=cust_ids_in_result,
                key="surv_customer",
            )

            if sel_cust:
                try:
                    from agents.churn_prediction import (
                        _records_to_survival_df,
                        _fit_cox_model,
                    )
                    from lifelines import CoxPHFitter

                    surv_df = _records_to_survival_df(records)
                    feat_cols = [
                        c for c in surv_df.columns
                        if c not in ("customer_id", "duration", "event")
                    ]

                    # Re-fit Cox (fast — already cached data)
                    with st.spinner("Fitting Cox model for survival curve …"):
                        cph, _ = _fit_cox_model(surv_df, feat_cols)

                    # Get survival function for the selected customer
                    idx = surv_df.index[surv_df["customer_id"] == sel_cust][0]
                    cust_row = surv_df.iloc[[idx]]

                    sf = cph.predict_survival_function(
                        cust_row[["duration", "event"] + feat_cols]
                    )

                    chart_df = pd.DataFrame({
                        "Months": sf.index.values,
                        "Survival Probability": sf.iloc[:, 0].values,
                    })

                    st.line_chart(
                        chart_df.set_index("Months"),
                        use_container_width=True,
                    )

                    # Show the customer's prediction summary
                    cust_pred = [
                        p for p in result.predictions if p.customer_id == sel_cust
                    ][0]
                    info_cols = st.columns(4)
                    info_cols[0].metric("Risk Score", f"{cust_pred.risk_score:.4f}")
                    info_cols[1].metric(
                        "P(survive 6m)", f"{cust_pred.survival_probability_6m:.4f}",
                    )
                    info_cols[2].metric("Churn Reason", cust_pred.churn_reason)
                    info_cols[3].metric(
                        "Median Survival",
                        f"{cust_pred.median_survival_time:.1f} mo"
                        if cust_pred.median_survival_time is not None
                        else "∞",
                    )

                except Exception as exc:
                    st.warning(f"Could not render survival curve: {exc}")

            # ---- Feature importances ----
            st.subheader("Feature Importances (Classifier)")
            imp_df = pd.DataFrame(
                [
                    {"Feature": k, "Importance": v}
                    for k, v in sorted(
                        result.feature_importances.items(),
                        key=lambda x: x[1],
                        reverse=True,
                    )
                ]
            )
            st.bar_chart(imp_df.set_index("Feature"), use_container_width=True)


# -----------------------------------------------------------------------
# Tab 3 — Feature Analysis Agent
# -----------------------------------------------------------------------
with tab_features:
    st.header("Feature Analysis Agent")
    st.caption("Double Machine Learning — causal effect estimation (LinearDML)")

    st.info(
        "⏱ **This agent is slow** (~30-60 s on the full dataset) because it fits "
        "a separate DML model for each treatment feature.  Use a random sample "
        "of 200-500 records for faster iteration."
    )

    if st.button("▶ Run Feature Analysis Agent", key="run_features"):
        records = get_records(all_records, mode, n_sample, selected_customer_id)

        if len(records) < 50:
            st.warning(
                "DML needs a reasonable sample size for reliable estimates.  "
                "Consider using ≥ 50 records."
            )

        with st.spinner("Running Feature Analysis Agent (this may take a while) …"):
            from agents.feature_analysis import run as run_features
            result, elapsed, error = _run_agent(run_features, records)

        if error is not None:
            st.error(f"**Agent error:** `{type(error).__name__}: {error}`")
            st.exception(error)
        else:
            _show_run_metadata(len(records), elapsed)
            st.markdown("---")

            # ---- Summary metrics ----
            st.subheader("Summary")
            sum_cols = st.columns(4)
            sum_cols[0].metric("Method", result.method)
            sum_cols[1].metric("Outcome", result.outcome_variable)
            sum_cols[2].metric("Features analysed", len(result.effects))
            sum_cols[3].metric(
                "Significant",
                sum(1 for e in result.effects if e.is_significant),
            )

            # ---- Causal effects table ----
            st.subheader("Causal Feature Effects (ranked by |ATE|)")
            effects_rows = []
            for e in result.effects:
                effects_rows.append({
                    "Feature": e.feature_name,
                    "Description": e.treatment_description,
                    "ATE": round(e.ate, 5),
                    "CI Lower": round(e.ci_lower, 5),
                    "CI Upper": round(e.ci_upper, 5),
                    "p-value": (
                        f"{e.p_value:.4f}" if e.p_value is not None else "—"
                    ),
                    "Significant": "✅" if e.is_significant else "❌",
                })
            st.dataframe(
                pd.DataFrame(effects_rows),
                use_container_width=True,
                hide_index=True,
            )

            # ---- Bar chart with error bars ----
            st.subheader("ATE with 95% Confidence Intervals")

            import matplotlib.pyplot as plt

            fig, ax = plt.subplots(figsize=(10, max(4, len(result.effects) * 0.5)))
            names = [e.feature_name for e in result.effects]
            ates = [e.ate for e in result.effects]
            ci_low = [e.ci_lower for e in result.effects]
            ci_high = [e.ci_upper for e in result.effects]
            errors_low = [a - cl for a, cl in zip(ates, ci_low)]
            errors_high = [ch - a for a, ch in zip(ates, ci_high)]
            colors = [
                "#2ecc71" if e.is_significant and e.ate > 0
                else "#e74c3c" if e.is_significant and e.ate < 0
                else "#95a5a6"
                for e in result.effects
            ]

            y_pos = range(len(names))
            ax.barh(
                y_pos, ates,
                xerr=[errors_low, errors_high],
                color=colors,
                edgecolor="white",
                capsize=4,
                height=0.6,
            )
            ax.set_yticks(y_pos)
            ax.set_yticklabels(names)
            ax.axvline(x=0, color="black", linewidth=0.8, linestyle="--")
            ax.set_xlabel("Average Treatment Effect on Retention")
            ax.set_title("Causal Effects — Green = positive, Red = negative, Grey = not significant")
            fig.tight_layout()

            st.pyplot(fig)

            # ---- Confounders ----
            st.subheader("Confounders Used")
            st.write(", ".join(result.confounders_used))


# ═══════════════════════════════════════════════════════════════════════
# Tab 4 — Strategy & Approvals
# ═══════════════════════════════════════════════════════════════════════
with tab_strategy:
    st.header("Strategy Agent & Human-in-the-Loop Approvals")
    st.caption(
        "Runs the Strategy Agent against the current session's upstream ML "
        "outputs, then wires each approved recommendation to the actual "
        "Action Agent."
    )

    # ---- Pre-requisite: upstream results must exist in session state ----
    st.info(
        "💡 **Prerequisite:** Run the three upstream agents first (User "
        "Behavior, Churn Prediction, Feature Analysis) using the button "
        "below, or run them individually in their tabs."
    )

    if st.button("▶ Run All 3 Upstream Agents", key="run_upstream_for_strategy"):
        records = get_records(all_records, mode, n_sample, selected_customer_id)

        if len(records) < 50:
            st.warning(
                "The pipeline needs ≥ 50 records for reliable results.  "
                "Consider using a larger sample."
            )

        # ---- User Behavior ----
        with st.spinner("① Running User Behavior Agent …"):
            from agents.user_behavior import run as run_behavior
            ub_result, ub_elapsed, ub_error = _run_agent(run_behavior, records)
        if ub_error:
            st.error(f"User Behavior Agent failed: `{ub_error}`")
            st.exception(ub_error)
            st.stop()
        st.session_state["behavior_result"] = ub_result

        # ---- Churn Prediction ----
        with st.spinner("② Running Churn Prediction Agent …"):
            from agents.churn_prediction import run as run_churn
            cp_result, cp_elapsed, cp_error = _run_agent(run_churn, records)
        if cp_error:
            st.error(f"Churn Prediction Agent failed: `{cp_error}`")
            st.exception(cp_error)
            st.stop()
        st.session_state["churn_result"] = cp_result

        # ---- Feature Analysis ----
        with st.spinner("③ Running Feature Analysis Agent (may take 30-60 s) …"):
            from agents.feature_analysis import run as run_features
            fa_result, fa_elapsed, fa_error = _run_agent(run_features, records)
        if fa_error:
            st.error(f"Feature Analysis Agent failed: `{fa_error}`")
            st.exception(fa_error)
            st.stop()
        st.session_state["features_result"] = fa_result

        st.session_state["upstream_records_count"] = len(records)
        st.session_state["upstream_total_time"] = ub_elapsed + cp_elapsed + fa_elapsed

        st.success(
            f"✅ All 3 upstream agents completed in "
            f"{st.session_state['upstream_total_time']:.1f} s "
            f"({len(records)} records)."
        )

    # ---- Check if upstream results are available ----
    has_upstream = all(
        k in st.session_state
        for k in ("behavior_result", "churn_result", "features_result")
    )

    if not has_upstream:
        st.warning(
            "⚠️ No upstream results in session.  Click **Run All 3 Upstream "
            "Agents** above, or run each agent individually in its tab first."
        )
    else:
        st.success(
            f"Upstream results loaded — "
            f"{st.session_state.get('upstream_records_count', '?')} records"
        )

        if st.button("▶ Run Strategy Agent", key="run_strategy"):
            with st.spinner("Running Strategy Agent (LLM or heuristic) …"):
                from agents.strategy_agent import run as run_strategy
                t0 = time.time()
                try:
                    strategy_result = run_strategy(
                        st.session_state["behavior_result"],
                        st.session_state["churn_result"],
                        st.session_state["features_result"],
                    )
                    strategy_elapsed = time.time() - t0
                    st.session_state["strategy_result"] = strategy_result
                    st.session_state["strategy_elapsed"] = strategy_elapsed
                except Exception as exc:
                    st.error(f"**Strategy Agent error:** `{type(exc).__name__}: {exc}`")
                    st.exception(exc)

        # ---- Display strategy results ----
        if "strategy_result" in st.session_state:
            strategy_result = st.session_state["strategy_result"]
            strategy_elapsed = st.session_state.get("strategy_elapsed", 0)

            st.markdown("---")

            # ---- Strategy overview metrics ----
            st.subheader("Strategy Agent Overview")
            meta = strategy_result.pipeline_metadata
            ov_cols = st.columns(5)
            ov_cols[0].metric("Segments Analysed", strategy_result.segments_analysed)
            ov_cols[1].metric("Segments Flagged", strategy_result.segments_flagged)
            ov_cols[2].metric("Recommendations", len(strategy_result.recommendations))
            ov_cols[3].metric("Reasoning Engine", meta.get("reasoning_engine", "unknown"))
            ov_cols[4].metric("Wall Time", f"{strategy_elapsed:.2f} s")

            if meta.get("llm_used"):
                st.info(
                    f"🤖 LLM mode: **{meta.get('model', '?')}** "
                    f"(latency {meta.get('latency_seconds', '?')} s)"
                )
            else:
                st.info(
                    "🔧 Heuristic mode (no LLM API key configured).  "
                    "Set `OPENAI_API_KEY` to enable LLM reasoning."
                )

            # ---- Verify Action Agent integration is mocked ----
            _action_agent_mocked = False
            _action_agent_import_error: str | None = None
            try:
                _run_action_fn, _tools_mod = _import_action_agent()
                # Check the docstring of the module to confirm it's mocked
                if "mock" in (_tools_mod.__doc__ or "").lower():
                    _action_agent_mocked = True
                else:
                    # Inspect the tool source for mock indicators
                    import inspect
                    src = inspect.getsource(_tools_mod)
                    if "simulated" in src.lower() or "mock" in src.lower():
                        _action_agent_mocked = True
            except ImportError as ie:
                _action_agent_import_error = str(ie)
            except Exception as ie:
                _action_agent_import_error = str(ie)

            if _action_agent_import_error:
                st.error(
                    f"⚠️ **Could not import Action Agent:** `{_action_agent_import_error}`.  "
                    f"Approve/Reject controls are disabled."
                )
            elif not _action_agent_mocked:
                st.error(
                    "🚨 **WARNING: Action Agent tools do NOT appear to be "
                    "mocked/stubbed.**  The Approve button could fire real "
                    "API calls (Stripe charges, Slack messages, GrowthBook "
                    "experiments).  Approve/Reject controls are DISABLED for "
                    "safety.  Please ensure `action_agent/tools.py` uses "
                    "mocked implementations before enabling."
                )
            else:
                st.success(
                    "✅ Action Agent integration confirmed **mocked/stubbed** "
                    "— safe to approve from this dev tool."
                )

            # ---- Per-recommendation review cards ----
            st.markdown("---")
            st.subheader("Recommendations — Review & Approve")

            from agents.strategy_agent import to_action_agent_inputs
            action_inputs = to_action_agent_inputs(strategy_result)

            for idx, rec in enumerate(strategy_result.recommendations):
                action_input = action_inputs[idx] if idx < len(action_inputs) else None

                # Urgency colour
                urgency_colors = {
                    "critical": "🔴", "high": "🟠",
                    "medium": "🟡", "low": "🟢",
                }
                urgency_icon = urgency_colors.get(rec.urgency, "⚪")

                with st.expander(
                    f"{urgency_icon} **Rec {idx + 1}:** {rec.segment_label} "
                    f"→ `{rec.action_type.value}` "
                    f"(confidence {rec.confidence_score:.0%}, "
                    f"urgency: {rec.urgency})",
                    expanded=True,
                ):
                    # ── Two-column layout: justification vs raw data ──
                    just_col, data_col = st.columns([3, 2])

                    with just_col:
                        st.markdown("##### 📝 Strategy Justification")
                        st.write(rec.justification)

                        st.markdown(f"**Action Type:** `{rec.action_type.value}`")
                        st.markdown(f"**Urgency:** {rec.urgency}")
                        st.markdown(
                            f"**Confidence Score:** {rec.confidence_score:.4f} "
                            f"*(derived from CI width, not LLM self-assessment)*"
                        )
                        st.markdown(
                            f"**Estimated Impact:** {rec.estimated_impact:+.1f} "
                            f"additional retained customers"
                        )
                        st.markdown(
                            f"**Action Parameters:**"
                        )
                        st.json(rec.action_parameters)

                    with data_col:
                        st.markdown("##### 📊 Raw Grounding Data")

                        # Segment risk evidence
                        seg = rec.segment_risk
                        st.markdown("**Segment Risk Evidence:**")
                        seg_data = {
                            "Segment ID": seg.segment_id,
                            "Label": seg.segment_label,
                            "Size": seg.segment_size,
                            "Mean Risk Score": f"{seg.mean_risk_score:.4f}",
                            "Mean Hazard Rate": f"{seg.mean_hazard_rate:.4f}",
                            "Mean Survival P(6m)": f"{seg.mean_survival_probability_6m:.4f}",
                            "Dominant Churn Reason": seg.dominant_churn_reason,
                            "Anomalous": "⚠️ Yes" if seg.is_anomalous else "No",
                            "Customers": len(seg.customer_ids),
                        }
                        st.dataframe(
                            pd.DataFrame([seg_data]),
                            use_container_width=True,
                            hide_index=True,
                        )

                        st.markdown("**Churn Reason Distribution:**")
                        st.json(seg.churn_reason_distribution)

                        # Causal evidence
                        ce = rec.causal_evidence
                        st.markdown("**Causal Evidence:**")
                        causal_data = {
                            "Feature": ce.feature_name,
                            "Treatment": ce.treatment_description,
                            "ATE": f"{ce.ate:+.5f}",
                            "CI Lower": f"{ce.ci_lower:.5f}",
                            "CI Upper": f"{ce.ci_upper:.5f}",
                            "CI Width": f"{ce.ci_width:.5f}",
                            "Significant": "✅" if ce.is_significant else "❌",
                        }
                        st.dataframe(
                            pd.DataFrame([causal_data]),
                            use_container_width=True,
                            hide_index=True,
                        )

                        # ── Quick sanity check: flag mismatches ──
                        # If confidence is high but CI is wide, or vice versa
                        if ce.ci_width > 0.3 and rec.confidence_score > 0.7:
                            st.warning(
                                "⚠️ **Mismatch:** Confidence score is "
                                f"{rec.confidence_score:.2f} but CI width is "
                                f"{ce.ci_width:.4f} (wide).  The confidence "
                                f"may be overstated."
                            )
                        if not ce.is_significant and rec.confidence_score > 0.5:
                            st.warning(
                                "⚠️ **Mismatch:** The causal feature is NOT "
                                "statistically significant but the confidence "
                                f"score is {rec.confidence_score:.2f}."
                            )

                    # ── Approve / Reject controls ──
                    st.markdown("---")
                    can_approve = (
                        _action_agent_mocked
                        and not _action_agent_import_error
                        and action_input is not None
                    )

                    approval_key = f"approval_{rec.recommendation_id}"
                    result_key = f"action_result_{rec.recommendation_id}"

                    # Show gate status
                    if result_key not in st.session_state:
                        st.info(
                            "🔒 **Approval gate active** — the Action Agent "
                            "will NOT execute until you click Approve."
                        )

                    if can_approve and result_key not in st.session_state:
                        approve_col, reject_col, _ = st.columns([1, 1, 3])

                        with approve_col:
                            if st.button(
                                "✅ Approve",
                                key=f"approve_{rec.recommendation_id}",
                                type="primary",
                            ):
                                with st.spinner("Executing Action Agent …"):
                                    try:
                                        _run_aa, _ = _import_action_agent()
                                        action_state = _run_aa(
                                            action_input,
                                            auto_approve_test=True,
                                        )
                                        st.session_state[result_key] = {
                                            "decision": "approved",
                                            "state": action_state,
                                        }
                                    except Exception as exc:
                                        st.session_state[result_key] = {
                                            "decision": "approved",
                                            "error": str(exc),
                                        }
                                st.rerun()

                        with reject_col:
                            if st.button(
                                "❌ Reject",
                                key=f"reject_{rec.recommendation_id}",
                            ):
                                with st.spinner("Recording rejection …"):
                                    try:
                                        _run_aa, _ = _import_action_agent()
                                        action_state = _run_aa(
                                            action_input,
                                            auto_approve_test=False,
                                        )
                                        st.session_state[result_key] = {
                                            "decision": "rejected",
                                            "state": action_state,
                                        }
                                    except Exception as exc:
                                        st.session_state[result_key] = {
                                            "decision": "rejected",
                                            "error": str(exc),
                                        }
                                st.rerun()

                    elif not can_approve and result_key not in st.session_state:
                        st.warning(
                            "Approve/Reject controls disabled — see status "
                            "message above."
                        )

                    # ---- Show Action Agent result ----
                    if result_key in st.session_state:
                        ar = st.session_state[result_key]
                        decision = ar.get("decision", "unknown")

                        if decision == "approved":
                            st.success("✅ **APPROVED** — Action Agent executed.")
                        else:
                            st.error("❌ **REJECTED** — Action Agent blocked execution.")

                        if "error" in ar:
                            st.error(f"Action Agent error: `{ar['error']}`")
                        elif "state" in ar:
                            state = ar["state"]
                            st.markdown("**Action Agent Result:**")

                            result_cols = st.columns(3)
                            result_cols[0].metric(
                                "Action Type",
                                state.get("action_type", "—"),
                            )
                            result_cols[1].metric(
                                "High Risk?",
                                "Yes" if state.get("is_high_risk") else "No",
                            )
                            result_cols[2].metric(
                                "Audit ID",
                                state.get("audit_id", "—"),
                            )

                            exec_result = state.get("execution_result")
                            if exec_result:
                                exec_status = exec_result.get("status", "unknown")
                                if exec_status == "cancelled":
                                    st.warning(
                                        f"Execution **cancelled**: "
                                        f"{exec_result.get('reason', 'Rejected by HITL gate')}"
                                    )
                                elif exec_status == "success":
                                    st.success("Tool execution succeeded.")
                                else:
                                    st.info(f"Execution status: `{exec_status}`")

                                st.json(exec_result)

                            if state.get("error"):
                                st.error(f"Error: `{state['error']}`")

                            # Gate evidence
                            if state.get("is_high_risk"):
                                st.info(
                                    f"🔐 **HITL gate was active** for this "
                                    f"high-risk action.  Human approval was "
                                    f"{'granted' if state.get('human_approved') else 'denied'} "
                                    f"before execution."
                                )
                            else:
                                st.info(
                                    "ℹ️ Low-risk action — bypassed HITL gate "
                                    "(executed automatically)."
                                )


# ═══════════════════════════════════════════════════════════════════════
# Tab 5 — Full Pipeline
# ═══════════════════════════════════════════════════════════════════════
with tab_pipeline:
    st.header("Full Pipeline — End-to-End")
    st.caption(
        "Runs all five agents in sequence on a single input and shows "
        "each stage's output feeding into the next."
    )

    st.info(
        "⏱ **This will take a while** (the Feature Analysis agent alone "
        "can take 30-60 s).  Use a random sample of 100-200 records for "
        "faster iteration."
    )

    if st.button("▶ Run Full Pipeline", key="run_full_pipeline"):
        records = get_records(all_records, mode, n_sample, selected_customer_id)

        if len(records) < 50:
            st.warning(
                "The pipeline needs ≥ 50 records for reliable results.  "
                "Consider using a larger sample."
            )

        pipeline_results: dict = {}
        pipeline_errors: dict = {}
        pipeline_times: dict = {}
        t_pipeline_start = time.time()

        # ── Stage 1: User Behavior ──────────────────────────────────
        st.markdown("---")
        stage1 = st.empty()
        stage1.info("🔄 **Stage 1/5:** Running User Behavior Agent …")

        with st.spinner("Stage 1: User Behavior Agent …"):
            from agents.user_behavior import run as run_behavior
            ub_result, ub_elapsed, ub_error = _run_agent(run_behavior, records)

        pipeline_times["user_behavior"] = ub_elapsed
        if ub_error:
            stage1.error(f"❌ Stage 1 failed: `{ub_error}`")
            pipeline_errors["user_behavior"] = str(ub_error)
        else:
            pipeline_results["behavior"] = ub_result
            stage1.success(
                f"✅ **Stage 1:** User Behavior Agent — "
                f"{len(ub_result.cluster_profiles)} clusters, "
                f"{len(ub_result.anomalous_clusters)} anomalous "
                f"({ub_elapsed:.1f} s)"
            )

        # ── Stage 2: Churn Prediction ───────────────────────────────
        if "behavior" in pipeline_results:
            stage2 = st.empty()
            stage2.info("🔄 **Stage 2/5:** Running Churn Prediction Agent …")

            with st.spinner("Stage 2: Churn Prediction Agent …"):
                from agents.churn_prediction import run as run_churn
                cp_result, cp_elapsed, cp_error = _run_agent(run_churn, records)

            pipeline_times["churn_prediction"] = cp_elapsed
            if cp_error:
                stage2.error(f"❌ Stage 2 failed: `{cp_error}`")
                pipeline_errors["churn_prediction"] = str(cp_error)
            else:
                pipeline_results["churn"] = cp_result
                high_risk = sum(
                    1 for p in cp_result.predictions if p.risk_score > 0.5
                )
                stage2.success(
                    f"✅ **Stage 2:** Churn Prediction — "
                    f"{len(cp_result.predictions)} predictions, "
                    f"{high_risk} high-risk "
                    f"(C-index: {cp_result.survival_model_concordance:.3f}, "
                    f"{cp_elapsed:.1f} s)"
                )

        # ── Stage 3: Feature Analysis ───────────────────────────────
        if "churn" in pipeline_results:
            stage3 = st.empty()
            stage3.info("🔄 **Stage 3/5:** Running Feature Analysis Agent …")

            with st.spinner("Stage 3: Feature Analysis Agent (may take 30-60 s) …"):
                from agents.feature_analysis import run as run_features
                fa_result, fa_elapsed, fa_error = _run_agent(run_features, records)

            pipeline_times["feature_analysis"] = fa_elapsed
            if fa_error:
                stage3.error(f"❌ Stage 3 failed: `{fa_error}`")
                pipeline_errors["feature_analysis"] = str(fa_error)
            else:
                pipeline_results["features"] = fa_result
                n_sig = sum(1 for e in fa_result.effects if e.is_significant)
                stage3.success(
                    f"✅ **Stage 3:** Feature Analysis — "
                    f"{len(fa_result.effects)} features, "
                    f"{n_sig} significant "
                    f"({fa_elapsed:.1f} s)"
                )

        # ── Stage 4: Strategy Agent ─────────────────────────────────
        if "features" in pipeline_results:
            stage4 = st.empty()
            stage4.info("🔄 **Stage 4/5:** Running Strategy Agent …")

            with st.spinner("Stage 4: Strategy Agent …"):
                from agents.strategy_agent import (
                    run as run_strategy,
                    to_action_agent_inputs,
                )
                t4 = time.time()
                try:
                    strat_result = run_strategy(
                        pipeline_results["behavior"],
                        pipeline_results["churn"],
                        pipeline_results["features"],
                    )
                    strat_elapsed = time.time() - t4
                    pipeline_results["strategy"] = strat_result
                    pipeline_times["strategy"] = strat_elapsed
                    engine = strat_result.pipeline_metadata.get(
                        "reasoning_engine", "unknown"
                    )
                    stage4.success(
                        f"✅ **Stage 4:** Strategy Agent — "
                        f"{len(strat_result.recommendations)} recommendations "
                        f"(engine: {engine}, {strat_elapsed:.1f} s)"
                    )
                except Exception as exc:
                    strat_elapsed = time.time() - t4
                    pipeline_times["strategy"] = strat_elapsed
                    stage4.error(f"❌ Stage 4 failed: `{exc}`")
                    pipeline_errors["strategy"] = str(exc)

        # ── Stage 5: Action Agent (auto-approve for pipeline view) ──
        if "strategy" in pipeline_results:
            stage5 = st.empty()
            stage5.info("🔄 **Stage 5/5:** Running Action Agent (auto-approve) …")

            with st.spinner("Stage 5: Action Agent …"):
                strat_result = pipeline_results["strategy"]
                action_inputs_list = to_action_agent_inputs(strat_result)
                action_results_list = []
                t5 = time.time()

                try:
                    run_action_agent, _ = _import_action_agent()

                    for ai in action_inputs_list:
                        action_state = run_action_agent(
                            ai, auto_approve_test=True,
                        )
                        action_results_list.append(action_state)

                    action_elapsed = time.time() - t5
                    pipeline_results["action"] = action_results_list
                    pipeline_times["action"] = action_elapsed
                    stage5.success(
                        f"✅ **Stage 5:** Action Agent — "
                        f"{len(action_results_list)} actions executed "
                        f"({action_elapsed:.1f} s)"
                    )
                except Exception as exc:
                    action_elapsed = time.time() - t5
                    pipeline_times["action"] = action_elapsed
                    stage5.error(f"❌ Stage 5 failed: `{exc}`")
                    pipeline_errors["action"] = str(exc)

        total_pipeline_time = time.time() - t_pipeline_start

        # ═════════════════════════════════════════════════════════════
        # Pipeline summary
        # ═════════════════════════════════════════════════════════════
        st.markdown("---")
        st.subheader("Pipeline Summary")

        summary_cols = st.columns(4)
        summary_cols[0].metric("Records", f"{len(records):,}")
        summary_cols[1].metric("Total Time", f"{total_pipeline_time:.1f} s")
        summary_cols[2].metric(
            "Stages Completed",
            f"{len(pipeline_results)}/5",
        )
        summary_cols[3].metric(
            "Errors",
            f"{len(pipeline_errors)}",
        )

        # ── Timing breakdown ──
        st.subheader("⏱ Timing Breakdown")
        timing_data = []
        stage_names = [
            ("user_behavior", "User Behavior"),
            ("churn_prediction", "Churn Prediction"),
            ("feature_analysis", "Feature Analysis"),
            ("strategy", "Strategy Agent"),
            ("action", "Action Agent"),
        ]
        for key, label in stage_names:
            if key in pipeline_times:
                timing_data.append({
                    "Stage": label,
                    "Time (s)": round(pipeline_times[key], 2),
                    "Status": "❌ Error" if key in pipeline_errors else "✅ OK",
                })
        if timing_data:
            st.dataframe(
                pd.DataFrame(timing_data),
                use_container_width=True,
                hide_index=True,
            )

        # ── Handoff inspection ──
        if pipeline_errors:
            st.subheader("❌ Errors")
            for stage_key, err_msg in pipeline_errors.items():
                st.error(f"**{stage_key}:** `{err_msg}`")

        # ── Detailed stage outputs ──
        st.markdown("---")
        st.subheader("📋 Stage-by-Stage Handoff Detail")

        # Stage 1 → 2 handoff
        if "behavior" in pipeline_results:
            with st.expander("**Stage 1 → 2:** Cluster Assignments (User Behavior output)", expanded=False):
                ub = pipeline_results["behavior"]
                st.markdown(
                    f"**{len(ub.cluster_profiles)} clusters** discovered, "
                    f"**{len(ub.anomalous_clusters)}** flagged anomalous."
                )
                profiles_data = []
                for cp in ub.cluster_profiles:
                    profiles_data.append({
                        "Cluster": cp.cluster_id,
                        "Label": cp.label,
                        "Size": cp.size,
                        "Anomalous": "⚠️" if cp.is_anomalous else "—",
                    })
                st.dataframe(
                    pd.DataFrame(profiles_data),
                    use_container_width=True,
                    hide_index=True,
                )

        # Stage 2 → 3 handoff
        if "churn" in pipeline_results:
            with st.expander("**Stage 2 → 3:** Per-Customer Risk Scores (Churn Prediction output)", expanded=False):
                cp_res = pipeline_results["churn"]
                top_risks = sorted(
                    cp_res.predictions, key=lambda p: p.risk_score, reverse=True
                )[:20]
                risk_rows = []
                for p in top_risks:
                    risk_rows.append({
                        "Customer": p.customer_id,
                        "Risk": f"{p.risk_score:.4f}",
                        "Survival P(6m)": f"{p.survival_probability_6m:.4f}",
                        "Reason": p.churn_reason,
                        "Hazard": f"{p.hazard_rate:.4f}",
                    })
                st.markdown(f"Top 20 by risk (of {len(cp_res.predictions)} total):")
                st.dataframe(
                    pd.DataFrame(risk_rows),
                    use_container_width=True,
                    hide_index=True,
                )

        # Stage 3 → 4 handoff
        if "features" in pipeline_results:
            with st.expander("**Stage 3 → 4:** Causal Feature Effects (Feature Analysis output)", expanded=False):
                fa_res = pipeline_results["features"]
                eff_rows = []
                for e in fa_res.effects:
                    eff_rows.append({
                        "Feature": e.feature_name,
                        "ATE": f"{e.ate:+.5f}",
                        "CI": f"[{e.ci_lower:.5f}, {e.ci_upper:.5f}]",
                        "Significant": "✅" if e.is_significant else "❌",
                    })
                st.dataframe(
                    pd.DataFrame(eff_rows),
                    use_container_width=True,
                    hide_index=True,
                )

        # Stage 4 → 5 handoff
        if "strategy" in pipeline_results:
            with st.expander("**Stage 4 → 5:** Strategy Recommendations → Action Agent Input", expanded=True):
                strat_res = pipeline_results["strategy"]
                ai_list = to_action_agent_inputs(strat_res)

                for i, (rec, ai) in enumerate(
                    zip(strat_res.recommendations, ai_list)
                ):
                    st.markdown(f"---")
                    st.markdown(
                        f"**Recommendation {i + 1}:** "
                        f"`{rec.action_type.value}` → segment "
                        f"*{rec.segment_label}*"
                    )

                    handoff_cols = st.columns(2)

                    with handoff_cols[0]:
                        st.markdown("**Strategy Agent output (source):**")
                        st.json({
                            "recommendation_id": rec.recommendation_id,
                            "action_type": rec.action_type.value,
                            "segment_label": rec.segment_label,
                            "confidence_score": rec.confidence_score,
                            "urgency": rec.urgency,
                            "estimated_impact": rec.estimated_impact,
                            "action_parameters": rec.action_parameters,
                        })

                    with handoff_cols[1]:
                        st.markdown("**Action Agent input (mapped):**")
                        st.json(ai)

                    # Schema compatibility check
                    expected_keys = {
                        "recommendation_id", "action_type",
                        "target_entity", "description", "parameters",
                        "confidence_score", "justification",
                    }
                    actual_keys = set(ai.keys()) if isinstance(ai, dict) else set()
                    missing = expected_keys - actual_keys
                    extra = actual_keys - expected_keys

                    if missing:
                        st.error(
                            f"⚠️ **Schema mismatch — missing keys:** "
                            f"`{missing}`.  Action Agent expects these."
                        )
                    elif extra:
                        st.warning(
                            f"Extra keys not in Action Agent schema: `{extra}`"
                        )
                    else:
                        st.success("✅ Handoff schema matches perfectly.")

        # Stage 5 results
        if "action" in pipeline_results:
            with st.expander("**Stage 5:** Action Agent Execution Results", expanded=True):
                for i, action_state in enumerate(pipeline_results["action"]):
                    st.markdown(f"---")
                    st.markdown(f"**Action {i + 1}:**")

                    a_cols = st.columns(4)
                    a_cols[0].metric(
                        "Action Type", action_state.get("action_type", "—")
                    )
                    a_cols[1].metric(
                        "High Risk?",
                        "Yes" if action_state.get("is_high_risk") else "No",
                    )
                    a_cols[2].metric(
                        "Approved?",
                        "Yes" if action_state.get("human_approved") else "No",
                    )
                    a_cols[3].metric(
                        "Audit ID", action_state.get("audit_id", "—"),
                    )

                    exec_result = action_state.get("execution_result")
                    if exec_result:
                        status = exec_result.get("status", "unknown")
                        if status == "success":
                            st.success(f"Tool executed successfully.")
                        elif status == "cancelled":
                            st.warning(
                                f"Execution cancelled: "
                                f"{exec_result.get('reason', '—')}"
                            )
                        else:
                            st.info(f"Status: `{status}`")
                        st.json(exec_result)

                    if action_state.get("error"):
                        st.error(f"Error: `{action_state['error']}`")
