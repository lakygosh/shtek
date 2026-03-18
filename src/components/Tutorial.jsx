import { useState, useEffect } from "react";

const STEPS = [
  {
    tab: null,
    title: "Welcome to Money Planner!",
    icon: "💰",
    body: "This quick tour will walk you through each section of the app so you can start managing your finances right away.",
    tip: "You can revisit this tutorial anytime from Settings.",
  },
  {
    tab: "dashboard",
    title: "Overview",
    icon: "◈",
    body: "This is your financial command center. At the top, enter your gross monthly income and tax rate — the app calculates your net income automatically.",
    tip: "The four stat boxes show your Net Income, Expenses, Surplus (what's left after expenses), and Savings Rate. Green means healthy, red means you're overspending.",
  },
  {
    tab: "dashboard",
    title: "Overview — Goals & Ideal Life",
    icon: "◈",
    body: "Below the income card you'll see mini-cards for your top savings goals and your Ideal Life snapshot. These update in real-time as you add data in other tabs.",
    tip: "The summary box at the bottom gives you a quick narrative of your entire financial picture in one sentence.",
  },
  {
    tab: "daily",
    title: "Daily Expense Log",
    icon: "✎",
    body: "Record every purchase as it happens. Pick a date, enter the amount, choose a category, and add a short description. Hit \"Add\" and it's saved instantly.",
    tip: "You can toggle between EUR and RSD with the currency button. Tap any entry to edit it, or hit × to delete. Use the month and category filters to find past entries.",
  },
  {
    tab: "daily",
    title: "Daily — Stats & Charts",
    icon: "✎",
    body: "At the top you'll see spending stats: Today, Last 7 Days, This Month, and your Daily Average. The donut chart breaks down spending by category so you can spot where your money goes.",
    tip: "All amounts show both EUR and RSD. The chart legend shows each category's total — useful for identifying your biggest spending areas.",
  },
  {
    tab: "expenses",
    title: "Monthly Budget",
    icon: "▤",
    body: "Define your recurring expenses here — rent, subscriptions, groceries, etc. Each expense has a name, category, priority, amount, and frequency (daily, weekly, monthly, yearly).",
    tip: "The app auto-converts everything to monthly and annual totals. Drag rows to reorder by importance. Charts at the top show your budget breakdown by category.",
  },
  {
    tab: "expenses",
    title: "Budget — Priorities & Categories",
    icon: "▤",
    body: "Assign each expense a priority: Essential (needs), Important (valuable), or Nice-to-Have (wants). This helps you see where to cut if needed.",
    tip: "Use \"Add Expense\" at the bottom to create new entries. On mobile, expenses appear as cards. On desktop, you get a full table with inline editing.",
  },
  {
    tab: "goals",
    title: "Savings Goals",
    icon: "⌂",
    body: "Create goals for things you're saving toward — a home, car, vacation, emergency fund, and more. Each goal appears as a card showing your progress at a glance.",
    tip: "Click the \"+\" card or \"New Goal\" to pick from 10 specialized templates. Each template has built-in calculators tailored to that goal type.",
  },
  {
    tab: "goals",
    title: "Goals — Templates & Forecasting",
    icon: "⌂",
    body: "Templates like Home, Car, and Education include loan/mortgage calculators. Set a target amount, how much you've saved, and a deadline — the app calculates your required monthly contribution.",
    tip: "The forecast shows whether you're on track or behind. If behind, it tells you exactly how much more per month you need. You can archive completed goals instead of deleting them.",
  },
  {
    tab: "ideal",
    title: "Ideal Life Cost",
    icon: "✦",
    body: "Dream big here. Add the expenses your ideal lifestyle would require — the apartment, travel, hobbies, dining. The app calculates how much gross income you'd need to afford it all.",
    tip: "The Gap stat shows the difference between your current income and what you'd need. The growth percentage tells you how much your income needs to increase to reach your ideal life.",
  },
  {
    tab: "settings",
    title: "Settings — Categories",
    icon: "⚙",
    body: "Customize your expense categories here. Add new ones with custom names and colors, or hide built-in categories you don't use. Changes apply everywhere — Budget, Daily Log, and Ideal.",
    tip: "Click a category's color square to pick from the palette. Click a category name to rename it. Hidden defaults can be restored anytime from the \"Removed\" section.",
  },
  {
    tab: null,
    title: "You're all set!",
    icon: "🎉",
    body: "Start by entering your income on the Overview tab, then add your monthly expenses in Budget. Log daily purchases in the Daily tab, and set up savings goals in Goals.",
    tip: "Recommended first steps:\n1. Set your income & tax rate\n2. Add recurring expenses\n3. Create your first savings goal\n4. Start logging daily purchases",
  },
];

export default function Tutorial({ onClose, onNavigate }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  // Navigate to the relevant tab when step changes
  useEffect(() => {
    if (current.tab) {
      onNavigate(current.tab);
    }
  }, [step, current.tab, onNavigate]);

  return (
    <div className="tutorial-overlay" onClick={onClose}>
      <div className="tutorial-card" onClick={e => e.stopPropagation()}>
        {/* Step indicator */}
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 16 }}>
          {STEPS.map((_, i) => (
            <button key={i} onClick={() => setStep(i)}
              style={{
                width: i === step ? 20 : 6, height: 6, borderRadius: 3,
                background: i === step ? "#8FB996" : i < step ? "#5a7a5e" : "#333",
                border: "none", cursor: "pointer", transition: "all 0.2s", padding: 0,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 36 }}>{current.icon}</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#e8e4de", textAlign: "center", marginBottom: 4 }}>
          {current.title}
        </div>
        <div style={{ fontSize: 11, color: "#666", textAlign: "center", marginBottom: 14 }}>
          Step {step + 1} of {STEPS.length}
        </div>
        <div style={{ fontSize: 14, color: "#c5bfb5", lineHeight: 1.6, marginBottom: 14 }}>
          {current.body}
        </div>
        <div style={{
          fontSize: 12, color: "#a09888", lineHeight: 1.6,
          background: "#1e1b17", borderRadius: 8, padding: "10px 12px",
          border: "1px solid #2a2520", whiteSpace: "pre-line",
        }}>
          <span style={{ color: "#8FB996", fontWeight: 600 }}>Tip: </span>{current.tip}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          {!isFirst && (
            <button onClick={() => setStep(step - 1)} style={{
              background: "#2a2520", border: "1px solid #333", borderRadius: 8,
              padding: "10px 16px", color: "#888", fontSize: 13, cursor: "pointer", flex: 1,
            }}>
              Back
            </button>
          )}
          {isFirst && (
            <button onClick={onClose} style={{
              background: "#2a2520", border: "1px solid #333", borderRadius: 8,
              padding: "10px 16px", color: "#888", fontSize: 13, cursor: "pointer", flex: 1,
            }}>
              Skip
            </button>
          )}
          {!isLast ? (
            <button onClick={() => setStep(step + 1)} style={{
              background: "#8FB996", border: "none", borderRadius: 8,
              padding: "10px 16px", color: "#121010", fontSize: 13, fontWeight: 600, cursor: "pointer", flex: 1,
            }}>
              Next
            </button>
          ) : (
            <button onClick={onClose} style={{
              background: "#8FB996", border: "none", borderRadius: 8,
              padding: "10px 16px", color: "#121010", fontSize: 13, fontWeight: 600, cursor: "pointer", flex: 1,
            }}>
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
