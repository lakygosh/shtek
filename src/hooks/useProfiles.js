import { useState, useCallback } from "react";

const PROFILES_KEY = "lft_profiles";
const ACTIVE_KEY = "lft_activeProfile";

// All localStorage keys that hold per-profile data (unprefixed)
const DATA_KEYS = [
  "lft_expenses", "lft_ideal", "lft_grossIncome", "lft_taxRate",
  "lft_daily", "lft_flatPrice", "lft_downPct", "lft_currentSavings",
  "lft_monthlySaving", "lft_interestRate", "lft_loanYears",
];

function loadProfiles() {
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveProfiles(profiles) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

// On first ever load, migrate unprefixed keys to a default profile
function migrateIfNeeded() {
  const profiles = loadProfiles();
  if (profiles.length > 0) return;

  const id = "p_" + Date.now();
  const hasData = DATA_KEYS.some(k => localStorage.getItem(k) !== null);

  if (hasData) {
    for (const key of DATA_KEYS) {
      const val = localStorage.getItem(key);
      if (val !== null) {
        localStorage.setItem(`${id}_${key}`, val);
        localStorage.removeItem(key);
      }
    }
  }

  const profile = { id, name: "My Profile", createdAt: new Date().toISOString() };
  saveProfiles([profile]);
  localStorage.setItem(ACTIVE_KEY, id);
  return profile;
}

export function useProfiles() {
  // Run migration before first render
  migrateIfNeeded();

  const [profiles, setProfilesState] = useState(loadProfiles);
  const [activeId, setActiveIdState] = useState(
    () => localStorage.getItem(ACTIVE_KEY) || loadProfiles()[0]?.id || ""
  );

  const setProfiles = useCallback((updater) => {
    setProfilesState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveProfiles(next);
      return next;
    });
  }, []);

  const switchProfile = useCallback((id) => {
    localStorage.setItem(ACTIVE_KEY, id);
    setActiveIdState(id);
  }, []);

  const createProfile = useCallback((name) => {
    const id = "p_" + Date.now();
    const profile = { id, name, createdAt: new Date().toISOString() };
    setProfiles(prev => [...prev, profile]);
    switchProfile(id);
    return profile;
  }, [setProfiles, switchProfile]);

  const renameProfile = useCallback((id, name) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  }, [setProfiles]);

  const deleteProfile = useCallback((id) => {
    // Remove all data for this profile
    for (const key of DATA_KEYS) {
      localStorage.removeItem(`${id}_${key}`);
    }
    setProfiles(prev => {
      const next = prev.filter(p => p.id !== id);
      if (next.length === 0) {
        // Always keep at least one profile
        const fallback = { id: "p_" + Date.now(), name: "My Profile", createdAt: new Date().toISOString() };
        saveProfiles([fallback]);
        switchProfile(fallback.id);
        return [fallback];
      }
      if (activeId === id) {
        switchProfile(next[0].id);
      }
      return next;
    });
  }, [activeId, setProfiles, switchProfile]);

  const activeProfile = profiles.find(p => p.id === activeId) || profiles[0];

  return { profiles, activeProfile, switchProfile, createProfile, renameProfile, deleteProfile };
}
