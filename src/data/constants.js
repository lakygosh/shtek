export const FREQ_MULTIPLIERS = {
  Daily: 30,
  Weekly: 4.33,
  Monthly: 1,
  Quarterly: 1 / 3,
  Yearly: 1 / 12,
};

export const DEFAULT_CATEGORIES = [
  { name: "Housing", color: "#E8B4B8", builtin: true },
  { name: "Food", color: "#B8D4E3", builtin: true },
  { name: "Transport", color: "#D4C5A9", builtin: true },
  { name: "Utilities", color: "#A9C5B7", builtin: true },
  { name: "Health", color: "#C5B8D4", builtin: true },
  { name: "Entertainment", color: "#E3C9B8", builtin: true },
  { name: "Education", color: "#B8C5E3", builtin: true },
  { name: "Personal Care", color: "#D4B8C5", builtin: true },
  { name: "Subscriptions", color: "#C5D4B8", builtin: true },
  { name: "Savings", color: "#8FB996", builtin: true },
  { name: "Debt/Loans", color: "#D49A9A", builtin: true },
  { name: "Clothing", color: "#B8B8D4", builtin: true },
  { name: "Other", color: "#C5C5C5", builtin: true },
];

export const PALETTE = [
  "#E8B4B8", "#B8D4E3", "#D4C5A9", "#A9C5B7", "#C5B8D4",
  "#E3C9B8", "#B8C5E3", "#D4B8C5", "#C5D4B8", "#8FB996",
  "#D49A9A", "#B8B8D4", "#C5C5C5", "#E8D4A9", "#A9D4C5",
  "#D4A9B8", "#B8E3C9", "#C5A9D4", "#A9B8E3", "#D4E3B8",
];

export function buildCategories(customCategories = [], hiddenCategories = []) {
  const hidden = new Set(hiddenCategories);
  const all = DEFAULT_CATEGORIES.filter(c => !hidden.has(c.name));
  for (const c of customCategories) {
    if (!all.find(a => a.name === c.name)) {
      all.push({ name: c.name, color: c.color, builtin: false });
    }
  }
  return all;
}

export function getCatNames(cats) {
  return cats.map(c => c.name);
}

export function getCatColors(cats) {
  const map = {};
  for (const c of cats) map[c.name] = c.color;
  return map;
}

export const PRIORITIES = ["Essential", "Important", "Nice-to-Have"];

export const PRIO_COLORS = {
  Essential: "#8FB996", Important: "#B8C5E3", "Nice-to-Have": "#D4C5A9",
};

export const EUR_RSD = 117.5;

export function toEur(rsd) { return rsd / EUR_RSD; }
export function toRsd(eur) { return eur * EUR_RSD; }

export function monthCost(amount, freq) {
  return (amount || 0) * (FREQ_MULTIPLIERS[freq] || 1);
}
