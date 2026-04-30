import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { SkillCategory, computeEntryXp, getLevelInfo } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/query-client";

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
  isError: boolean;
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

const XP_STORAGE_KEY = "@soccer_diary_xp";
const MIGRATED_KEY = "@soccer_diary_migrated_v2";
const LEGACY_DIARY_KEY = "@soccer_diary_entries";

// ── Field mapping helpers ─────────────────────────────────────────────────────

function serverToClient(row: any): DiaryEntry {
  return {
    id: row.id,
    userId: row.user_id ?? row.userId,
    date: row.date,
    mood: row.mood,
    duration: row.duration_minutes ?? row.durationMinutes ?? row.duration ?? 0,
    reflection: row.notes ?? row.reflection ?? "",
    skills: Array.isArray(row.skills) ? row.skills : [],
    videoUri: row.video_url ?? row.videoUrl ?? row.videoUri ?? undefined,
    mediaType: row.media_type ?? row.mediaType ?? undefined,
    xpAwarded: row.xp_awarded ?? row.xpAwarded ?? 0,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  };
}

function clientToServer(entry: AddEntryInput | UpdateEntryInput) {
  const e = entry as any;
  return {
    date: e.date,
    mood: e.mood,
    durationMinutes: e.duration ?? e.durationMinutes,
    notes: e.reflection ?? e.notes,
    skills: e.skills ?? [],
    videoUrl: e.videoUri ?? e.videoUrl ?? null,
    mediaType: e.mediaType ?? null,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function DiaryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [totalXp, setTotalXp] = useState(0);
  const totalXpRef = useRef(0);

  const xpKey = user ? `${XP_STORAGE_KEY}_${user.id}` : null;

  // ── Fetch entries from server ──────────────────────────────────────────
  const {
    data: rawEntries,
    isLoading,
    isError,
    refetch,
  } = useQuery<DiaryEntry[]>({
    queryKey: ["/api/entries"],
    enabled: !!user,
    select: (data: any) => (Array.isArray(data) ? data.map(serverToClient) : []),
  });

  const entries: DiaryEntry[] = rawEntries ?? [];

  // ── XP management ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!xpKey) return;
    AsyncStorage.getItem(xpKey).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        const xp = typeof parsed === "object" ? (parsed.totalXp ?? 0) : parseInt(raw, 10) || 0;
        totalXpRef.current = xp;
        setTotalXp(xp);
      } catch {
        const xp = parseInt(raw, 10) || 0;
        totalXpRef.current = xp;
        setTotalXp(xp);
      }
    });
  }, [xpKey]);

  const saveXp = useCallback(
    (xp: number) => {
      if (!xpKey) return;
      const lvl = getLevelInfo(xp);
      AsyncStorage.setItem(
        xpKey,
        JSON.stringify({ totalXp: xp, currentLevel: lvl.current.name })
      ).catch(() => {});
    },
    [xpKey]
  );

  // ── One-time migration from AsyncStorage → server ─────────────────────
  useEffect(() => {
    if (!user || isLoading) return;

    AsyncStorage.getItem(MIGRATED_KEY).then(async (done) => {
      if (done === "true") return;

      const legacyRaw = await AsyncStorage.getItem(LEGACY_DIARY_KEY);
      if (!legacyRaw) {
        await AsyncStorage.setItem(MIGRATED_KEY, "true");
        return;
      }

      try {
        const allEntries: any[] = JSON.parse(legacyRaw);
        const mine = allEntries.filter((e) => e.userId === user.id);

        for (const e of mine) {
          const xp = computeEntryXp({
            duration: e.duration,
            reflection: e.reflection,
            mediaType: e.mediaType,
          });
          await apiRequest("POST", "/api/entries", {
            ...clientToServer(e),
            xpAwarded: e.xpAwarded && e.xpAwarded > 0 ? e.xpAwarded : xp,
          }).catch(() => {});
        }

        await AsyncStorage.setItem(MIGRATED_KEY, "true");
        qc.invalidateQueries({ queryKey: ["/api/entries"] });
      } catch (err) {
        console.warn("Migration failed:", err);
      }
    });
  }, [user, isLoading]);

  // ── Sync XP with entries on load ──────────────────────────────────────
  useEffect(() => {
    if (!entries.length || !xpKey) return;

    AsyncStorage.getItem(xpKey).then((raw) => {
      if (raw) return;
      const xp = entries.reduce((sum, e) => sum + (e.xpAwarded ?? 0), 0);
      totalXpRef.current = xp;
      setTotalXp(xp);
      saveXp(xp);
    });
  }, [entries, xpKey, saveXp]);

  // ── Mutations ─────────────────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: async (payload: { input: AddEntryInput; xpAwarded: number }) => {
      const res = await apiRequest("POST", "/api/entries", {
        ...clientToServer(payload.input),
        xpAwarded: payload.xpAwarded,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/entries"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; updates: UpdateEntryInput; xpAwarded: number }) => {
      const res = await apiRequest("PUT", `/api/entries/${payload.id}`, {
        ...clientToServer(payload.updates),
        xpAwarded: payload.xpAwarded,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/entries"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/entries/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/entries"] });
    },
  });

  // ── Public API ─────────────────────────────────────────────────────────

  const addEntry = async (input: AddEntryInput): Promise<DiaryEntry> => {
    if (!user) throw new Error("User not authenticated");

    const xpAwarded = computeEntryXp({
      duration: input.duration,
      reflection: input.reflection,
      mediaType: input.mediaType,
    });

    const raw = await addMutation.mutateAsync({ input, xpAwarded });
    const entry = serverToClient(raw);

    const newXp = totalXpRef.current + xpAwarded;
    totalXpRef.current = newXp;
    setTotalXp(newXp);
    saveXp(newXp);

    return entry;
  };

  const updateEntry = async (
    id: string,
    updates: UpdateEntryInput
  ): Promise<{ xpDelta: number }> => {
    const existing = entries.find((e) => e.id === id);
    if (!existing) throw new Error("Entry not found");

    const newXp = computeEntryXp({
      duration: "duration" in updates ? (updates.duration ?? existing.duration) : existing.duration,
      reflection:
        "reflection" in updates ? (updates.reflection ?? existing.reflection) : existing.reflection,
      mediaType: "mediaType" in updates ? updates.mediaType : existing.mediaType,
    });
    const xpDelta = newXp - (existing.xpAwarded ?? 0);

    await updateMutation.mutateAsync({ id, updates, xpAwarded: newXp });

    if (xpDelta !== 0) {
      const newTotal = Math.max(0, totalXpRef.current + xpDelta);
      totalXpRef.current = newTotal;
      setTotalXp(newTotal);
      saveXp(newTotal);
    }

    return { xpDelta };
  };

  const deleteEntry = async (id: string): Promise<void> => {
    const entry = entries.find((e) => e.id === id);
    const xpToDeduct = entry?.xpAwarded ?? 0;

    await deleteMutation.mutateAsync(id);

    if (xpToDeduct > 0) {
      const newTotal = Math.max(0, totalXpRef.current - xpToDeduct);
      totalXpRef.current = newTotal;
      setTotalXp(newTotal);
      saveXp(newTotal);
    }
  };

  const getEntry = (id: string) => entries.find((e) => e.id === id);

  const refreshEntries = async () => {
    await refetch();
  };

  const awardXp = async (amount: number): Promise<void> => {
    if (amount === 0) return;
    const newTotal = Math.max(0, totalXpRef.current + amount);
    totalXpRef.current = newTotal;
    setTotalXp(newTotal);
    saveXp(newTotal);
  };

  // ── Stats ─────────────────────────────────────────────────────────────

  const calculateStats = (): DiaryStats => {
    const totalEntries = entries.length;
    const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedDates = [
      ...new Set(
        entries.map((e) => {
          const d = new Date(e.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      ),
    ].sort((a, b) => b - a);

    for (let i = 0; i < sortedDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      expected.setHours(0, 0, 0, 0);

      if (sortedDates[i] === expected.getTime()) {
        currentStreak++;
      } else if (i === 0 && sortedDates[i] === today.getTime() - 86400000) {
        currentStreak++;
      } else {
        break;
      }
    }

    const todayStr = today.toDateString();
    const hasLoggedToday = entries.some((e) => new Date(e.date).toDateString() === todayStr);

    return { totalEntries, totalMinutes, currentStreak, hasLoggedToday };
  };

  return (
    <DiaryContext.Provider
      value={{
        entries,
        isLoading: isLoading && !!user,
        isError,
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
