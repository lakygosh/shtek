import { useState, useMemo } from "react";
import { Card, NumberInput, StatBox } from "./ui";
import { GOAL_TEMPLATES, EXTRA_FIELD_CONFIG, getTemplate, createGoalDefaults } from "../data/goalTemplates";

// ── Template Picker (create new goal) ──
function TemplatePicker({ onSelect, onCancel }) {
  const templates = Object.values(GOAL_TEMPLATES);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onCancel} style={{
          background: "#2a2520", border: "1px solid #333", borderRadius: 6,
          padding: "6px 12px", color: "#888", fontSize: 12, cursor: "pointer",
        }}>← Back</button>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#e8e4de" }}>Choose a Template</div>
      </div>
      <div className="goals-grid">
        {templates.map(t => (
          <button key={t.key} onClick={() => onSelect(t.key)} className="goal-template-card">
            <span style={{ fontSize: 28 }}>{t.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e8e4de" }}>{t.name}</span>
            <span style={{ fontSize: 11, color: "#888", lineHeight: 1.4 }}>{t.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Forecast Calculator ──
function computeForecast(goal, target) {
  const remaining = Math.max(target - goal.current_savings, 0);
  if (remaining <= 0) return { status: "reached", requiredMonthly: 0, forecastDate: null, monthsBehind: 0 };

  const now = new Date();
  let deadlineMonths = null;
  let requiredMonthly = null;

  if (goal.deadline) {
    const dl = new Date(goal.deadline);
    deadlineMonths = Math.max((dl.getFullYear() - now.getFullYear()) * 12 + (dl.getMonth() - now.getMonth()), 1);
    requiredMonthly = remaining / deadlineMonths;
  }

  let forecastDate = null;
  let forecastMonths = null;
  if (goal.monthly_contribution > 0) {
    forecastMonths = Math.ceil(remaining / goal.monthly_contribution);
    forecastDate = new Date(now.getFullYear(), now.getMonth() + forecastMonths, now.getDate());
  }

  let status = "no_contribution"; // no monthly set
  let monthsBehind = 0;
  if (goal.monthly_contribution > 0 && deadlineMonths != null) {
    if (forecastMonths <= deadlineMonths) {
      status = "on_track";
    } else {
      status = "behind";
      monthsBehind = forecastMonths - deadlineMonths;
    }
  } else if (goal.monthly_contribution > 0) {
    status = "no_deadline";
  } else if (deadlineMonths != null) {
    status = "need_contribution";
  }

  return { status, requiredMonthly, forecastDate, forecastMonths, deadlineMonths, monthsBehind, remaining };
}

function formatDate(d) {
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

// ── Progress Bar ──
function ProgressBar({ current, target, color = "#8FB996" }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div style={{ width: "100%", height: 6, background: "#2a2520", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.3s" }} />
    </div>
  );
}

// ── Goal Card (overview in grid) ──
function GoalCard({ goal, onClick }) {
  const tmpl = getTemplate(goal.template);
  const calc = tmpl.calculate(goal);
  const target = goal.template === "emergency" && calc.targetAmount ? calc.targetAmount : goal.target_amount;
  const pct = target > 0 ? Math.min((goal.current_savings / target) * 100, 100) : 0;
  const forecast = computeForecast(goal, target);

  let statusLine = null;
  if (forecast.status === "reached") {
    statusLine = { text: "Goal reached!", color: "#8FB996" };
  } else if (forecast.status === "on_track") {
    statusLine = { text: `On track — done by ${formatDate(forecast.forecastDate)}`, color: "#8FB996" };
  } else if (forecast.status === "behind") {
    statusLine = { text: `${forecast.monthsBehind} mo behind deadline`, color: "#D49A9A" };
  } else if (forecast.status === "no_deadline" && forecast.forecastDate) {
    statusLine = { text: `Est. ${formatDate(forecast.forecastDate)}`, color: "#B8C5E3" };
  } else if (forecast.status === "need_contribution" && forecast.requiredMonthly) {
    statusLine = { text: `Need €${Math.ceil(forecast.requiredMonthly)}/mo`, color: "#D4C5A9" };
  }

  // Template-specific mini stat
  let miniStat = null;
  if (goal.template === "housing" && calc.mortgagePayment) {
    miniStat = `Mortgage: €${calc.mortgagePayment.toFixed(0)}/mo`;
  } else if (goal.template === "car" && calc.monthlyPayment) {
    miniStat = `Loan: €${calc.monthlyPayment.toFixed(0)}/mo`;
  } else if (goal.template === "retirement" && calc.projectedTotal) {
    miniStat = `Projected: €${Math.round(calc.projectedTotal).toLocaleString()}`;
  } else if (goal.template === "debt_payoff" && calc.totalInterest !== Infinity) {
    miniStat = `Interest: €${Math.round(calc.totalInterest).toLocaleString()}`;
  } else if (goal.template === "emergency" && calc.monthsCovered != null) {
    miniStat = `${calc.monthsCovered.toFixed(1)} months covered`;
  }

  return (
    <button onClick={onClick} className="goal-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{goal.icon}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#e8e4de", flex: 1, textAlign: "left" }}>{goal.name}</span>
        {goal.is_archived && <span style={{ fontSize: 10, color: "#666", background: "#2a2520", padding: "2px 6px", borderRadius: 4 }}>archived</span>}
      </div>
      <ProgressBar current={goal.current_savings} target={target} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 13 }}>
        <span style={{ color: "#8FB996", fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>€{goal.current_savings.toLocaleString()}</span>
        <span style={{ color: "#666" }}>/ €{Math.round(target).toLocaleString()}</span>
      </div>
      <div style={{ fontSize: 12, color: "#B8C5E3", marginTop: 4, fontWeight: 500 }}>
        {pct.toFixed(0)}% complete
      </div>
      {statusLine && <div style={{ fontSize: 11, color: statusLine.color, marginTop: 3 }}>{statusLine.text}</div>}
      {miniStat && <div style={{ fontSize: 10, color: "#a09888", marginTop: 3 }}>{miniStat}</div>}
    </button>
  );
}

// ── Extra Fields Renderer ──
function ExtraFields({ template, extra, onChange }) {
  const tmpl = getTemplate(template);
  const fields = Object.keys(tmpl.extraFields);
  if (fields.length === 0) return null;

  return (
    <div className="input-row" style={{ marginBottom: 16 }}>
      {fields.map(key => {
        const cfg = EXTRA_FIELD_CONFIG[key] || { label: key };
        if (cfg.type === "date") {
          return (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{cfg.label}</label>
              <input type="date" value={extra[key] || ""}
                onChange={e => onChange({ ...extra, [key]: e.target.value })}
                style={{
                  background: "#1e1a16", border: "1px solid #333", color: "#e8e4de",
                  fontSize: 13, borderRadius: 6, padding: "8px 10px", outline: "none",
                }} />
            </div>
          );
        }
        return (
          <NumberInput key={key} label={cfg.label} value={extra[key] ?? tmpl.extraFields[key]}
            onChange={v => onChange({ ...extra, [key]: v })}
            prefix={cfg.prefix ?? "€"} suffix={cfg.suffix ?? ""} small={cfg.small} step={cfg.step ?? 1} />
        );
      })}
    </div>
  );
}

// ── Template-specific Stats ──
function TemplateStats({ goal, calc }) {
  switch (goal.template) {
    case "housing":
      return (
        <div className="stats-grid" style={{ borderTop: "1px solid #2a2520", paddingTop: 12 }}>
          <StatBox label="Down Payment" value={`€${Math.round(calc.downPayment).toLocaleString()}`} sub={`${goal.extra?.down_pct || 15}%`} />
          <StatBox label="Still Need" value={`€${Math.round(calc.remaining).toLocaleString()}`} color={calc.remaining > 0 ? "#D4C5A9" : "#8FB996"} />
          <StatBox label="Loan Amount" value={`€${Math.round(calc.loanAmount).toLocaleString()}`} />
          <StatBox label="Monthly Mortgage" value={`€${calc.mortgagePayment.toFixed(0)}`} sub="/month" color="#8FB996" big />
          <StatBox label="Interest Paid" value={`€${Math.round(calc.interestPaid).toLocaleString()}`} color="#D49A9A" />
          <StatBox label="Total Cost" value={`€${Math.round(calc.totalLoanCost).toLocaleString()}`} />
        </div>
      );

    case "car":
      return (
        <div className="stats-grid" style={{ borderTop: "1px solid #2a2520", paddingTop: 12 }}>
          <StatBox label="Down Payment" value={`€${Math.round(calc.downPayment).toLocaleString()}`} sub={`${goal.extra?.down_pct || 20}%`} />
          <StatBox label="Loan Amount" value={`€${Math.round(calc.loanAmount).toLocaleString()}`} />
          <StatBox label="Monthly Payment" value={`€${calc.monthlyPayment.toFixed(0)}`} sub="/month" color="#8FB996" big />
          <StatBox label="Total Interest" value={`€${Math.round(calc.interestPaid).toLocaleString()}`} color="#D49A9A" />
        </div>
      );

    case "vacation":
      return (
        <div className="stats-grid" style={{ borderTop: "1px solid #2a2520", paddingTop: 12 }}>
          <StatBox label="Remaining" value={`€${Math.round(calc.remaining).toLocaleString()}`} color="#D4C5A9" />
          {calc.dailySavingsNeeded != null && (
            <StatBox label="Daily Target" value={`€${calc.dailySavingsNeeded.toFixed(2)}`} sub="/day" color="#B8C5E3" big />
          )}
        </div>
      );

    case "education":
      return (
        <div className="stats-grid" style={{ borderTop: "1px solid #2a2520", paddingTop: 12 }}>
          <StatBox label="Total Tuition" value={`€${Math.round(calc.totalTuition).toLocaleString()}`} />
          <StatBox label="Loan Needed" value={`€${Math.round(calc.loanAmount).toLocaleString()}`} color="#D4C5A9" />
          <StatBox label="Loan Payment" value={`€${calc.monthlyPayment.toFixed(0)}`} sub="/month" color="#8FB996" big />
        </div>
      );

    case "emergency":
      return (
        <div className="stats-grid" style={{ borderTop: "1px solid #2a2520", paddingTop: 12 }}>
          <StatBox label="Target Fund" value={`€${Math.round(calc.targetAmount).toLocaleString()}`} />
          <StatBox label="Months Covered" value={calc.monthsCovered.toFixed(1)} sub="months" color={calc.monthsCovered >= (goal.extra?.months_of_expenses || 6) ? "#8FB996" : "#D4C5A9"} big />
        </div>
      );

    case "wedding":
      return (
        <div className="stats-grid" style={{ borderTop: "1px solid #2a2520", paddingTop: 12 }}>
          <StatBox label="Estimated Cost" value={`€${Math.round(calc.estimatedTotal).toLocaleString()}`} sub={`${calc.guestCount} guests`} />
          <StatBox label="Remaining" value={`€${Math.round(calc.remaining).toLocaleString()}`} color="#D4C5A9" />
        </div>
      );

    case "retirement":
      return (
        <div className="stats-grid" style={{ borderTop: "1px solid #2a2520", paddingTop: 12 }}>
          <StatBox label="Years Left" value={calc.yearsToRetirement} sub="years" />
          <StatBox label="Projected Total" value={`€${Math.round(calc.projectedTotal).toLocaleString()}`} color="#8FB996" big />
          <StatBox label="vs Target" value={calc.projectedTotal >= goal.target_amount ? "On Track" : "Behind"}
            color={calc.projectedTotal >= goal.target_amount ? "#8FB996" : "#D49A9A"} />
        </div>
      );

    case "debt_payoff":
      return (
        <div className="stats-grid" style={{ borderTop: "1px solid #2a2520", paddingTop: 12 }}>
          <StatBox label="Remaining Debt" value={`€${Math.round(calc.remaining).toLocaleString()}`} color="#D49A9A" />
          <StatBox label="Monthly Payment" value={`€${calc.monthlyPayment.toFixed(0)}`} sub="/month" color="#8FB996" big />
          {calc.totalInterest !== Infinity && (
            <StatBox label="Total Interest" value={`€${Math.round(calc.totalInterest).toLocaleString()}`} color="#D4C5A9" />
          )}
        </div>
      );

    case "business":
      return (
        <div className="stats-grid" style={{ borderTop: "1px solid #2a2520", paddingTop: 12 }}>
          <StatBox label="Startup Costs" value={`€${Math.round(calc.startupCosts).toLocaleString()}`} />
          <StatBox label="Breakeven" value={calc.monthsToBreakeven === Infinity ? "—" : `${calc.monthsToBreakeven} mo`} sub="after launch" color="#B8C5E3" big />
        </div>
      );

    default:
      return (
        <div className="stats-grid" style={{ borderTop: "1px solid #2a2520", paddingTop: 12 }}>
          <StatBox label="Remaining" value={`€${Math.round(calc.remaining).toLocaleString()}`} color="#D4C5A9" />
        </div>
      );
  }
}

// ── Goal Detail View ──
function GoalDetail({ goal, onUpdate, onDelete, onBack }) {
  const tmpl = getTemplate(goal.template);
  const calc = useMemo(() => tmpl.calculate(goal), [goal, tmpl]);
  const target = goal.template === "emergency" && calc.targetAmount ? calc.targetAmount : goal.target_amount;
  const pct = target > 0 ? Math.min((goal.current_savings / target) * 100, 100) : 0;
  const forecast = useMemo(() => computeForecast(goal, target), [goal, target]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onBack} style={{
          background: "#2a2520", border: "1px solid #333", borderRadius: 6,
          padding: "6px 12px", color: "#888", fontSize: 12, cursor: "pointer",
        }}>← Back</button>
        <span style={{ fontSize: 22 }}>{goal.icon}</span>
        <input value={goal.name} onChange={e => onUpdate(goal.id, { name: e.target.value })}
          style={{
            background: "transparent", border: "none", color: "#e8e4de",
            fontSize: 18, fontWeight: 600, outline: "none", flex: 1, minWidth: 0,
          }} />
      </div>

      {/* Progress + Forecast */}
      <Card>
        <div style={{ marginBottom: 12 }}>
          <ProgressBar current={goal.current_savings} target={target} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 13 }}>
            <span style={{ color: "#8FB996", fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
              €{goal.current_savings.toLocaleString()} saved
            </span>
            <span style={{ color: "#888" }}>{pct.toFixed(1)}%</span>
          </div>
        </div>
        <div className="stats-grid">
          {forecast.requiredMonthly != null && (
            <StatBox label="Required Monthly" value={`€${Math.ceil(forecast.requiredMonthly)}`}
              sub="to hit deadline" color="#D4C5A9" big />
          )}
          {forecast.forecastDate && (
            <StatBox label="Forecast Date" value={formatDate(forecast.forecastDate)}
              sub={forecast.forecastMonths ? `${forecast.forecastMonths} months` : ""}
              color={forecast.status === "on_track" ? "#8FB996" : forecast.status === "behind" ? "#D49A9A" : "#B8C5E3"} big />
          )}
          {forecast.status === "reached" && (
            <StatBox label="Status" value="Done!" color="#8FB996" big />
          )}
        </div>
        {forecast.status === "behind" && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#2a1a1a", borderRadius: 8, border: "1px solid #4a2020", fontSize: 12, color: "#D49A9A" }}>
            ⚠ At €{goal.monthly_contribution}/mo you'll finish <strong>{forecast.monthsBehind} months late</strong>.
            {forecast.requiredMonthly != null && <> Need <strong>€{Math.ceil(forecast.requiredMonthly)}/mo</strong> to stay on track.</>}
          </div>
        )}
        {forecast.status === "on_track" && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#1a2018", borderRadius: 8, border: "1px solid #2a3820", fontSize: 12, color: "#8FB996" }}>
            ✓ On track to finish <strong>{forecast.forecastMonths <= forecast.deadlineMonths ? `${forecast.deadlineMonths - forecast.forecastMonths} months early` : "on time"}</strong> at €{goal.monthly_contribution}/mo.
          </div>
        )}
        {forecast.status === "need_contribution" && forecast.requiredMonthly != null && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#1a1916", borderRadius: 8, border: "1px solid #2a2820", fontSize: 12, color: "#D4C5A9" }}>
            Set monthly contribution to at least <strong>€{Math.ceil(forecast.requiredMonthly)}</strong> to hit your deadline.
          </div>
        )}
      </Card>

      {/* Common Fields */}
      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 13, color: "#888", fontWeight: 500 }}>
          {goal.template === "debt_payoff" ? "DEBT DETAILS" : "SAVINGS PLAN"}
        </h3>
        <div className="input-row" style={{ marginBottom: 16 }}>
          <NumberInput label={goal.template === "debt_payoff" ? "Total Debt" : "Target Amount"} value={goal.target_amount}
            onChange={v => onUpdate(goal.id, { target_amount: v })} />
          <NumberInput label="Saved So Far" value={goal.current_savings}
            onChange={v => onUpdate(goal.id, { current_savings: v })} />
          <NumberInput label="Monthly Contribution" value={goal.monthly_contribution}
            onChange={v => onUpdate(goal.id, { monthly_contribution: v })} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>Deadline (optional)</label>
          <input type="date" value={goal.deadline || ""}
            onChange={e => onUpdate(goal.id, { deadline: e.target.value || null })}
            style={{
              background: "#1e1a16", border: "1px solid #333", color: "#e8e4de",
              fontSize: 13, borderRadius: 6, padding: "8px 10px", outline: "none", maxWidth: 180,
            }} />
        </div>
      </Card>

      {/* Template-specific fields */}
      {Object.keys(tmpl.extraFields).length > 0 && (
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 13, color: "#888", fontWeight: 500 }}>
            {tmpl.name.toUpperCase()} DETAILS
          </h3>
          <ExtraFields template={goal.template} extra={goal.extra || {}}
            onChange={extra => onUpdate(goal.id, { extra })} />
          <TemplateStats goal={goal} calc={calc} />
        </Card>
      )}

      {/* Simple goals still get basic stats */}
      {Object.keys(tmpl.extraFields).length === 0 && (
        <Card>
          <TemplateStats goal={goal} calc={calc} />
        </Card>
      )}

      {/* Summary info box */}
      <Card style={{ background: "#1a1916", border: "1px solid #2a2820" }}>
        <div style={{ fontSize: 12, color: "#c5bfb5", lineHeight: 1.7 }}>
          <strong style={{ color: "#e8e4de" }}>Summary:</strong>{" "}
          {forecast.status === "reached"
            ? "You've reached your goal!"
            : forecast.forecastDate
              ? <>At <strong style={{ color: "#e8e4de" }}>€{goal.monthly_contribution}/mo</strong> you'll finish by <strong style={{ color: "#B8C5E3" }}>{formatDate(forecast.forecastDate)}</strong>.
                {goal.deadline && forecast.status === "behind" && <> That's <strong style={{ color: "#D49A9A" }}>{forecast.monthsBehind} months</strong> after your deadline. Increase to <strong style={{ color: "#8FB996" }}>€{Math.ceil(forecast.requiredMonthly)}/mo</strong> to stay on track.</>}
                {goal.deadline && forecast.status === "on_track" && <> You're on track for your deadline.</>}
              </>
              : goal.deadline && forecast.requiredMonthly
                ? <>You need <strong style={{ color: "#8FB996" }}>€{Math.ceil(forecast.requiredMonthly)}/mo</strong> to hit your deadline.</>
                : "Set a deadline or monthly contribution to see your forecast."
          }
          {goal.template === "housing" && calc.mortgagePayment && (
            <> Then <strong style={{ color: "#8FB996" }}>€{calc.mortgagePayment.toFixed(0)}/mo</strong> mortgage for {goal.extra?.loan_years || 25} years.</>
          )}
          {goal.template === "car" && calc.monthlyPayment && (
            <> Then <strong style={{ color: "#8FB996" }}>€{calc.monthlyPayment.toFixed(0)}/mo</strong> loan for {goal.extra?.loan_years || 5} years.</>
          )}
          {goal.template === "retirement" && calc.projectedTotal && (
            <> Projected value at retirement: <strong style={{ color: "#8FB996" }}>€{Math.round(calc.projectedTotal).toLocaleString()}</strong>.</>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onUpdate(goal.id, { is_archived: !goal.is_archived })} style={{
          background: "#2a2520", border: "1px solid #333", borderRadius: 8,
          padding: "10px 16px", color: "#888", fontSize: 13, cursor: "pointer", flex: 1,
        }}>
          {goal.is_archived ? "Unarchive" : "Archive"}
        </button>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{
            background: "#2a1a1a", border: "1px solid #4a2020", borderRadius: 8,
            padding: "10px 16px", color: "#D49A9A", fontSize: 13, cursor: "pointer",
          }}>
            Delete
          </button>
        ) : (
          <button onClick={() => { onDelete(goal.id); onBack(); }} style={{
            background: "#4a2020", border: "1px solid #6a3030", borderRadius: 8,
            padding: "10px 16px", color: "#e8e4de", fontSize: 13, cursor: "pointer", fontWeight: 600,
          }}>
            Confirm Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main GoalsTab ──
export default function GoalsTab({ goals, addGoal, updateGoal, deleteGoal }) {
  const [view, setView] = useState("list"); // list | new | detail
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeGoals = goals.filter(g => !g.is_archived);
  const archivedGoals = goals.filter(g => g.is_archived);
  const displayGoals = showArchived ? goals : activeGoals;
  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  const handleCreateGoal = async (templateKey) => {
    const defaults = createGoalDefaults(templateKey);
    defaults.sort_order = goals.length;
    const created = await addGoal(defaults);
    if (created) {
      setSelectedGoalId(created.id);
      setView("detail");
    }
  };

  if (view === "new") {
    return <TemplatePicker onSelect={handleCreateGoal} onCancel={() => setView("list")} />;
  }

  if (view === "detail" && selectedGoal) {
    return (
      <GoalDetail
        goal={selectedGoal}
        onUpdate={updateGoal}
        onDelete={deleteGoal}
        onBack={() => { setView("list"); setSelectedGoalId(null); }}
      />
    );
  }

  // List view
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#e8e4de" }}>Savings Goals</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Track what you're saving for</div>
        </div>
        {archivedGoals.length > 0 && (
          <button onClick={() => setShowArchived(!showArchived)} style={{
            background: "#2a2520", border: "1px solid #333", borderRadius: 6,
            padding: "6px 12px", color: "#888", fontSize: 11, cursor: "pointer",
          }}>
            {showArchived ? "Hide archived" : `${archivedGoals.length} archived`}
          </button>
        )}
      </div>

      {displayGoals.length === 0 && (
        <Card style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 15, color: "#e8e4de", fontWeight: 500, marginBottom: 6 }}>No goals yet</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Create your first savings goal to get started</div>
          <button onClick={() => setView("new")} style={{
            background: "#8FB996", border: "none", borderRadius: 8,
            padding: "10px 20px", color: "#121010", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            + New Goal
          </button>
        </Card>
      )}

      {displayGoals.length > 0 && (
        <div className="goals-grid">
          {displayGoals.map(g => (
            <GoalCard key={g.id} goal={g} onClick={() => { setSelectedGoalId(g.id); setView("detail"); }} />
          ))}
          <button onClick={() => setView("new")} className="goal-card goal-card-new">
            <span style={{ fontSize: 28, color: "#555" }}>+</span>
            <span style={{ fontSize: 13, color: "#888" }}>New Goal</span>
          </button>
        </div>
      )}
    </div>
  );
}
