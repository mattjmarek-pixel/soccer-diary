import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, MoodColors, SkillCategory } from "@/constants/theme";

interface DiaryEntryCardProps {
  date: string;
  mood: number;
  duration: number;
  reflection: string;
  skills: { category: SkillCategory; notes: string }[];
  videoUri?: string;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MOOD_LABELS: Record<number, string> = {
  1: "Rough",
  2: "Low",
  3: "Okay",
  4: "Good",
  5: "Great",
};

export function DiaryEntryCard({
  date,
  mood,
  duration,
  reflection,
  skills,
  videoUri,
  onPress,
}: DiaryEntryCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const moodColor = MoodColors[mood as keyof typeof MoodColors] || Colors.dark.primary;
  const moodLabel = MOOD_LABELS[mood] || "Okay";

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle]}
    >
      <View style={[styles.moodAccentBar, { backgroundColor: moodColor }]} />

      <View style={styles.inner}>
        <View style={styles.header}>
          <ThemedText type="heading" style={styles.date}>
            {formattedDate}
          </ThemedText>
          <View style={[styles.moodBadge, { backgroundColor: moodColor + "20", borderColor: moodColor + "44" }]}>
            <ThemedText style={[styles.moodBadgeText, { color: moodColor }]}>
              {moodLabel}
            </ThemedText>
          </View>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={13} color={Colors.dark.textSecondary} />
            <ThemedText type="small" style={styles.metaText}>
              {duration} min
            </ThemedText>
          </View>
          {videoUri ? (
            <View style={styles.metaItem}>
              <Feather name="video" size={13} color={Colors.dark.primary} />
              <ThemedText type="small" style={[styles.metaText, { color: Colors.dark.primary }]}>
                Video
              </ThemedText>
            </View>
          ) : null}
        </View>

        {reflection ? (
          <ThemedText type="body" style={styles.reflection} numberOfLines={2}>
            {reflection}
          </ThemedText>
        ) : null}

        {skills.length > 0 ? (
          <View style={styles.skillsContainer}>
            {skills.map((skill) => (
              <View key={skill.category} style={styles.skillChip}>
                <ThemedText style={styles.skillText}>
                  {skill.category}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "22",
    flexDirection: "row",
    overflow: "hidden",
  },
  moodAccentBar: {
    width: 4,
    borderRadius: 0,
  },
  inner: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  date: {
    color: Colors.dark.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  moodBadge: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  moodBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  meta: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: Colors.dark.textSecondary,
  },
  reflection: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  skillChip: {
    backgroundColor: Colors.dark.primary + "15",
    borderWidth: 1,
    borderColor: Colors.dark.primary + "44",
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  skillText: {
    color: Colors.dark.primary,
    fontSize: 11,
    fontWeight: "600",
  },
});
