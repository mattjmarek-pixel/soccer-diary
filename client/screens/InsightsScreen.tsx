import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useDiary } from "@/contexts/DiaryContext";
import { usePremium } from "@/contexts/PremiumContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";

interface InsightsData {
  insights: string[];
  weeklyTip: string;
  moodAnalysis: string;
  skillRecommendation: string;
}

export default function InsightsScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { entries } = useDiary();
  const { isPremium } = usePremium();
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsights = useCallback(async () => {
    if (entries.length < 3) {
      Alert.alert(
        "Not Enough Data",
        "Log at least 3 training sessions to get personalized insights."
      );
      return;
    }

    setIsLoading(true);
    try {
      const recentEntries = entries.slice(0, 20).map((e) => ({
        date: e.date,
        mood: e.mood,
        duration: e.duration,
        reflection: e.reflection,
        skills: e.skills.map((s) => ({ category: s.category, notes: s.notes })),
      }));

      const url = new URL("/api/ai-insights", getApiUrl());
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: recentEntries }),
      });

      if (!response.ok) {
        throw new Error("Failed to get insights");
      }

      const data = await response.json();
      setInsights(data);
    } catch (error) {
      Alert.alert("Error", "Failed to generate insights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [entries]);

  if (!isPremium) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          styles.centered,
          {
            paddingTop: headerHeight + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
      >
        <View style={styles.lockedContainer}>
          <View style={styles.lockedIcon}>
            <Feather name="lock" size={48} color={Colors.dark.primary} />
          </View>
          <ThemedText type="h3" style={styles.lockedTitle}>
            AI Training Insights
          </ThemedText>
          <ThemedText type="body" style={styles.lockedSubtitle}>
            Get personalized coaching tips powered by AI analysis of your
            training diary
          </ThemedText>
          <Button
            onPress={() => navigation.navigate("Upgrade" as any)}
            style={styles.upgradeButton}
          >
            Unlock with Pro
          </Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing["2xl"],
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {insights === null && !isLoading ? (
        <View style={styles.generateSection}>
          <View style={styles.aiIconContainer}>
            <Feather name="cpu" size={40} color={Colors.dark.primary} />
          </View>
          <ThemedText type="heading" style={styles.generateTitle}>
            AI Training Coach
          </ThemedText>
          <ThemedText type="body" style={styles.generateSubtitle}>
            Analyze your recent training sessions and get personalized
            insights to improve your game
          </ThemedText>
          {entries.length < 3 ? (
            <View style={styles.minEntriesContainer}>
              <View style={styles.progressRow}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${(entries.length / 3) * 100}%` },
                    ]}
                  />
                </View>
                <ThemedText type="small" style={styles.progressLabel}>
                  {entries.length}/3
                </ThemedText>
              </View>
              <ThemedText type="body" style={styles.minEntriesText}>
                Log {3 - entries.length} more training{" "}
                {3 - entries.length === 1 ? "session" : "sessions"} to unlock
                AI insights
              </ThemedText>
            </View>
          ) : (
            <Button onPress={fetchInsights} style={styles.generateButton}>
              Generate Insights
            </Button>
          )}
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <ThemedText type="body" style={styles.loadingText}>
            Analyzing your training data...
          </ThemedText>
        </View>
      ) : null}

      {insights !== null && !isLoading ? (
        <>
          <Card elevation={2} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={[styles.insightIcon, { backgroundColor: Colors.dark.primary + "20" }]}>
                <Feather name="activity" size={20} color={Colors.dark.primary} />
              </View>
              <ThemedText type="heading">Mood Analysis</ThemedText>
            </View>
            <ThemedText type="body" style={styles.insightText}>
              {insights.moodAnalysis}
            </ThemedText>
          </Card>

          <Card elevation={2} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={[styles.insightIcon, { backgroundColor: Colors.dark.accent + "20" }]}>
                <Feather name="star" size={20} color={Colors.dark.accent} />
              </View>
              <ThemedText type="heading">Weekly Tip</ThemedText>
            </View>
            <ThemedText type="body" style={styles.insightText}>
              {insights.weeklyTip}
            </ThemedText>
          </Card>

          <Card elevation={2} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={[styles.insightIcon, { backgroundColor: "#9C27B0" + "20" }]}>
                <Feather name="target" size={20} color="#9C27B0" />
              </View>
              <ThemedText type="heading">Skill Focus</ThemedText>
            </View>
            <ThemedText type="body" style={styles.insightText}>
              {insights.skillRecommendation}
            </ThemedText>
          </Card>

          {insights.insights.length > 0 ? (
            <Card elevation={2} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={[styles.insightIcon, { backgroundColor: "#2196F3" + "20" }]}>
                  <Feather name="list" size={20} color="#2196F3" />
                </View>
                <ThemedText type="heading">Key Observations</ThemedText>
              </View>
              {insights.insights.map((insight, index) => (
                <View key={`insight-${index}`} style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <ThemedText type="body" style={styles.bulletText}>
                    {insight}
                  </ThemedText>
                </View>
              ))}
            </Card>
          ) : null}

          <Button
            variant="secondary"
            onPress={fetchInsights}
            style={styles.refreshButton}
          >
            Refresh Insights
          </Button>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  centered: {
    flexGrow: 1,
    justifyContent: "center",
  },
  lockedContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  lockedIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.dark.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  lockedTitle: {
    color: Colors.dark.text,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  lockedSubtitle: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
    lineHeight: 24,
  },
  upgradeButton: {
    width: "100%",
  },
  generateSection: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  aiIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  generateTitle: {
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  generateSubtitle: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  generateButton: {
    width: "100%",
  },
  minEntriesContainer: {
    width: "100%",
    alignItems: "center",
    gap: Spacing.md,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: Spacing.md,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.backgroundSecondary,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: Colors.dark.primary,
  },
  progressLabel: {
    color: Colors.dark.primary,
    fontWeight: "700",
  },
  minEntriesText: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  loadingSection: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
    gap: Spacing.lg,
  },
  loadingText: {
    color: Colors.dark.textSecondary,
  },
  insightCard: {
    marginBottom: Spacing.lg,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  insightText: {
    color: Colors.dark.text,
    lineHeight: 24,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.primary,
    marginTop: 9,
  },
  bulletText: {
    flex: 1,
    color: Colors.dark.text,
    lineHeight: 24,
  },
  refreshButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
});
