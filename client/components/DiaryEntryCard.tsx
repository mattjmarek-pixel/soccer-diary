import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
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

function MoodIndicator({ mood }: { mood: number }) {
  return (
    <View style={styles.moodContainer}>
      {[1, 2, 3, 4, 5].map((level) => (
        <View
          key={level}
          style={[
            styles.moodDot,
            {
              backgroundColor:
                level <= mood
                  ? MoodColors[mood as keyof typeof MoodColors]
                  : Colors.dark.backgroundTertiary,
            },
          ]}
        />
      ))}
    </View>
  );
}

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

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle]}
    >
      <View style={styles.header}>
        <ThemedText type="heading" style={styles.date}>
          {formattedDate}
        </ThemedText>
        <MoodIndicator mood={mood} />
      </View>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Feather name="clock" size={14} color={Colors.dark.textSecondary} />
          <ThemedText type="small" style={styles.metaText}>
            {duration} min
          </ThemedText>
        </View>
        {videoUri ? (
          <View style={styles.metaItem}>
            <Feather name="video" size={14} color={Colors.dark.primary} />
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
              <ThemedText type="small" style={styles.skillText}>
                {skill.category}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  date: {
    color: Colors.dark.text,
  },
  moodContainer: {
    flexDirection: "row",
    gap: 4,
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  skillChip: {
    backgroundColor: Colors.dark.backgroundSecondary,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  skillText: {
    color: Colors.dark.primary,
    fontSize: 12,
  },
});
