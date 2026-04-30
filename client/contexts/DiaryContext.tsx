import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SkillCategory, computeEntryXp, getLevelInfo } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export interface DiaryEntry {
  id: string;
  userId: string;
  date: string;
  mood: number;
  duration: number;
  reflection: string;
  skills: {
    category: SkillCategory;
    notes: string;
  }[];
  videoUri?: string;
  mediaType?: "photo" | "video";
  xpAwarded?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryStats {
  totalEntries: number;
  totalMinutes: number;
  currentStreak: number;
  hasLoggedToday: boolean;
}

type AddEntryInput = Omit<DiaryEntry, "id" | "userId" | "createdAt" | "updatedAt" | "xpAwarded">;
type UpdateEntryInput = Partial<Omit<DiaryEntry, "id" | "userId" | "createdAt" | "xpAwarded">>;

interface DiaryContextType {
  entries: DiaryEntry[];
  isLoading: boolean;
  stats: DiaryStats;
  totalXp: number;
  currentLevel: string;
  addEntry: (entry: AddEntryInput) => Promise<DiaryEntry>;
  updateEntry: (id: string, updates: UpdateEntryInput) => Promise<{ xpDelta: number }>;
  deleteEntry: (id: string) => Promise<void>;
  getEntry: (id: string) => DiaryEntry | undefined;
  refreshEntries: () => Promise<void>;
  getLevelInfo: () => ReturnType<typeof getLevelInfo>;
  awardXp: (amount: number) => Promise<void>;
}

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

const DIARY_STORAGE_KEY = "@soccer_diary_entries";
const XP_STORAGE_KEY = "@soccer_diary_xp";

export function DiaryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalXp, setTotalXp] = useState(0);
  const totalXpRef = useRef(0);

  const xpStorageKey = user ? `${XP_STORAGE_KEY}_${user.id}` : null;
  const xpStorageKeyRef = useRef(xpStorageKey);
  xpStorageKeyRef.current = xpStorageKey;

  const saveXp = (xp: number) => {
    if (!xpStorageKeyRef.current) return;
    const { current: lvl } = getLevelInfo(xp);
    const payload = JSON.stringify({ totalXp: xp, currentLevel: lvl.name });
    AsyncStorage.setItem(xpStorageKeyRef.current, payload).catch((e) => console.warn("saveXp failed:", e));
  };

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    if (!user) {
      setEntries([]);
      totalXpRef.current = 0;
      setTotalXp(0);
      setIsLoading(false);
      return;
    }

    try {
      const [entriesData, xpData] = await Promise.all([
        AsyncStorage.getItem(DIARY_STORAGE_KEY),
        AsyncStorage.getItem(`${XP_STORAGE_KEY}_${user.id}`),
      ]);

      let resolvedEntries: DiaryEntry[] = [];
      if (entriesData) {
        const allEntries: DiaryEntry[] = JSON.parse(entriesData);
        resolvedEntries = allEntries
          .filter((e) => e.userId === user.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }

      let xp = 0;
      if (xpData) {
        try {
          const parsed = JSON.parse(xpData);
          xp = typeof parsed === "object" && parsed !== null
            ? (parsed.totalXp ?? 0)
            : parseInt(xpData, 10) || 0;
        } catch {
          xp = parseInt(xpData, 10) || 0;
        }
        resolvedEntries = resolvedEntries.map((e) => ({ ...e, xpAwarded: e.xpAwarded ?? 0 }));
      } else if (resolvedEntries.length > 0) {
        // One-time XP backfill for users with entries but no XP record
        resolvedEntries = resolvedEntries.map((e) => ({
          ...e,
          xpAwarded: e.xpAwarded && e.xpAwarded > 0
            ? e.xpAwarded
            : computeEntryXp({ duration: e.duration, reflection: e.reflection, mediaType: e.mediaType }),
        }));
        xp = resolvedEntries.reduce((sum, e) => sum + (e.xpAwarded ?? 0), 0);
        // Persist backfilled entries and XP asynchronously
        AsyncStorage.getItem(DIARY_STORAGE_KEY).then((raw) => {
          const all: DiaryEntry[] = raw ? JSON.parse(raw) : [];
          const others = all.filter((e) => e.userId !== user.id);
          AsyncStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify([...others, ...resolvedEntries])).catch(
            (e) => console.warn("XP backfill entries save failed:", e)
          );
        }).catch((e) => console.warn("XP backfill read failed:", e));
        const lvl = getLevelInfo(xp);
        AsyncStorage.setItem(
          `${XP_STORAGE_KEY}_${user.id}`,
          JSON.stringify({ totalXp: xp, currentLevel: lvl.current.name })
        ).catch((e) => console.warn("XP backfill XP save failed:", e));
      } else {
        resolvedEntries = resolvedEntries.map((e) => ({ ...e, xpAwarded: e.xpAwarded ?? 0 }));
      }

      setEntries(resolvedEntries);
      totalXpRef.current = xp;
      setTotalXp(xp);
    } catch {
      setEntries([]);
      totalXpRef.current = 0;
      setTotalXp(0);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const saveAllEntries = async (userEntries: DiaryEntry[]) => {
    try {
      const data = await AsyncStorage.getItem(DIARY_STORAGE_KEY);
      let allEntries: DiaryEntry[] = data ? JSON.parse(data) : [];
      allEntries = allEntries.filter((e) => e.userId !== user?.id);
      allEntries = [...allEntries, ...userEntries];
      await AsyncStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(allEntries));
    } catch (error) {
      console.error("Error saving entries:", error);
      throw error;
    }
  };

  const addEntry = async (entry: AddEntryInput): Promise<DiaryEntry> => {
    if (!user) throw new Error("User not authenticated");

    const xpAwarded = computeEntryXp({
      duration: entry.duration,
      reflection: entry.reflection,
      mediaType: entry.mediaType,
    });

    const now = new Date().toISOString();
    const newEntry: DiaryEntry = {
      ...entry,
      xpAwarded,
      id: Date.now().toString(),
      userId: user.id,
      createdAt: now,
      updatedAt: now,
    };

    const newEntries = [newEntry, ...entries];
    await saveAllEntries(newEntries);
    setEntries(newEntries);

    const newTotalXp = totalXpRef.current + xpAwarded;
    totalXpRef.current = newTotalXp;
    setTotalXp(newTotalXp);
    saveXp(newTotalXp);

    return newEntry;
  };

  const updateEntry = async (id: string, updates: UpdateEntryInput): Promise<{ xpDelta: number }> => {
    const entryIndex = entries.findIndex((e) => e.id === id);
    if (entryIndex === -1) throw new Error("Entry not found");

    const existingEntry = entries[entryIndex];

    const newXpAwarded = computeEntryXp({
      duration: "duration" in updates ? (updates.duration ?? existingEntry.duration) : existingEntry.duration,
      reflection: "reflection" in updates ? (updates.reflection ?? existingEntry.reflection) : existingEntry.reflection,
      mediaType: "mediaType" in updates ? updates.mediaType : existingEntry.mediaType,
    });

    const xpDelta = newXpAwarded - (existingEntry.xpAwarded ?? 0);

    const updatedEntry: DiaryEntry = {
      ...existingEntry,
      ...updates,
      xpAwarded: newXpAwarded,
      id: existingEntry.id,
      userId: existingEntry.userId,
      createdAt: existingEntry.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const newEntries = [...entries];
    newEntries[entryIndex] = updatedEntry;
    await saveAllEntries(newEntries);
    setEntries(newEntries);

    if (xpDelta !== 0) {
      const newTotalXp = Math.max(0, totalXpRef.current + xpDelta);
      totalXpRef.current = newTotalXp;
      setTotalXp(newTotalXp);
      saveXp(newTotalXp);
    }

    return { xpDelta };
  };

  const deleteEntry = async (id: string): Promise<void> => {
    const entry = entries.find((e) => e.id === id);
    const xpToDeduct = entry?.xpAwarded ?? 0;

    const newEntries = entries.filter((e) => e.id !== id);
    await saveAllEntries(newEntries);
    setEntries(newEntries);

    if (xpToDeduct > 0) {
      const newTotalXp = Math.max(0, totalXpRef.current - xpToDeduct);
      totalXpRef.current = newTotalXp;
      setTotalXp(newTotalXp);
      saveXp(newTotalXp);
    }
  };

  const getEntry = (id: string) => entries.find((e) => e.id === id);

  const refreshEntries = async () => {
    setIsLoading(true);
    await loadEntries();
  };

  const awardXp = async (amount: number): Promise<void> => {
    if (amount === 0) return;
    const newTotalXp = Math.max(0, totalXpRef.current + amount);
    totalXpRef.current = newTotalXp;
    setTotalXp(newTotalXp);
    saveXp(newTotalXp);
  };

  const calculateStats = (): DiaryStats => {
    const totalEntries = entries.length;
    const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedDates = [...new Set(entries.map((e) => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))].sort((a, b) => b - a);

    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (sortedDates[i] === expectedDate.getTime()) {
        currentStreak++;
      } else if (i === 0 && sortedDates[i] === today.getTime() - 86400000) {
        currentStreak++;
      } else {
        break;
      }
    }

    const todayStr = today.toDateString();
    const hasLoggedToday = entries.some(
      (e) => new Date(e.date).toDateString() === todayStr
    );

    return { totalEntries, totalMinutes, currentStreak, hasLoggedToday };
  };

  return (
    <DiaryContext.Provider
      value={{
        entries,
        isLoading,
        stats: calculateStats(),
        totalXp,
        currentLevel: getLevelInfo(totalXp).current.name,
        addEntry,
        updateEntry,
        deleteEntry,
        getEntry,
        refreshEntries,
        getLevelInfo: () => getLevelInfo(totalXp),
        awardXp,
      }}
    >
      {children}
    </DiaryContext.Provider>
  );
}

export function useDiary() {
  const context = useContext(DiaryContext);
  if (context === undefined) {
    throw new Error("useDiary must be used within a DiaryProvider");
  }
  return context;
}
