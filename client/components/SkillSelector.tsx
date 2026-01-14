import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, SkillCategories, SkillCategory } from "@/constants/theme";

interface SkillData {
  category: SkillCategory;
  notes: string;
}

interface SkillSelectorProps {
  selectedSkills: SkillData[];
  onChange: (skills: SkillData[]) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SkillChip({
  category,
  isSelected,
  onPress,
}: {
  category: SkillCategory;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected
            ? Colors.dark.primary
            : Colors.dark.backgroundSecondary,
        },
        animatedStyle,
      ]}
    >
      <Feather
        name={isSelected ? "check" : "plus"}
        size={14}
        color={isSelected ? Colors.dark.buttonText : Colors.dark.textSecondary}
        style={styles.chipIcon}
      />
      <ThemedText
        type="small"
        style={{
          color: isSelected ? Colors.dark.buttonText : Colors.dark.text,
          fontWeight: isSelected ? "600" : "400",
        }}
      >
        {category}
      </ThemedText>
    </AnimatedPressable>
  );
}

export function SkillSelector({ selectedSkills, onChange }: SkillSelectorProps) {
  const isSkillSelected = (category: SkillCategory) =>
    selectedSkills.some((s) => s.category === category);

  const toggleSkill = (category: SkillCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSkillSelected(category)) {
      onChange(selectedSkills.filter((s) => s.category !== category));
    } else {
      onChange([...selectedSkills, { category, notes: "" }]);
    }
  };

  const updateSkillNotes = (category: SkillCategory, notes: string) => {
    onChange(
      selectedSkills.map((s) =>
        s.category === category ? { ...s, notes } : s
      )
    );
  };

  return (
    <View style={styles.container}>
      <ThemedText type="body" style={styles.label}>
        Skills worked on
      </ThemedText>
      <View style={styles.chipContainer}>
        {SkillCategories.map((category) => (
          <SkillChip
            key={category}
            category={category}
            isSelected={isSkillSelected(category)}
            onPress={() => toggleSkill(category)}
          />
        ))}
      </View>
      {selectedSkills.length > 0 ? (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          {selectedSkills.map((skill) => (
            <View key={skill.category} style={styles.notesContainer}>
              <ThemedText type="small" style={styles.notesLabel}>
                {skill.category} notes
              </ThemedText>
              <TextInput
                style={styles.notesInput}
                value={skill.notes}
                onChangeText={(text) => updateSkillNotes(skill.category, text)}
                placeholder={`What did you work on for ${skill.category}?`}
                placeholderTextColor={Colors.dark.textSecondary}
                multiline
                numberOfLines={2}
              />
            </View>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  chipIcon: {
    marginRight: Spacing.xs,
  },
  notesContainer: {
    marginTop: Spacing.md,
  },
  notesLabel: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
  },
  notesInput: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    color: Colors.dark.text,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
});
