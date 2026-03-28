export const DEFAULT_EXPENSES = [
  { id: 1, name: "Rent", category: "Housing", priority: "Essential", amount: 120, frequency: "Monthly", notes: "Parents' flat" },
  { id: 2, name: "Groceries", category: "Food", priority: "Essential", amount: 150, frequency: "Monthly", notes: "" },
  { id: 3, name: "Eating Out", category: "Food", priority: "Nice-to-Have", amount: 40, frequency: "Monthly", notes: "" },
  { id: 4, name: "Electricity", category: "Utilities", priority: "Essential", amount: 35, frequency: "Monthly", notes: "" },
  { id: 5, name: "Water", category: "Utilities", priority: "Essential", amount: 10, frequency: "Monthly", notes: "" },
  { id: 6, name: "Internet", category: "Utilities", priority: "Essential", amount: 25, frequency: "Monthly", notes: "" },
  { id: 7, name: "Mobile Phone", category: "Utilities", priority: "Essential", amount: 15, frequency: "Monthly", notes: "" },
  { id: 8, name: "Public Transport", category: "Transport", priority: "Essential", amount: 30, frequency: "Monthly", notes: "" },
  { id: 9, name: "Health Insurance", category: "Health", priority: "Essential", amount: 0, frequency: "Monthly", notes: "Via employer" },
  { id: 10, name: "Gym / Fitness", category: "Health", priority: "Important", amount: 25, frequency: "Monthly", notes: "" },
  { id: 11, name: "Streaming Services", category: "Subscriptions", priority: "Nice-to-Have", amount: 15, frequency: "Monthly", notes: "" },
  { id: 12, name: "Clothing", category: "Clothing", priority: "Important", amount: 120, frequency: "Quarterly", notes: "" },
  { id: 13, name: "Haircut", category: "Personal Care", priority: "Important", amount: 15, frequency: "Monthly", notes: "" },
  { id: 14, name: "Going Out / Social", category: "Entertainment", priority: "Nice-to-Have", amount: 20, frequency: "Weekly", notes: "" },
  { id: 15, name: "Education / Courses", category: "Education", priority: "Important", amount: 100, frequency: "Yearly", notes: "" },
  { id: 16, name: "Emergency Fund", category: "Savings", priority: "Essential", amount: 50, frequency: "Monthly", notes: "" },
  { id: 17, name: "Flat Savings", category: "Savings", priority: "Essential", amount: 100, frequency: "Monthly", notes: "Toward down payment" },
];

export const DEFAULT_GOALS = [
  {
    template: "emergency",
    name: "Emergency Fund",
    icon: "🛡️",
    target_amount: 6000,
    current_savings: 800,
    monthly_contribution: 100,
    deadline: null,
    extra: { months_of_expenses: 6, monthly_expenses: 1000 },
    is_archived: false,
  },
  {
    template: "housing",
    name: "Own Flat",
    icon: "🏠",
    target_amount: 75000,
    current_savings: 2400,
    monthly_contribution: 150,
    deadline: null,
    extra: { property_price: 75000, down_pct: 15, interest_rate: 4.5, loan_years: 25 },
    is_archived: false,
  },
  {
    template: "vacation",
    name: "Summer Vacation",
    icon: "✈️",
    target_amount: 1200,
    current_savings: 350,
    monthly_contribution: 100,
    deadline: null,
    extra: {},
    is_archived: false,
  },
];

// Generate sample daily entries relative to today so they always look recent
export function getDefaultDailyEntries() {
  const today = new Date();
  const d = (daysAgo) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - daysAgo);
    return dt.toISOString().slice(0, 10);
  };
  return [
    { date: d(0), amount: 4.50, category: "Food", description: "Coffee & pastry" },
    { date: d(0), amount: 22.00, category: "Food", description: "Groceries" },
    { date: d(1), amount: 2.80, category: "Transport", description: "Bus ticket" },
    { date: d(1), amount: 12.50, category: "Food", description: "Lunch at work" },
    { date: d(1), amount: 9.99, category: "Subscriptions", description: "Spotify monthly" },
    { date: d(2), amount: 35.00, category: "Clothing", description: "T-shirt" },
    { date: d(2), amount: 18.00, category: "Food", description: "Groceries" },
    { date: d(3), amount: 15.00, category: "Entertainment", description: "Cinema ticket" },
    { date: d(3), amount: 5.20, category: "Food", description: "Snacks" },
    { date: d(5), amount: 25.00, category: "Health", description: "Pharmacy" },
    { date: d(5), amount: 8.00, category: "Food", description: "Coffee with friends" },
    { date: d(6), amount: 45.00, category: "Food", description: "Weekly groceries" },
  ];
}

export const DEFAULT_IDEAL = [
  { id: 101, name: "Mortgage Payment", category: "Housing", priority: "Essential", amount: 350, frequency: "Monthly", notes: "Own flat" },
  { id: 102, name: "Condo / Maintenance Fees", category: "Housing", priority: "Essential", amount: 50, frequency: "Monthly", notes: "" },
  { id: 103, name: "Quality Groceries", category: "Food", priority: "Essential", amount: 250, frequency: "Monthly", notes: "" },
  { id: 104, name: "Restaurants / Dining", category: "Food", priority: "Nice-to-Have", amount: 30, frequency: "Weekly", notes: "" },
  { id: 105, name: "Car Costs (lease + insurance + gas)", category: "Transport", priority: "Important", amount: 250, frequency: "Monthly", notes: "" },
  { id: 106, name: "Vacation Fund", category: "Entertainment", priority: "Important", amount: 150, frequency: "Monthly", notes: "1-2 trips/year" },
  { id: 107, name: "Tech / Gadgets", category: "Personal Care", priority: "Nice-to-Have", amount: 600, frequency: "Yearly", notes: "Phone, laptop" },
  { id: 108, name: "Investments / Retirement", category: "Savings", priority: "Essential", amount: 200, frequency: "Monthly", notes: "10-20% of income" },
  { id: 109, name: "Emergency Fund", category: "Savings", priority: "Essential", amount: 100, frequency: "Monthly", notes: "" },
  { id: 110, name: "Utilities (all)", category: "Utilities", priority: "Essential", amount: 120, frequency: "Monthly", notes: "" },
  { id: 111, name: "Health & Fitness", category: "Health", priority: "Important", amount: 50, frequency: "Monthly", notes: "" },
  { id: 112, name: "Subscriptions & Entertainment", category: "Subscriptions", priority: "Nice-to-Have", amount: 30, frequency: "Monthly", notes: "" },
  { id: 113, name: "Hobbies", category: "Entertainment", priority: "Nice-to-Have", amount: 50, frequency: "Monthly", notes: "" },
  { id: 114, name: "Clothing", category: "Clothing", priority: "Important", amount: 200, frequency: "Quarterly", notes: "" },
  { id: 115, name: "Gifts & Social", category: "Entertainment", priority: "Nice-to-Have", amount: 40, frequency: "Monthly", notes: "" },
];
