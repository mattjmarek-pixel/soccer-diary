import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SkillCategory } from "@/constants/theme";
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
  createdAt: string;
  updatedAt: string;
}

interface DiaryStats {
  totalEntries: number;
  totalMinutes: number;
  currentStreak: number;
}

interface DiaryContextType {
  entries: DiaryEntry[];
  isLoading: boolean;
  stats: DiaryStats;
  addEntry: (entry: Omit<DiaryEntry, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<DiaryEntry>;
  updateEntry: (id: string, updates: Partial<Omit<DiaryEntry, "id" | "userId" | "createdAt">>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntry: (id: string) => DiaryEntry | undefined;
  refreshEntries: () => Promise<void>;
}

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

const DIARY_STORAGE_KEY = "@soccer_diary_entries";

export function DiaryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await AsyncStorage.getItem(DIARY_STORAGE_KEY);
      if (data) {
        const allEntries: DiaryEntry[] = JSON.parse(data);
        const userEntries = allEntries
          .filter((e) => e.userId === user.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEntries(userEntries);
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error("Error loading entries:", error);
      setEntries([]);
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

  const addEntry = async (
    entry: Omit<DiaryEntry, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<DiaryEntry> => {
    if (!user) throw new Error("User not authenticated");

    const now = new Date().toISOString();
    const newEntry: DiaryEntry = {
      ...entry,
      id: Date.now().toString(),
      userId: user.id,
      createdAt: now,
      updatedAt: now,
    };

    const newEntries = [newEntry, ...entries];
    
    await saveAllEntries(newEntries);
    
    setEntries(newEntries);
    return newEntry;
  };

  const updateEntry = async (id: string, updates: Partial<Omit<DiaryEntry, "id" | "userId" | "createdAt">>) => {
    const entryIndex = entries.findIndex((e) => e.id === id);
    if (entryIndex === -1) {
      throw new Error("Entry not found");
    }
    
    const existingEntry = entries[entryIndex];
    const updatedEntry: DiaryEntry = {
      ...existingEntry,
      ...updates,
      id: existingEntry.id,
      userId: existingEntry.userId,
      createdAt: existingEntry.createdAt,
      updatedAt: new Date().toISOString(),
    };
    
    const newEntries = [...entries];
    newEntries[entryIndex] = updatedEntry;
    
    await saveAllEntries(newEntries);
    
    setEntries(newEntries);
  };

  const deleteEntry = async (id: string) => {
    const newEntries = entries.filter((e) => e.id !== id);
    
    await saveAllEntries(newEntries);
    
    setEntries(newEntries);
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
