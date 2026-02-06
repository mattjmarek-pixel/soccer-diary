import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useDiary } from "@/contexts/DiaryContext";
import { useAuth } from "@/contexts/AuthContext";
import { ACHIEVEMENTS, type Achievement } from "@/constants/achievements";
import { BadgeCelebration } from "@/components/BadgeCelebration";

const EARNED_BADGES_KEY = "@soccer_diary_earned_badges";

interface AchievementContextType {
  earnedIds: Set<string>;
  newlyEarned: Achievement[];
}

const AchievementContext = createContext<AchievementContextType | undefined>(
  undefined
);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const { entries, stats } = useDiary();
  const { user } = useAuth();
  const [storedEarnedIds, setStoredEarnedIds] = useState<Set<string>>(
    new Set()
  );
  const [celebrationQueue, setCelebrationQueue] = useState<Achievement[]>([]);
  const [currentCelebration, setCurrentCelebration] =
    useState<Achievement | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const isInitialized = useRef(false);
  const hasLoadedStored = useRef(false);

  const storageKey = user ? `${EARNED_BADGES_KEY}_${user.id}` : null;

  useEffect(() => {
    const loadStoredBadges = async () => {
      if (!storageKey) return;
      try {
        const data = await AsyncStorage.getItem(storageKey);
        if (data) {
          setStoredEarnedIds(new Set(JSON.parse(data)));
        }
      } catch (error) {
        console.error("Error loading earned badges:", error);
      }
      hasLoadedStored.current = true;
    };
    loadStoredBadges();
  }, [storageKey]);

  useEffect(() => {
    if (!hasLoadedStored.current || !storageKey) return;

    const currentEarned = ACHIEVEMENTS.filter((a) =>
      a.isEarned(entries, stats)
    );
    const currentEarnedIds = new Set(currentEarned.map((a) => a.id));

    const newlyUnlocked = currentEarned.filter(
      (a) => !storedEarnedIds.has(a.id)
    );

    if (newlyUnlocked.length > 0 && isInitialized.current) {
      setCelebrationQueue((prev) => [...prev, ...newlyUnlocked]);

      const saveEarned = async () => {
        try {
          await AsyncStorage.setItem(
            storageKey,
            JSON.stringify(Array.from(currentEarnedIds))
          );
          setStoredEarnedIds(currentEarnedIds);
        } catch (error) {
          console.error("Error saving earned badges:", error);
        }
      };
      saveEarned();
    }

    if (!isInitialized.current && hasLoadedStored.current) {
      isInitialized.current = true;
      if (currentEarnedIds.size > 0 && storedEarnedIds.size === 0 && currentEarned.length > 0) {
        const saveInitial = async () => {
          try {
            await AsyncStorage.setItem(
              storageKey,
              JSON.stringify(Array.from(currentEarnedIds))
            );
            setStoredEarnedIds(currentEarnedIds);
          } catch (error) {
            console.error("Error saving initial badges:", error);
          }
        };
        saveInitial();
      }
    }
  }, [entries, stats, storedEarnedIds, storageKey]);

  useEffect(() => {
    if (celebrationQueue.length > 0 && !showCelebration) {
      const next = celebrationQueue[0];
      setCurrentCelebration(next);
      setShowCelebration(true);
      setCelebrationQueue((prev) => prev.slice(1));
    }
  }, [celebrationQueue, showCelebration]);

  const handleDismiss = useCallback(() => {
    setShowCelebration(false);
    setCurrentCelebration(null);
  }, []);

  const currentEarnedIds = new Set(
    ACHIEVEMENTS.filter((a) => a.isEarned(entries, stats)).map((a) => a.id)
  );

  return (
    <AchievementContext.Provider
      value={{
        earnedIds: currentEarnedIds,
        newlyEarned: celebrationQueue,
      }}
    >
      {children}
      <BadgeCelebration
        visible={showCelebration}
        achievement={currentCelebration}
        onDismiss={handleDismiss}
      />
    </AchievementContext.Provider>
  );
}

export function useAchievements() {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error(
      "useAchievements must be used within an AchievementProvider"
    );
  }
  return context;
}
