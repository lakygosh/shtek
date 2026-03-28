import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const SYSTEM_PROMPT = `You are a data mapping assistant for a personal finance app. Given spreadsheet headers and sample rows, determine:
1. Which table this data belongs to (daily_entries, expenses, goals, or user_settings)
2. How each column maps to the target table's fields

Target schemas:

TABLE: daily_entries (individual purchases/transactions with dates)
Fields: date (YYYY-MM-DD), amount (number, in EUR), category (text), description (text)

TABLE: expenses (recurring budget items, NOT individual transactions)
Fields: name (text), category (text), priority (Essential|Important|Nice-to-Have), amount (number), frequency (Daily|Weekly|Monthly|Quarterly|Yearly), notes (text)

TABLE: goals (savings goals)
Fields: template (simple|housing|car|vacation|education|emergency|wedding|retirement|debt_payoff|business), name (text), icon (emoji), target_amount (number), current_savings (number), monthly_contribution (number), deadline (date or null)

TABLE: user_settings (income configuration)
Fields: gross_income (number), tax_rate (number as percentage)

Valid categories: Housing, Food, Transport, Utilities, Health, Entertainment, Education, Personal Care, Subscriptions, Savings, Debt/Loans, Clothing, Other

Decision guide:
- If rows have dates and look like individual transactions → daily_entries
- If rows look like recurring expense names with amounts → expenses
- If rows have target amounts, savings progress → goals
- If there's just income/tax info → user_settings

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "targetTable": "daily_entries|expenses|goals|user_settings",
  "confidence": "high|medium|low",
  "columnMapping": [
    { "sourceColumn": "original header", "sourceIndex": 0, "targetField": "field_name", "transform": "none|date_iso|parse_number|map_category|map_priority|map_frequency" }
  ],
  "unmappedColumns": ["columns that don't map to anything useful"],
  "warnings": ["human-readable warnings about data quality issues"]
}

Rules:
- Every source column must appear in either columnMapping or unmappedColumns
- Use transform "date_iso" for date columns, "parse_number" for numeric amounts, "map_category" for category text
- If a column doesn't map to any field, put it in unmappedColumns
- Set targetField to "skip" for columns to ignore but still include in columnMapping
- Be generous with mapping - even loosely named columns should map if the data fits`;

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin") || "*";

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  try {
    // Verify user auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Missing authorization", { status: 401, headers: corsHeaders(origin) });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders(origin) });
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response("AI service not configured", { status: 500, headers: corsHeaders(origin) });
    }

    // Parse request
    const { headers, sampleRows, fileName } = await req.json();
    if (!headers?.length || !sampleRows?.length) {
      return new Response("Missing headers or sample rows", { status: 400, headers: corsHeaders(origin) });
    }

    // Build the user message with the spreadsheet data
    const tableStr = [
      headers.join(" | "),
      headers.map(() => "---").join(" | "),
      ...sampleRows.slice(0, 15).map((row: string[]) => row.join(" | ")),
    ].join("\n");

    const userMessage = `File: "${fileName || "unknown"}"

Headers and sample data (${sampleRows.length} sample rows):

${tableStr}

Analyze this spreadsheet and return the JSON mapping.`;

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return new Response(`AI analysis failed: ${response.status}`, { status: 502, headers: corsHeaders(origin) });
    }

    const aiResult = await response.json();
    const content = aiResult.content?.[0]?.text;
    if (!content) {
      return new Response("Empty AI response", { status: 502, headers: corsHeaders(origin) });
    }

    // Parse AI JSON response (strip markdown code fences if present)
    const jsonStr = content.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
    const mapping = JSON.parse(jsonStr);

    return new Response(JSON.stringify(mapping), {
      status: 200,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(`Server error: ${err.message}`, { status: 500, headers: corsHeaders(origin) });
  }
});
