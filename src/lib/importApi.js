import { supabase } from "./supabase";

const FUNCTIONS_URL = "https://tttxczeblzplkanjowuv.supabase.co/functions/v1";

export async function analyzeSpreadsheet(headers, sampleRows, fileName) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const response = await fetch(`${FUNCTIONS_URL}/ai-import-mapper`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ headers, sampleRows, fileName }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Analysis failed: ${text}`);
  }

  return response.json();
}
