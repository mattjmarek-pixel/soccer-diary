import React, { createContext, useContext, ReactNode, useCallback } from "react";

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
  canAccessFeature: (feature: PremiumFeature) => boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

/**
 * All users are on the free tier until real payments are implemented.
 * The Upgrade screen now collects waitlist emails instead of toggling a fake flag.
 */
export function PremiumProvider({ children }: { children: ReactNode }) {
  const canAccessFeature = useCallback((_feature: PremiumFeature): boolean => {
    return false;
  }, []);

  return (
    <PremiumContext.Provider
      value={{
        isPremium: false,
        subscriptionTier: "free",
        isLoading: false,
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
