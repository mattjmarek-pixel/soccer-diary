import React, { useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const AMBER = "#FF9500";
const GREEN = Colors.dark.primary;

type TrainTodayProps = {
  hasLoggedToday: boolean;
  currentStreak: number;
  totalEntries: number;
  onLogSession: () => void;
};

function PulseRing({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.55, { duration: 900, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900, easing: Easing.out(Easing.ease) }),
        withTiming(0.6, { duration: 700, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { borderColor: color },
        ring,
      ]}
    />
  );
}

export function TrainTodayCard({
  hasLoggedToday,
  currentStreak,
  totalEntries,
  onLogSession,
}: TrainTodayProps) {
  const cardScale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const handlePressIn = () => {
    cardScale.value = withSpring(0.97, { damping: 20 });
  };
  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 15 });
  };

  const isNewUser = totalEntries === 0;
  const streakAtRisk = !hasLoggedToday && currentStreak > 0;

  const accentColor = hasLoggedToday
    ? GREEN
    : streakAtRisk
    ? AMBER
    : GREEN;

  const iconName: React.ComponentProps<typeof Feather>["name"] = hasLoggedToday
    ? "check-circle"
    : streakAtRisk
    ? "zap"
    : isNewUser
    ? "play-circle"
    : "zap";

  const title = hasLoggedToday
    ? "Trained today!"
    : streakAtRisk
    ? `Day ${currentStreak} — Don't break it!`
    : isNewUser
    ? "Begin your journey"
    : "Start your streak!";

  const subtitle = hasLoggedToday
    ? currentStreak > 1
      ? `${currentStreak}-day streak and counting`
      : "Great work getting on the pitch"
    : streakAtRisk
    ? "Train today to protect your streak"
    : isNewUser
    ? "Log your first session and start tracking"
    : "Log a session today to begin your run";

  if (hasLoggedToday) {
    return (
      <Animated.View entering={FadeIn.duration(350)} style={[styles.card, { borderColor: accentColor + "55" }]}>
        <View style={styles.inner}>
          <View style={styles.iconWrap}>
            <PulseRing color={accentColor} />
            <View style={[styles.iconCircle, { backgroundColor: accentColor + "22" }]}>
              <Feather name={iconName} size={22} color={accentColor} />
            </View>
          </View>
          <View style={styles.textBlock}>
            <ThemedText style={[styles.title, { color: accentColor }]}>{title}</ThemedText>
            <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
          </View>
          <View style={[styles.doneBadge, { backgroundColor: accentColor + "18", borderColor: accentColor + "44" }]}>
            <Feather name="check" size={14} color={accentColor} />
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(350)} style={cardStyle}>
      <Pressable
        onPress={onLogSession}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID="train-today-log-session"
      >
        <View style={[styles.card, { borderColor: accentColor + "55" }]}>
          <View style={styles.inner}>
            <View style={[styles.iconCircle, { backgroundColor: accentColor + "22" }]}>
              <Feather name={iconName} size={22} color={accentColor} />
            </View>
            <View style={styles.textBlock}>
              <ThemedText style={[styles.title, { color: accentColor }]}>{title}</ThemedText>
              <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
            </View>
            <View style={[styles.ctaButton, { backgroundColor: accentColor }]}>
              <ThemedText style={styles.ctaText}>Log</ThemedText>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const ICON_SIZE = 44;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    borderWidth: 2,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
  },
  subtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 17,
  },
  ctaButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.xs,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
    color: Colors.dark.buttonText,
  },
  doneBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
