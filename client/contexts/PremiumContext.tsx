import React, { createContext, useContext, ReactNode, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/query-client";
import { useAuth } from "./AuthContext";
import type { User } from "../../shared/types";

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
  upgrade: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userProfile, isLoading } = useQuery<User>({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/upgrade");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
  });

  const isPremium = userProfile?.isPremium ?? false;

  const canAccessFeature = useCallback(
    (_feature: PremiumFeature): boolean => {
      return isPremium;
    },
    [isPremium]
  );

  const upgrade = async () => {
    await upgradeMutation.mutateAsync();
  };

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        subscriptionTier: isPremium ? "pro" : "free",
        isLoading,
        canAccessFeature,
        upgrade,
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
