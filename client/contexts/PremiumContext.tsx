import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PremiumFeature =
  | "ai_insights"
  | "advanced_charts"
  | "unlimited_entries"
  | "video_attachments"
  | "social_sharing"
  | "training_templates";

interface PremiumContextType {
  isPremium: boolean;
  subscriptionTier: "free" | "pro";
  isLoading: boolean;
  upgradeToPro: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  downgradeToFree: () => Promise<void>;
  canAccessFeature: (feature: PremiumFeature) => boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const PREMIUM_STORAGE_KEY = "@soccer_diary_premium";

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPremiumStatus();
  }, []);

  const loadPremiumStatus = async () => {
    try {
      const data = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setIsPremium(parsed.isPremium === true);
      }
    } catch (error) {
      console.error("Error loading premium status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeToPro = useCallback(async () => {
    try {
      await AsyncStorage.setItem(
        PREMIUM_STORAGE_KEY,
        JSON.stringify({ isPremium: true, subscribedAt: new Date().toISOString() })
      );
      setIsPremium(true);
    } catch (error) {
      console.error("Error upgrading to pro:", error);
      throw error;
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setIsPremium(parsed.isPremium === true);
      }
    } catch (error) {
      console.error("Error restoring purchases:", error);
      throw error;
    }
  }, []);

  const downgradeToFree = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(PREMIUM_STORAGE_KEY);
      setIsPremium(false);
    } catch (error) {
      console.error("Error downgrading to free:", error);
      throw error;
    }
  }, []);

  const canAccessFeature = useCallback(
    (feature: PremiumFeature): boolean => {
      if (isPremium) return true;

      const freeFeatures: PremiumFeature[] = [];
      return freeFeatures.includes(feature) ? true : false;
    },
    [isPremium]
  );

  const subscriptionTier: "free" | "pro" = isPremium ? "pro" : "free";

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        subscriptionTier,
        isLoading,
        upgradeToPro,
        restorePurchases,
        downgradeToFree,
        canAccessFeature,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  return context;
}
