import Papa from "papaparse";
import * as XLSX from "xlsx";
import { DEFAULT_CATEGORIES, EUR_RSD } from "../data/constants";

// ── File Parsing ──

export function parseFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "csv") return parseCsv(file);
  if (ext === "xlsx" || ext === "xls") return parseExcel(file);
  throw new Error(`Unsupported file type: .${ext}`);
}

function parseCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (result) => {
        if (!result.data || result.data.length < 2) {
          return reject(new Error("File is empty or has no data rows"));
        }
        const headers = result.data[0].map((h) => String(h).trim());
        const rows = result.data.slice(1).map((row) => row.map((c) => String(c).trim()));
        resolve({ headers, rows });
      },
      error: (err) => reject(new Error(`CSV parse error: ${err.message}`)),
    });
  });
}

function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (!data || data.length < 2) {
          return reject(new Error("File is empty or has no data rows"));
        }
        const headers = data[0].map((h) => String(h).trim());
        const rows = data.slice(1).map((row) => row.map((c) => String(c).trim()));
        resolve({ headers, rows });
      } catch (err) {
        reject(new Error(`Excel parse error: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

// ── Sample Extraction ──

export function getSample(headers, rows, n = 10) {
  const sampleRows = rows.filter((r) => r.some((c) => c !== "")).slice(0, n);
  return { headers, sampleRows };
}

// ── Category Synonym Mapping ──

const CATEGORY_SYNONYMS = {
  groceries: "Food", grocery: "Food", dining: "Food", restaurant: "Food",
  restaurants: "Food", lunch: "Food", dinner: "Food", breakfast: "Food",
  coffee: "Food", cafe: "Food", food: "Food", "eating out": "Food",
  rent: "Housing", mortgage: "Housing", housing: "Housing", home: "Housing",
  apartment: "Housing", flat: "Housing",
  gas: "Transport", fuel: "Transport", uber: "Transport", taxi: "Transport",
  bus: "Transport", transport: "Transport", transportation: "Transport",
  car: "Transport", parking: "Transport", metro: "Transport",
  electric: "Utilities", electricity: "Utilities", water: "Utilities",
  internet: "Utilities", phone: "Utilities", utilities: "Utilities",
  mobile: "Utilities", heating: "Utilities",
  doctor: "Health", pharmacy: "Health", health: "Health", medical: "Health",
  gym: "Health", fitness: "Health", dentist: "Health", hospital: "Health",
  movies: "Entertainment", cinema: "Entertainment", entertainment: "Entertainment",
  games: "Entertainment", hobbies: "Entertainment", "going out": "Entertainment",
  concert: "Entertainment", music: "Entertainment",
  education: "Education", courses: "Education", books: "Education",
  school: "Education", university: "Education", tuition: "Education",
  haircut: "Personal Care", beauty: "Personal Care", "personal care": "Personal Care",
  cosmetics: "Personal Care", hygiene: "Personal Care",
  netflix: "Subscriptions", spotify: "Subscriptions", subscription: "Subscriptions",
  subscriptions: "Subscriptions", streaming: "Subscriptions",
  savings: "Savings", investment: "Savings", investments: "Savings",
  emergency: "Savings",
  debt: "Debt/Loans", loan: "Debt/Loans", loans: "Debt/Loans",
  "credit card": "Debt/Loans", credit: "Debt/Loans",
  clothing: "Clothing", clothes: "Clothing", shoes: "Clothing",
  fashion: "Clothing", apparel: "Clothing",
  other: "Other", misc: "Other", miscellaneous: "Other",
};

const VALID_CATEGORIES = new Set(DEFAULT_CATEGORIES.map((c) => c.name));

function mapCategory(value) {
  if (!value) return "Other";
  const v = value.trim();
  if (VALID_CATEGORIES.has(v)) return v;
  const lower = v.toLowerCase();
  if (CATEGORY_SYNONYMS[lower]) return CATEGORY_SYNONYMS[lower];
  // Partial match
  for (const [key, cat] of Object.entries(CATEGORY_SYNONYMS)) {
    if (lower.includes(key) || key.includes(lower)) return cat;
  }
  return "Other";
}

// ── Transform Functions ──

function parseDate(value) {
  if (!value) return null;
  const v = value.trim();

  // ISO: 2025-03-15
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(v)) {
    const d = new Date(v);
    if (!isNaN(d)) return v;
  }

  // DD.MM.YYYY or DD/MM/YYYY
  const dmy = v.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    const d = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    if (!isNaN(d)) return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // MM/DD/YYYY
  const mdy = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const [, month, day, year] = mdy;
    const d = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    if (!isNaN(d)) return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Fallback: try native Date parse
  const d = new Date(v);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);

  return null;
}

function parseNumber(value) {
  if (!value) return null;
  // Strip currency symbols, spaces, thousands separators
  const cleaned = value.replace(/[€$£\s]/g, "").replace(/,/g, ".");
  // Handle negative in parentheses: (123.45) -> -123.45
  const match = cleaned.match(/^\((.+)\)$/);
  const num = parseFloat(match ? `-${match[1]}` : cleaned);
  return isNaN(num) ? null : num;
}

const PRIORITY_MAP = {
  essential: "Essential", high: "Essential", critical: "Essential", must: "Essential",
  important: "Important", medium: "Important", moderate: "Important",
  "nice-to-have": "Nice-to-Have", "nice to have": "Nice-to-Have",
  low: "Nice-to-Have", optional: "Nice-to-Have", want: "Nice-to-Have",
};

function mapPriority(value) {
  if (!value) return "Important";
  const lower = value.trim().toLowerCase();
  return PRIORITY_MAP[lower] || "Important";
}

const FREQUENCY_MAP = {
  daily: "Daily", day: "Daily", "per day": "Daily",
  weekly: "Weekly", week: "Weekly", "per week": "Weekly",
  monthly: "Monthly", month: "Monthly", "per month": "Monthly",
  quarterly: "Quarterly", quarter: "Quarterly", "per quarter": "Quarterly",
  yearly: "Yearly", annual: "Yearly", annually: "Yearly", year: "Yearly", "per year": "Yearly",
};

function mapFrequency(value) {
  if (!value) return "Monthly";
  const lower = value.trim().toLowerCase();
  return FREQUENCY_MAP[lower] || "Monthly";
}

const TRANSFORMS = {
  none: (v) => v,
  date_iso: parseDate,
  parse_number: parseNumber,
  map_category: mapCategory,
  map_priority: mapPriority,
  map_frequency: mapFrequency,
};

// ── Apply Mapping to All Rows ──

export function applyMapping(headers, rows, mapping, convertRsd = false) {
  const validRows = [];
  const errorRows = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Skip completely empty rows
    if (row.every((c) => c === "")) continue;

    const mapped = {};
    let hasError = false;
    const errors = [];

    for (const col of mapping.columnMapping) {
      if (col.targetField === "skip") continue;
      const rawValue = row[col.sourceIndex] ?? "";
      const transform = TRANSFORMS[col.transform] || TRANSFORMS.none;
      const value = transform(rawValue);

      if (value === null && (col.targetField === "date" || col.targetField === "amount")) {
        hasError = true;
        errors.push(`${col.sourceColumn}: could not parse "${rawValue}"`);
      }
      mapped[col.targetField] = value;
    }

    // Convert RSD to EUR if toggled
    if (convertRsd && mapped.amount != null) {
      mapped.amount = Math.round((mapped.amount / EUR_RSD) * 100) / 100;
    }

    if (hasError) {
      errorRows.push({ rowIndex: i + 1, data: mapped, errors });
    } else {
      validRows.push(mapped);
    }
  }

  return { validRows, errorRows };
}

// ── Detect if amounts look like RSD ──

export function detectRsdAmounts(rows, amountIndex) {
  if (amountIndex == null || amountIndex < 0) return false;
  const amounts = rows.slice(0, 20)
    .map((r) => parseNumber(r[amountIndex]))
    .filter((n) => n != null && n > 0);
  if (amounts.length === 0) return false;
  const median = amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)];
  // If median amount is > 100, likely RSD (typical EUR daily expenses are under 100)
  return median > 100;
}
