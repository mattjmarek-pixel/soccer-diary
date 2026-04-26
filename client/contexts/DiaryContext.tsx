import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SkillCategory, computeEntryXp } from "@/constants/theme";
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
  xpAwarded: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryStats {
  totalEntries: number;
  totalMinutes: number;
  currentStreak: number;
}

type AddEntryInput = Omit<DiaryEntry, "id" | "userId" | "createdAt" | "updatedAt" | "xpAwarded">;
type UpdateEntryInput = Partial<Omit<DiaryEntry, "id" | "userId" | "createdAt" | "xpAwarded">>;

interface DiaryContextType {
  entries: DiaryEntry[];
  isLoading: boolean;
  stats: DiaryStats;
  totalXp: number;
  addEntry: (entry: AddEntryInput) => Promise<DiaryEntry>;
  updateEntry: (id: string, updates: UpdateEntryInput) => Promise<{ xpDelta: number }>;
  deleteEntry: (id: string) => Promise<void>;
  getEntry: (id: string) => DiaryEntry | undefined;
  refreshEntries: () => Promise<void>;
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
    AsyncStorage.setItem(xpStorageKeyRef.current, xp.toString()).catch(() => {});
  };

  const loadEntries = useCallback(async () => {
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

      if (entriesData) {
        const allEntries: DiaryEntry[] = JSON.parse(entriesData);
        const userEntries = allEntries
          .filter((e) => e.userId === user.id)
          .map((e) => ({ ...e, xpAwarded: e.xpAwarded ?? 0 }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEntries(userEntries);
      } else {
        setEntries([]);
      }

      const xp = xpData ? parseInt(xpData, 10) : 0;
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
      duration: updates.duration ?? existingEntry.duration,
      reflection: updates.reflection ?? existingEntry.reflection,
      mediaType: updates.mediaType ?? existingEntry.mediaType,
    });

    const xpDelta = newXpAwarded - existingEntry.xpAwarded;

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

    return { totalEntries, totalMinutes, currentStreak };
  };

  return (
    <DiaryContext.Provider
      value={{
        entries,
        isLoading,
        stats: calculateStats(),
        totalXp,
        addEntry,
        updateEntry,
        deleteEntry,
        getEntry,
        refreshEntries,
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
