import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { monthCost, buildCategories, getCatNames, getCatColors } from "./data/constants";
import { useAuth } from "./hooks/useAuth";
import { useSettings, useExpenses, useDailyEntries, useGoals, useFeedback, seedDefaultData } from "./hooks/useSupabaseData";
import { NumberInput, Card, StatBox } from "./components/ui";
import DonutChart from "./components/DonutChart";
import ExpenseTable from "./components/ExpenseTable";
import DailyLog from "./components/DailyLog";
import AuthPage from "./components/AuthPage";
import SettingsPage from "./components/SettingsPage";
import GoalsTab from "./components/GoalsTab";
import Tutorial from "./components/Tutorial";
import FeedbackForm from "./components/FeedbackForm";
import AdminReports from "./components/AdminReports";
import ImportModal from "./components/ImportModal";

const ADMIN_EMAIL = "lazar22.gosic@gmail.com";
import { getTemplate } from "./data/goalTemplates";

function GoalMiniCard({ goal }) {
  const tmpl = getTemplate(goal.template);
  const calc = tmpl.calculate(goal);
  const target = goal.template === "emergency" && calc.targetAmount ? calc.targetAmount : goal.target_amount;
  const pct = target > 0 ? Math.min((goal.current_savings / target) * 100, 100) : 0;
  const saved = Math.min(goal.current_savings, target);
  const remaining = Math.max(target - saved, 0);

  const chartData = [
    { label: "Saved", value: saved, color: "#8FB996" },
    { label: "Remaining", value: remaining, color: "#2a2520" },
  ].filter(d => d.value > 0);

  let mainStat = `€${Math.round(calc.remaining).toLocaleString()} left`;
  if (goal.template === "housing" && calc.mortgagePayment) {
    mainStat = `€${calc.mortgagePayment.toFixed(0)}/mo mortgage`;
  } else if (goal.template === "car" && calc.monthlyPayment) {
    mainStat = `€${calc.monthlyPayment.toFixed(0)}/mo loan`;
  } else if (goal.template === "retirement" && calc.projectedTotal) {
    mainStat = `€${Math.round(calc.projectedTotal).toLocaleString()} projected`;
  }

  return (
    <Card>
      <h3 style={{ margin: "0 0 10px", fontSize: 13, color: "#888", fontWeight: 500 }}>{goal.icon} {goal.name.toUpperCase()}</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flexShrink: 0 }}>
          <DonutChart data={chartData} size={110} centerLabel={`${pct.toFixed(0)}%`} centerSub="saved" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <StatBox label={`€${goal.current_savings.toLocaleString()} saved`} value={`€${Math.round(target).toLocaleString()}`} sub="target" />
          <div style={{ textAlign: "center", fontSize: 12, color: "#c5bfb5" }}>
            {calc.monthsLeft === Infinity ? "Set contribution" : calc.monthsLeft <= 0 ? "Goal reached!" : `${calc.monthsLeft} months (${(calc.monthsLeft / 12).toFixed(1)} yrs)`}
          </div>
          <div style={{ textAlign: "center", marginTop: 4, fontSize: 11, color: "#888" }}>
            <span style={{ color: "#D4C5A9", fontWeight: 600 }}>{mainStat}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Dashboard({ settings, update, expenses, goals, idealExpenses, catColors, idealTotal, idealGross, incomeGap, growthNeeded }) {
  const grossIncome = settings.gross_income;
  const taxRate = settings.tax_rate;
  const netIncome = grossIncome * (1 - taxRate / 100);
  const totalExpenses = expenses.reduce((s, i) => s + monthCost(i.amount, i.frequency), 0);
  const surplus = netIncome - totalExpenses;
  const savingsRate = netIncome > 0 ? (surplus / netIncome) * 100 : 0;

  const activeGoals = goals.filter(g => !g.is_archived);
  const topGoals = activeGoals.slice(0, 2);

  // Ideal life pie data: breakdown by category
  const idealChartData = useMemo(() => {
    if (idealExpenses.length === 0) return [];
    const byCat = {};
    for (const item of idealExpenses) {
      const mc = monthCost(item.amount, item.frequency);
      if (mc > 0) {
        byCat[item.category] = (byCat[item.category] || 0) + mc;
      }
    }
    return Object.entries(byCat).map(([cat, val]) => ({
      label: cat,
      value: val,
      color: catColors[cat] || "#C5C5C5",
    }));
  }, [idealExpenses, catColors]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <div className="input-row" style={{ marginBottom: 16 }}>
          <NumberInput label="Gross Monthly Income" value={grossIncome} onChange={v => update({ gross_income: v })} />
          <NumberInput label="Tax Rate" value={taxRate} onChange={v => update({ tax_rate: v })} prefix="" suffix="%" small step={0.5} />
        </div>
        <div className="stats-grid" style={{ borderTop: "1px solid #2a2520", paddingTop: 12 }}>
          <StatBox label="Net Income" value={`€${netIncome.toFixed(0)}`} sub="/month" />
          <StatBox label="Expenses" value={`€${totalExpenses.toFixed(0)}`} sub="/month" color="#D49A9A" />
          <StatBox label="Surplus" value={`€${surplus.toFixed(0)}`} sub="/month" color={surplus >= 0 ? "#8FB996" : "#D49A9A"} big />
          <StatBox label="Savings Rate" value={`${savingsRate.toFixed(0)}%`} color={savingsRate >= 20 ? "#8FB996" : savingsRate >= 10 ? "#D4C5A9" : "#D49A9A"} />
        </div>
        {surplus < 0 && (
          <div style={{ marginTop: 12, padding: "10px 12px", background: "#2a1a1a", borderRadius: 8, border: "1px solid #4a2020", fontSize: 13, color: "#D49A9A" }}>
            ⚠ Expenses exceed income by €{Math.abs(surplus).toFixed(0)}/month.
          </div>
        )}
      </Card>
      <div className="dash-grid">
        {topGoals.length > 0 ? (
          topGoals.map(g => <GoalMiniCard key={g.id} goal={g} />)
        ) : (
          <Card>
            <h3 style={{ margin: "0 0 10px", fontSize: 13, color: "#888", fontWeight: 500 }}>🎯 GOALS</h3>
            <div style={{ textAlign: "center", fontSize: 12, color: "#666", padding: "12px 0" }}>No goals yet — create one in the Goals tab</div>
          </Card>
        )}
        {topGoals.length < 2 && (
          <Card>
            <h3 style={{ margin: "0 0 10px", fontSize: 13, color: "#888", fontWeight: 500 }}>✦ IDEAL LIFE</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flexShrink: 0 }}>
                {idealChartData.length > 0
                  ? <DonutChart data={idealChartData} size={110} />
                  : <div style={{ width: 110, height: 110, display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: 10 }}>No data</div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <StatBox label="Required Gross" value={`€${idealGross.toFixed(0)}`} sub="/month" color="#B8C5E3" big />
                <div style={{ textAlign: "center", fontSize: 12, color: "#c5bfb5" }}>
                  Cost: €{idealTotal.toFixed(0)}/mo · Gap: <span style={{ color: incomeGap > 0 ? "#D49A9A" : "#8FB996" }}>€{incomeGap.toFixed(0)}</span>
                </div>
                {growthNeeded > 0 && <div style={{ textAlign: "center", marginTop: 4, fontSize: 11, color: "#888" }}>Need <span style={{ color: "#D4C5A9", fontWeight: 600 }}>{growthNeeded.toFixed(0)}%</span> growth</div>}
              </div>
            </div>
          </Card>
        )}
      </div>
      {topGoals.length >= 2 && (
        <Card>
          <h3 style={{ margin: "0 0 10px", fontSize: 13, color: "#888", fontWeight: 500 }}>✦ IDEAL LIFE</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flexShrink: 0 }}>
              {idealChartData.length > 0
                ? <DonutChart data={idealChartData} size={110} />
                : <div style={{ width: 110, height: 110, display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: 10 }}>No data</div>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <StatBox label="Required Gross" value={`€${idealGross.toFixed(0)}`} sub="/month" color="#B8C5E3" big />
              <div style={{ textAlign: "center", fontSize: 12, color: "#c5bfb5" }}>
                Cost: €{idealTotal.toFixed(0)}/mo · Gap: <span style={{ color: incomeGap > 0 ? "#D49A9A" : "#8FB996" }}>€{incomeGap.toFixed(0)}</span>
              </div>
              {growthNeeded > 0 && <div style={{ textAlign: "center", marginTop: 4, fontSize: 11, color: "#888" }}>Need <span style={{ color: "#D4C5A9", fontWeight: 600 }}>{growthNeeded.toFixed(0)}%</span> growth</div>}
            </div>
          </div>
        </Card>
      )}
      <Card style={{ background: "#1a1916", border: "1px solid #2a2820" }}>
        <div style={{ fontSize: 12, color: "#c5bfb5", lineHeight: 1.7 }}>
          <strong style={{ color: "#e8e4de" }}>Summary:</strong> €{grossIncome} gross → €{netIncome.toFixed(0)} net. Expenses €{totalExpenses.toFixed(0)}/mo, surplus €{surplus.toFixed(0)}.
          Ideal life needs <strong style={{ color: "#B8C5E3" }}>€{idealGross.toFixed(0)}/mo</strong> gross.
          {activeGoals.length > 0 && ` Tracking ${activeGoals.length} savings goal${activeGoals.length > 1 ? "s" : ""}.`}
        </div>
      </Card>
    </div>
  );
}

function AppContent({ user, onSignOut }) {
  const [tab, setTab] = useState("dashboard");
  const [showTutorial, setShowTutorial] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const isAdmin = user.email === ADMIN_EMAIL;
  const { settings, loading: settingsLoading, update: updateSettings } = useSettings(user.id);
  const { items: expenses, loading: expLoading, setItems: setExpenses } = useExpenses(user.id, false);
  const { items: idealExpenses, loading: idealLoading, setItems: setIdealExpenses } = useExpenses(user.id, true);
  const { entries: dailyEntries, loading: dailyLoading, addEntry, bulkAddEntries, updateEntry, deleteEntry } = useDailyEntries(user.id);
  const { goals, loading: goalsLoading, addGoal, bulkAddGoals, updateGoal, deleteGoal } = useGoals(user.id);
  const { items: feedbackItems, loading: feedbackLoading, addFeedback, updateFeedback, deleteFeedback } = useFeedback(user.id, isAdmin);

  const loading = settingsLoading || expLoading || idealLoading || dailyLoading || goalsLoading || feedbackLoading;

  // Seed defaults for brand-new users (all sections empty)
  const [seeding, setSeeding] = useState(false);
  const seeded = useRef(false);
  useEffect(() => {
    if (loading || seeded.current || seeding) return;
    const isEmpty = expenses.length === 0 && idealExpenses.length === 0 && goals.length === 0 && dailyEntries.length === 0;
    if (!isEmpty) return;
    seeded.current = true;
    setSeeding(true);
    seedDefaultData(user.id).then(() => {
      window.location.reload();
    });
  }, [loading, expenses, idealExpenses, goals, dailyEntries, user.id, seeding]);

  // Build categories from defaults + user's custom ones, minus hidden defaults
  const customCategories = settings?.custom_categories || [];
  const hiddenCategories = settings?.hidden_categories || [];
  const categories = useMemo(() => buildCategories(customCategories, hiddenCategories), [customCategories, hiddenCategories]);
  const catNames = useMemo(() => getCatNames(categories), [categories]);
  const catColors = useMemo(() => getCatColors(categories), [categories]);

  const updateCategories = useCallback((newCustom) => {
    updateSettings({ custom_categories: newCustom });
  }, [updateSettings]);

  const updateHiddenCategories = useCallback((newHidden) => {
    updateSettings({ hidden_categories: newHidden });
  }, [updateSettings]);

  if (loading || !settings || seeding) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "#888", fontSize: 14 }}>
        {seeding ? "Setting up your account with sample data..." : "Loading your data..."}
      </div>
    );
  }

  const taxRate = settings.tax_rate;
  const idealTotal = idealExpenses.reduce((s, i) => s + monthCost(i.amount, i.frequency), 0);
  const idealGross = idealTotal / (1 - taxRate / 100);
  const incomeGap = idealGross - settings.gross_income;
  const growthNeeded = settings.gross_income > 0 ? (incomeGap / settings.gross_income) * 100 : 0;

  const tabs = [
    { id: "dashboard", icon: "◈", label: "Overview" },
    { id: "daily", icon: "✎", label: "Daily" },
    { id: "expenses", icon: "▤", label: "Budget" },
    { id: "goals", icon: "⌂", label: "Goals" },
    { id: "ideal", icon: "✦", label: "Ideal" },
    { id: "settings", icon: "⚙", label: "Settings" },
    ...(isAdmin ? [{ id: "reports", icon: "📋", label: "Reports" }] : []),
  ];

  return (
    <div style={{ background: "#121010", color: "#e8e4de", minHeight: "100vh" }}>
      <div className="app-header">
        <div className="header-top">
          <span style={{ fontSize: 20, opacity: 0.6 }}>💰</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: "#e8e4de", letterSpacing: "-0.5px" }}>Money Planner</span>
          <div style={{ flex: 1 }} />
          <span className="header-email" style={{ fontSize: 12, color: "#666", marginRight: 4 }}>{user.email}</span>
          <button onClick={() => setShowImport(true)} style={{
            background: "#2a2520", border: "1px solid #B8C5E3", borderRadius: 6,
            padding: "6px 12px", color: "#B8C5E3", fontSize: 12, cursor: "pointer",
          }}>Import</button>
          <button onClick={() => setShowFeedback(true)} style={{
            background: "#2a2520", border: "1px solid #D4C5A9", borderRadius: 6,
            padding: "6px 12px", color: "#D4C5A9", fontSize: 12, cursor: "pointer",
          }}>Feedback</button>
          <button onClick={() => setShowTutorial(true)} style={{
            background: "#2a2520", border: "1px solid #8FB996", borderRadius: 6,
            padding: "6px 12px", color: "#8FB996", fontSize: 12, cursor: "pointer",
          }}>? Tutorial</button>
          <button onClick={onSignOut} style={{
            background: "#2a2520", border: "1px solid #333", borderRadius: 6,
            padding: "6px 12px", color: "#888", fontSize: 12, cursor: "pointer",
          }}>Log out</button>
        </div>
        <div className="desktop-nav">
          {tabs.map(t => (
            <button key={t.id} className="nav-btn" onClick={() => setTab(t.id)}
              style={{ borderBottom: tab === t.id ? "2px solid #8FB996" : "2px solid transparent" }}>
              <span className="nav-icon" style={{ color: tab === t.id ? "#e8e4de" : "#666" }}>{t.icon}</span>
              <span className="nav-label" style={{ color: tab === t.id ? "#e8e4de" : "#666", fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {tab === "dashboard" && (
          <Dashboard settings={settings} update={updateSettings} expenses={expenses} goals={goals}
            idealExpenses={idealExpenses} catColors={catColors}
            idealTotal={idealTotal} idealGross={idealGross} incomeGap={incomeGap} growthNeeded={growthNeeded} />
        )}

        {tab === "daily" && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#e8e4de", marginBottom: 4 }}>Daily Expense Log</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Record every purchase. Tap an entry to edit it.</div>
            <DailyLog entries={dailyEntries} addEntry={addEntry} updateEntry={updateEntry} deleteEntry={deleteEntry}
              catNames={catNames} catColors={catColors} budgetExpenses={expenses} />
          </div>
        )}

        {tab === "expenses" && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#e8e4de", marginBottom: 4 }}>Monthly Budget</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Your recurring expenses. Auto-calculates monthly and annual totals.</div>
            <Card><ExpenseTable items={expenses} setItems={setExpenses} catNames={catNames} catColors={catColors} /></Card>
          </div>
        )}

        {tab === "goals" && <GoalsTab goals={goals} addGoal={addGoal} updateGoal={updateGoal} deleteGoal={deleteGoal} />}

        {tab === "ideal" && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#e8e4de", marginBottom: 4 }}>Ideal Life Cost</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>The life you want. See how much you need to earn.</div>
            <Card style={{ marginBottom: 16, background: "#1a1916", border: "1px solid #2a2820" }}>
              <div className="stats-grid">
                <StatBox label="Monthly Cost" value={`€${idealTotal.toFixed(0)}`} color="#B8C5E3" />
                <StatBox label="Gross Needed" value={`€${idealGross.toFixed(0)}`} sub={`€${(idealGross * 12).toFixed(0)}/yr`} color="#8FB996" big />
                <StatBox label="Gap" value={`€${incomeGap.toFixed(0)}`} sub={`${growthNeeded.toFixed(0)}% growth`} color={incomeGap > 0 ? "#D4C5A9" : "#8FB996"} />
              </div>
            </Card>
            <Card><ExpenseTable items={idealExpenses} setItems={setIdealExpenses} catNames={catNames} catColors={catColors} /></Card>
          </div>
        )}

        {tab === "settings" && (
          <SettingsPage categories={categories} customCategories={customCategories}
            hiddenCategories={hiddenCategories} onUpdateCategories={updateCategories}
            onUpdateHiddenCategories={updateHiddenCategories} user={user} onSignOut={onSignOut} />
        )}

        {tab === "reports" && isAdmin && (
          <AdminReports items={feedbackItems} onUpdate={updateFeedback} onDelete={deleteFeedback} />
        )}
      </div>

      <div className="mobile-nav">
        {tabs.map(t => (
          <button key={t.id} className="nav-btn" onClick={() => setTab(t.id)}>
            <span className="nav-icon" style={{ color: tab === t.id ? "#8FB996" : "#666" }}>{t.icon}</span>
            <span className="nav-label" style={{ color: tab === t.id ? "#8FB996" : "#555", fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {showFeedback && (
        <FeedbackForm
          onSubmit={(entry) => addFeedback({ ...entry, user_email: user.email })}
          onClose={() => setShowFeedback(false)}
          userFeedback={feedbackItems.filter(f => f.user_id === user.id)}
        />
      )}

      {showTutorial && (
        <Tutorial onClose={() => setShowTutorial(false)} onNavigate={setTab} />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImportExpenses={setExpenses}
          onImportDailyEntries={bulkAddEntries}
          onImportGoals={bulkAddGoals}
          onImportSettings={updateSettings}
          existingExpenses={expenses}
        />
      )}
    </div>
  );
}

export default function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return (
      <div style={{ background: "#121010", color: "#888", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  if (!user) return <AuthPage onGoogleSignIn={signInWithGoogle} />;

  return <AppContent key={user.id} user={user} onSignOut={signOut} />;
}
