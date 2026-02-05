import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, SkillCategories } from "@/constants/theme";
import { useDiary, DiaryEntry } from "@/contexts/DiaryContext";

interface DiaryStats {
  totalEntries: number;
  totalMinutes: number;
  currentStreak: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  isEarned: (entries: DiaryEntry[], stats: DiaryStats) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-entry",
    title: "First Entry",
    description: "Log your first session",
    icon: "edit-3",
    color: Colors.dark.primary,
    isEarned: (_entries, stats) => stats.totalEntries >= 1,
  },
  {
    id: "week-warrior",
    title: "Week Warrior",
    description: "7-day training streak",
    icon: "zap",
    color: Colors.dark.accent,
    isEarned: (_entries, stats) => stats.currentStreak >= 7,
  },
  {
    id: "dedicated-player",
    title: "Dedicated Player",
    description: "Log 25 entries",
    icon: "award",
    color: "#FF6B6B",
    isEarned: (_entries, stats) => stats.totalEntries >= 25,
  },
  {
    id: "century",
    title: "Century",
    description: "Log 100 entries",
    icon: "star",
    color: Colors.dark.accent,
    isEarned: (_entries, stats) => stats.totalEntries >= 100,
  },
  {
    id: "marathon-trainer",
    title: "Marathon Trainer",
    description: "Train 1000+ total minutes",
    icon: "clock",
    color: Colors.dark.primary,
    isEarned: (_entries, stats) => stats.totalMinutes >= 1000,
  },
  {
    id: "all-rounder",
    title: "All-Rounder",
    description: "Practice all 6 skills in one session",
    icon: "target",
    color: "#9C27B0",
    isEarned: (entries) =>
      entries.some((entry) => {
        const categories = new Set(entry.skills.map((s) => s.category));
        return categories.size >= SkillCategories.length;
      }),
  },
  {
    id: "mood-master",
    title: "Mood Master",
    description: "Rate 5 (Great) mood 10 times",
    icon: "smile",
    color: Colors.dark.primary,
    isEarned: (entries) =>
      entries.filter((e) => e.mood === 5).length >= 10,
  },
  {
    id: "iron-will",
    title: "Iron Will",
    description: "30-day training streak",
    icon: "shield",
    color: "#FF6B6B",
    isEarned: (_entries, stats) => stats.currentStreak >= 30,
  },
  {
    id: "10k-minutes",
    title: "10K Minutes",
    description: "Train 10,000+ total minutes",
    icon: "trending-up",
    color: Colors.dark.accent,
    isEarned: (_entries, stats) => stats.totalMinutes >= 10000,
  },
  {
    id: "video-star",
    title: "Video Star",
    description: "Attach 10 videos to entries",
    icon: "video",
    color: "#2196F3",
    isEarned: (entries) =>
      entries.filter((e) => e.videoUri).length >= 10,
  },
];

export default function AchievementsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { entries, stats } = useDiary();

  const earnedStatus = useMemo(() => {
    return ACHIEVEMENTS.map((a) => ({
      ...a,
      earned: a.isEarned(entries, stats),
    }));
  }, [entries, stats]);

  const earnedCount = earnedStatus.filter((a) => a.earned).length;

  const rows: { left: typeof earnedStatus[0]; right?: typeof earnedStatus[0] }[] = [];
  for (let i = 0; i < earnedStatus.length; i += 2) {
    rows.push({
      left: earnedStatus[i],
      right: earnedStatus[i + 1],
    });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing["2xl"],
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.counterContainer}>
        <ThemedText type="display" style={styles.counterValue}>
          {earnedCount}
        </ThemedText>
        <ThemedText type="body" style={styles.counterLabel}>
          of {ACHIEVEMENTS.length} earned
        </ThemedText>
      </View>

      {rows.map((row, idx) => (
        <View key={`row-${idx}`} style={styles.row}>
          <BadgeCard
            title={row.left.title}
            description={row.left.description}
            icon={row.left.icon}
            color={row.left.color}
            earned={row.left.earned}
          />
          {row.right ? (
            <BadgeCard
              title={row.right.title}
              description={row.right.description}
              icon={row.right.icon}
              color={row.right.color}
              earned={row.right.earned}
            />
          ) : <View style={styles.badge} />}
        </View>
      ))}
    </ScrollView>
  );
}

function BadgeCard({
  title,
  description,
  icon,
  color,
  earned,
}: {
  title: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
}) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: earned
            ? Colors.dark.backgroundSecondary
            : Colors.dark.backgroundDefault,
          opacity: earned ? 1 : 0.6,
        },
      ]}
    >
      {earned ? (
        <View style={styles.checkBadge}>
          <Feather name="check" size={10} color={Colors.dark.buttonText} />
        </View>
      ) : null}

      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: earned ? color + "30" : Colors.dark.backgroundTertiary,
          },
        ]}
      >
        {earned ? (
          <Feather
            name={icon as keyof typeof Feather.glyphMap}
            size={28}
            color={color}
          />
        ) : (
          <Feather name="lock" size={28} color={Colors.dark.textSecondary} />
        )}
      </View>

      <ThemedText
        type="button"
        style={[
          styles.badgeTitle,
          { color: earned ? Colors.dark.text : Colors.dark.textSecondary },
        ]}
      >
        {title}
      </ThemedText>
      <ThemedText type="small" style={styles.badgeDescription}>
        {description}
      </ThemedText>
    </View>
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
  counterContainer: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  counterValue: {
    color: Colors.dark.primary,
  },
  counterLabel: {
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  badge: {
    width: "48%",
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    alignItems: "center",
    position: "relative",
    minHeight: 160,
    justifyContent: "center",
  },
  checkBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  badgeTitle: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  badgeDescription: {
    textAlign: "center",
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
});
