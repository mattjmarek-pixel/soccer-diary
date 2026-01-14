import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, MoodColors } from "@/constants/theme";

interface MoodSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const moodLabels = ["Terrible", "Bad", "Okay", "Good", "Great"];
const moodIcons: ("frown" | "meh" | "smile")[] = ["frown", "frown", "meh", "smile", "smile"];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function MoodButton({
  mood,
  isSelected,
  onPress,
}: {
  mood: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const color = MoodColors[mood as keyof typeof MoodColors];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.moodButton,
        {
          backgroundColor: isSelected ? color : Colors.dark.backgroundSecondary,
          borderColor: isSelected ? color : "transparent",
        },
        animatedStyle,
      ]}
    >
      <Feather
        name={moodIcons[mood - 1]}
        size={24}
        color={isSelected ? Colors.dark.buttonText : Colors.dark.textSecondary}
      />
    </AnimatedPressable>
  );
}

export function MoodSlider({ value, onChange }: MoodSliderProps) {
  const handleMoodSelect = (mood: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(mood);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="body" style={styles.label}>
          How did you feel?
        </ThemedText>
        <ThemedText
          type="small"
          style={[
            styles.moodLabel,
            { color: MoodColors[value as keyof typeof MoodColors] },
          ]}
        >
          {moodLabels[value - 1]}
        </ThemedText>
      </View>
      <View style={styles.moodRow}>
        {[1, 2, 3, 4, 5].map((mood) => (
          <MoodButton
            key={mood}
            mood={mood}
            isSelected={value === mood}
            onPress={() => handleMoodSelect(mood)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  label: {
    color: Colors.dark.text,
  },
  moodLabel: {
    fontWeight: "600",
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  moodButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
});
