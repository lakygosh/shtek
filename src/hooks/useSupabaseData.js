import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { DEFAULT_EXPENSES, DEFAULT_IDEAL, DEFAULT_GOALS, getDefaultDailyEntries } from "../data/defaults";

// ── User Settings ──
export function useSettings(userId) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        setSettings(data);
        setLoading(false);
      });
  }, [userId]);

  const update = useCallback(async (fields) => {
    setSettings(prev => ({ ...prev, ...fields }));
    await supabase
      .from("user_settings")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
  }, [userId]);

  return { settings, loading, update };
}

// ── Expenses (budget planner + ideal) ──
export function useExpenses(userId, isIdeal = false) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .eq("is_ideal", isIdeal)
      .order("sort_order")
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [userId, isIdeal]);

  // Debounced full sync — replaces all rows for this user/type
  const sync = useCallback((newItems) => {
    setItems(newItems);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      // Delete old rows and insert new ones
      await supabase.from("expenses").delete().eq("user_id", userId).eq("is_ideal", isIdeal);
      if (newItems.length > 0) {
        const rows = newItems.map((item, i) => ({
          id: typeof item.id === "string" && item.id.length > 10 ? item.id : undefined,
          user_id: userId,
          name: item.name,
          category: item.category,
          priority: item.priority,
          amount: item.amount,
          frequency: item.frequency,
          notes: item.notes || "",
          sort_order: i,
          is_ideal: isIdeal,
        }));
        await supabase.from("expenses").insert(rows);
      }
    }, 800);
  }, [userId, isIdeal]);

  return { items, loading, setItems: sync };
}

// ── Goals ──
export function useGoals(userId) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order")
      .order("created_at")
      .then(({ data }) => {
        setGoals(data || []);
        setLoading(false);
      });
  }, [userId]);

  const addGoal = useCallback(async (goal) => {
    const row = {
      user_id: userId,
      template: goal.template,
      name: goal.name,
      icon: goal.icon,
      target_amount: goal.target_amount,
      current_savings: goal.current_savings,
      monthly_contribution: goal.monthly_contribution,
      deadline: goal.deadline || null,
      extra: goal.extra || {},
      sort_order: goal.sort_order ?? 0,
      is_archived: false,
    };
    const { data } = await supabase.from("goals").insert(row).select().single();
    if (data) setGoals(prev => [...prev, data]);
    return data;
  }, [userId]);

  const updateGoal = useCallback(async (id, fields) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...fields } : g));
    await supabase
      .from("goals")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
  }, []);

  const deleteGoal = useCallback(async (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    await supabase.from("goals").delete().eq("id", id);
  }, []);

  const bulkAddGoals = useCallback(async (newGoals, onProgress) => {
    const rows = newGoals.map((g, i) => ({
      user_id: userId,
      template: g.template || "simple",
      name: g.name || "Goal",
      icon: g.icon || "🎯",
      target_amount: g.target_amount || 0,
      current_savings: g.current_savings || 0,
      monthly_contribution: g.monthly_contribution || 0,
      deadline: g.deadline || null,
      extra: g.extra || {},
      sort_order: i,
      is_archived: false,
    }));
    const chunkSize = 500;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { data } = await supabase.from("goals").insert(chunk).select();
      if (data) setGoals(prev => [...prev, ...data]);
      if (onProgress) onProgress(Math.min(i + chunkSize, rows.length));
    }
  }, [userId]);

  return { goals, loading, addGoal, bulkAddGoals, updateGoal, deleteGoal };
}

// ── Feedback ──
export function useFeedback(userId, isAdmin = false) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const query = supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    // Non-admin only sees own; admin sees all (RLS handles this, but filter for non-admin clarity)
    if (!isAdmin) query.eq("user_id", userId);

    query.then(({ data }) => {
      setItems(data || []);
      setLoading(false);
    });
  }, [userId, isAdmin]);

  const addFeedback = useCallback(async (entry) => {
    const row = {
      user_id: userId,
      user_email: entry.user_email,
      type: entry.type,
      message: entry.message,
    };
    const { data } = await supabase.from("feedback").insert(row).select().single();
    if (data) setItems(prev => [data, ...prev]);
    return data;
  }, [userId]);

  const updateFeedback = useCallback(async (id, fields) => {
    setItems(prev => prev.map(f => f.id === id ? { ...f, ...fields } : f));
    await supabase
      .from("feedback")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
  }, []);

  const deleteFeedback = useCallback(async (id) => {
    setItems(prev => prev.filter(f => f.id !== id));
    await supabase.from("feedback").delete().eq("id", id);
  }, []);

  return { items, loading, addFeedback, updateFeedback, deleteFeedback };
}

// ── Daily Entries ──
export function useDailyEntries(userId) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("daily_entries")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setEntries(data || []);
        setLoading(false);
      });
  }, [userId]);

  const addEntry = useCallback(async (entry) => {
    const row = {
      user_id: userId,
      date: entry.date,
      amount: entry.amount,
      category: entry.category,
      description: entry.description,
    };
    const { data } = await supabase.from("daily_entries").insert(row).select().single();
    if (data) setEntries(prev => [data, ...prev]);
  }, [userId]);

  const updateEntry = useCallback(async (id, fields) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...fields } : e));
    await supabase.from("daily_entries").update(fields).eq("id", id);
  }, []);

  const deleteEntry = useCallback(async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    await supabase.from("daily_entries").delete().eq("id", id);
  }, []);

  const bulkAddEntries = useCallback(async (newEntries, onProgress) => {
    const rows = newEntries.map(e => ({
      user_id: userId,
      date: e.date,
      amount: e.amount,
      category: e.category,
      description: e.description || "",
    }));
    const chunkSize = 500;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { data } = await supabase.from("daily_entries").insert(chunk).select();
      if (data) setEntries(prev => [...data, ...prev]);
      if (onProgress) onProgress(Math.min(i + chunkSize, rows.length));
    }
  }, [userId]);

  return { entries, loading, addEntry, bulkAddEntries, updateEntry, deleteEntry };
}

// ── Seed defaults for brand-new users ──
export async function seedDefaultData(userId) {
  // Insert default budget expenses
  const budgetRows = DEFAULT_EXPENSES.map((item, i) => ({
    user_id: userId,
    name: item.name,
    category: item.category,
    priority: item.priority,
    amount: item.amount,
    frequency: item.frequency,
    notes: item.notes || "",
    sort_order: i,
    is_ideal: false,
  }));
  await supabase.from("expenses").insert(budgetRows);

  // Insert default ideal life expenses
  const idealRows = DEFAULT_IDEAL.map((item, i) => ({
    user_id: userId,
    name: item.name,
    category: item.category,
    priority: item.priority,
    amount: item.amount,
    frequency: item.frequency,
    notes: item.notes || "",
    sort_order: i,
    is_ideal: true,
  }));
  await supabase.from("expenses").insert(idealRows);

  // Insert default goals
  const goalRows = DEFAULT_GOALS.map((g, i) => ({
    user_id: userId,
    template: g.template,
    name: g.name,
    icon: g.icon,
    target_amount: g.target_amount,
    current_savings: g.current_savings,
    monthly_contribution: g.monthly_contribution,
    deadline: g.deadline,
    extra: g.extra,
    sort_order: i,
    is_archived: false,
  }));
  await supabase.from("goals").insert(goalRows);

  // Insert sample daily entries
  const dailyRows = getDefaultDailyEntries().map((e) => ({
    user_id: userId,
    date: e.date,
    amount: e.amount,
    category: e.category,
    description: e.description,
  }));
  await supabase.from("daily_entries").insert(dailyRows);
}
