// Goal template definitions
// Each template has: key, name, icon, description, extraFields (with defaults), and a calculate function

export const GOAL_TEMPLATES = {
  simple: {
    key: "simple",
    name: "Simple Goal",
    icon: "🎯",
    description: "Save toward any target amount",
    extraFields: {},
    calculate: (goal) => {
      const remaining = Math.max(goal.target_amount - goal.current_savings, 0);
      const monthsLeft = goal.monthly_contribution > 0 ? Math.ceil(remaining / goal.monthly_contribution) : Infinity;
      return { remaining, monthsLeft };
    },
  },

  housing: {
    key: "housing",
    name: "Home / Flat",
    icon: "🏠",
    description: "Mortgage calculator + down payment savings",
    extraFields: {
      property_price: 75000,
      down_pct: 15,
      interest_rate: 4.5,
      loan_years: 25,
    },
    calculate: (goal) => {
      const e = goal.extra || {};
      const propertyPrice = e.property_price || 75000;
      const downPct = e.down_pct || 15;
      const interestRate = e.interest_rate || 4.5;
      const loanYears = e.loan_years || 25;

      const downPayment = propertyPrice * (downPct / 100);
      const remaining = Math.max(downPayment - goal.current_savings, 0);
      const monthsToDown = goal.monthly_contribution > 0 ? Math.ceil(remaining / goal.monthly_contribution) : Infinity;
      const loanAmount = propertyPrice - downPayment;
      const monthlyRate = interestRate / 100 / 12;
      const nPayments = loanYears * 12;
      const mortgagePayment = monthlyRate > 0
        ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, nPayments)) / (Math.pow(1 + monthlyRate, nPayments) - 1)
        : loanAmount / nPayments;
      const totalLoanCost = mortgagePayment * nPayments;

      return {
        remaining,
        monthsLeft: monthsToDown,
        downPayment,
        loanAmount,
        mortgagePayment,
        totalLoanCost,
        interestPaid: totalLoanCost - loanAmount,
      };
    },
  },

  car: {
    key: "car",
    name: "Car",
    icon: "🚗",
    description: "Auto loan calculator + savings plan",
    extraFields: {
      down_pct: 20,
      interest_rate: 6.0,
      loan_years: 5,
    },
    calculate: (goal) => {
      const e = goal.extra || {};
      const downPct = e.down_pct || 20;
      const interestRate = e.interest_rate || 6.0;
      const loanYears = e.loan_years || 5;

      const downPayment = goal.target_amount * (downPct / 100);
      const remaining = Math.max(downPayment - goal.current_savings, 0);
      const monthsToDown = goal.monthly_contribution > 0 ? Math.ceil(remaining / goal.monthly_contribution) : Infinity;
      const loanAmount = goal.target_amount - downPayment;
      const monthlyRate = interestRate / 100 / 12;
      const nPayments = loanYears * 12;
      const monthlyPayment = monthlyRate > 0
        ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, nPayments)) / (Math.pow(1 + monthlyRate, nPayments) - 1)
        : loanAmount / nPayments;
      const totalCost = monthlyPayment * nPayments;

      return {
        remaining,
        monthsLeft: monthsToDown,
        downPayment,
        loanAmount,
        monthlyPayment,
        totalCost,
        interestPaid: totalCost - loanAmount,
      };
    },
  },

  vacation: {
    key: "vacation",
    name: "Vacation",
    icon: "✈️",
    description: "Travel fund with countdown",
    extraFields: {
      travel_date: "",
    },
    calculate: (goal) => {
      const e = goal.extra || {};
      const remaining = Math.max(goal.target_amount - goal.current_savings, 0);
      let monthsLeft = goal.monthly_contribution > 0 ? Math.ceil(remaining / goal.monthly_contribution) : Infinity;
      let dailySavingsNeeded = null;

      if (e.travel_date) {
        const now = new Date();
        const travel = new Date(e.travel_date);
        const daysLeft = Math.max(Math.ceil((travel - now) / (1000 * 60 * 60 * 24)), 1);
        dailySavingsNeeded = remaining / daysLeft;
        monthsLeft = Math.ceil(daysLeft / 30);
      }

      return { remaining, monthsLeft, dailySavingsNeeded };
    },
  },

  education: {
    key: "education",
    name: "Education",
    icon: "🎓",
    description: "Tuition planning with loan estimates",
    extraFields: {
      tuition_per_year: 5000,
      years_of_study: 4,
      interest_rate: 5.0,
      loan_years: 10,
    },
    calculate: (goal) => {
      const e = goal.extra || {};
      const tuitionPerYear = e.tuition_per_year || 5000;
      const yearsOfStudy = e.years_of_study || 4;
      const totalTuition = tuitionPerYear * yearsOfStudy;
      const remaining = Math.max(totalTuition - goal.current_savings, 0);
      const monthsLeft = goal.monthly_contribution > 0 ? Math.ceil(remaining / goal.monthly_contribution) : Infinity;

      const loanAmount = Math.max(totalTuition - goal.current_savings, 0);
      const interestRate = e.interest_rate || 5.0;
      const loanYears = e.loan_years || 10;
      const monthlyRate = interestRate / 100 / 12;
      const nPayments = loanYears * 12;
      const monthlyPayment = monthlyRate > 0 && loanAmount > 0
        ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, nPayments)) / (Math.pow(1 + monthlyRate, nPayments) - 1)
        : loanAmount / Math.max(nPayments, 1);

      return { remaining, monthsLeft, totalTuition, loanAmount, monthlyPayment };
    },
  },

  emergency: {
    key: "emergency",
    name: "Emergency Fund",
    icon: "🛡️",
    description: "Build a safety net based on monthly expenses",
    extraFields: {
      months_of_expenses: 6,
      monthly_expenses: 1000,
    },
    calculate: (goal) => {
      const e = goal.extra || {};
      const monthsOfExpenses = e.months_of_expenses || 6;
      const monthlyExpenses = e.monthly_expenses || 1000;
      const targetAmount = monthsOfExpenses * monthlyExpenses;
      const remaining = Math.max(targetAmount - goal.current_savings, 0);
      const monthsLeft = goal.monthly_contribution > 0 ? Math.ceil(remaining / goal.monthly_contribution) : Infinity;

      return { remaining, monthsLeft, targetAmount, monthsCovered: goal.current_savings / Math.max(monthlyExpenses, 1) };
    },
  },

  wedding: {
    key: "wedding",
    name: "Wedding",
    icon: "💍",
    description: "Wedding budget planner",
    extraFields: {
      guest_count: 100,
      cost_per_guest: 50,
    },
    calculate: (goal) => {
      const e = goal.extra || {};
      const guestCount = e.guest_count || 100;
      const costPerGuest = e.cost_per_guest || 50;
      const estimatedTotal = guestCount * costPerGuest;
      const remaining = Math.max(goal.target_amount - goal.current_savings, 0);
      const monthsLeft = goal.monthly_contribution > 0 ? Math.ceil(remaining / goal.monthly_contribution) : Infinity;

      return { remaining, monthsLeft, estimatedTotal, guestCount };
    },
  },

  retirement: {
    key: "retirement",
    name: "Retirement",
    icon: "🏖️",
    description: "Long-term compound growth planning",
    extraFields: {
      current_age: 30,
      retirement_age: 65,
      expected_return: 7.0,
    },
    calculate: (goal) => {
      const e = goal.extra || {};
      const currentAge = e.current_age || 30;
      const retirementAge = e.retirement_age || 65;
      const expectedReturn = e.expected_return || 7.0;
      const yearsToRetirement = Math.max(retirementAge - currentAge, 1);
      const monthsLeft = yearsToRetirement * 12;
      const monthlyReturn = expectedReturn / 100 / 12;

      // Future value of current savings + monthly contributions (compound)
      const fvSavings = goal.current_savings * Math.pow(1 + monthlyReturn, monthsLeft);
      const fvContributions = monthlyReturn > 0
        ? goal.monthly_contribution * ((Math.pow(1 + monthlyReturn, monthsLeft) - 1) / monthlyReturn)
        : goal.monthly_contribution * monthsLeft;
      const projectedTotal = fvSavings + fvContributions;

      const remaining = Math.max(goal.target_amount - goal.current_savings, 0);

      return { remaining, monthsLeft, projectedTotal, yearsToRetirement };
    },
  },

  debt_payoff: {
    key: "debt_payoff",
    name: "Debt Payoff",
    icon: "💳",
    description: "Pay off debt with interest tracking",
    extraFields: {
      interest_rate: 18.0,
      minimum_payment: 50,
    },
    calculate: (goal) => {
      const e = goal.extra || {};
      const interestRate = e.interest_rate || 18.0;
      const minimumPayment = e.minimum_payment || 50;
      const monthlyPayment = Math.max(goal.monthly_contribution, minimumPayment);
      const monthlyRate = interestRate / 100 / 12;
      const balance = goal.target_amount - goal.current_savings; // remaining debt

      let monthsLeft = Infinity;
      if (monthlyPayment > balance * monthlyRate) {
        monthsLeft = monthlyRate > 0
          ? Math.ceil(Math.log(monthlyPayment / (monthlyPayment - balance * monthlyRate)) / Math.log(1 + monthlyRate))
          : Math.ceil(balance / monthlyPayment);
      }
      const totalInterest = monthsLeft !== Infinity ? (monthlyPayment * monthsLeft) - balance : Infinity;
      const remaining = Math.max(balance, 0);

      return { remaining, monthsLeft, totalInterest, monthlyPayment };
    },
  },

  business: {
    key: "business",
    name: "Business",
    icon: "🏪",
    description: "Startup fund with breakeven estimate",
    extraFields: {
      startup_costs: 10000,
      monthly_revenue_target: 2000,
    },
    calculate: (goal) => {
      const e = goal.extra || {};
      const startupCosts = e.startup_costs || 10000;
      const monthlyRevenueTarget = e.monthly_revenue_target || 2000;
      const remaining = Math.max(startupCosts - goal.current_savings, 0);
      const monthsLeft = goal.monthly_contribution > 0 ? Math.ceil(remaining / goal.monthly_contribution) : Infinity;
      const monthsToBreakeven = monthlyRevenueTarget > 0 ? Math.ceil(startupCosts / monthlyRevenueTarget) : Infinity;

      return { remaining, monthsLeft, startupCosts, monthsToBreakeven };
    },
  },
};

// Labels for extra fields (used in UI)
export const EXTRA_FIELD_CONFIG = {
  property_price: { label: "Property Price", prefix: "€", suffix: "", step: 1000 },
  down_pct: { label: "Down Payment", prefix: "", suffix: "%", small: true, step: 1 },
  interest_rate: { label: "Interest Rate", prefix: "", suffix: "%", small: true, step: 0.1 },
  loan_years: { label: "Loan Term", prefix: "", suffix: "years", small: true, step: 1 },
  travel_date: { label: "Travel Date", type: "date" },
  tuition_per_year: { label: "Tuition / Year", prefix: "€", suffix: "", step: 100 },
  years_of_study: { label: "Years of Study", prefix: "", suffix: "years", small: true, step: 1 },
  months_of_expenses: { label: "Months to Cover", prefix: "", suffix: "months", small: true, step: 1 },
  monthly_expenses: { label: "Monthly Expenses", prefix: "€", suffix: "", step: 100 },
  guest_count: { label: "Guest Count", prefix: "", suffix: "guests", small: true, step: 1 },
  cost_per_guest: { label: "Cost per Guest", prefix: "€", suffix: "", small: true, step: 5 },
  current_age: { label: "Current Age", prefix: "", suffix: "years", small: true, step: 1 },
  retirement_age: { label: "Retire At", prefix: "", suffix: "years", small: true, step: 1 },
  expected_return: { label: "Expected Return", prefix: "", suffix: "%", small: true, step: 0.5 },
  minimum_payment: { label: "Min. Payment", prefix: "€", suffix: "", small: true, step: 10 },
  startup_costs: { label: "Startup Costs", prefix: "€", suffix: "", step: 1000 },
  monthly_revenue_target: { label: "Revenue Target", prefix: "€", suffix: "/mo", step: 100 },
};

export function getTemplate(key) {
  return GOAL_TEMPLATES[key] || GOAL_TEMPLATES.simple;
}

export function createGoalDefaults(templateKey) {
  const tmpl = getTemplate(templateKey);
  return {
    template: templateKey,
    name: tmpl.name,
    icon: tmpl.icon,
    target_amount: templateKey === "housing" ? 75000 : templateKey === "emergency" ? 6000 : 10000,
    current_savings: 0,
    monthly_contribution: 100,
    deadline: null,
    extra: { ...tmpl.extraFields },
    is_archived: false,
  };
}
