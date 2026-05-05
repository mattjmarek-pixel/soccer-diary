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
  interpolate,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const AMBER = "#FF9500";
const GREEN = Colors.dark.primary;
const ICON_SIZE = 44;

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
      style={[styles.pulseRing, { borderColor: color }, ring]}
    />
  );
}

export function TrainTodayCard({
  hasLoggedToday,
  currentStreak,
  totalEntries,
  onLogSession,
}: TrainTodayProps) {
  const progress = useSharedValue(hasLoggedToday ? 1 : 0);
  const cardScale = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(hasLoggedToday ? 1 : 0, {
      damping: 18,
      stiffness: 120,
    });
  }, [hasLoggedToday]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const promptStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [1, 0], "clamp"),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -6]) },
    ],
  }));

  const completeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 1], [0, 1], "clamp"),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [6, 0]) },
    ],
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  }));

  const handlePressIn = () => {
    cardScale.value = withSpring(0.97, { damping: 20 });
  };
  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 15 });
  };

  const isNewUser = totalEntries === 0;
  const streakAtRisk = !hasLoggedToday && currentStreak > 0;

  const promptAccent = streakAtRisk ? AMBER : GREEN;

  const promptIcon: React.ComponentProps<typeof Feather>["name"] = streakAtRisk
    ? "zap"
    : isNewUser
    ? "play-circle"
    : "zap";

  const promptTitle = streakAtRisk
    ? `Day ${currentStreak} — Don't break your streak!`
    : isNewUser
    ? "Begin your journey"
    : currentStreak > 0
    ? `Day ${currentStreak} — keep it going!`
    : "Start your streak today!";

  const promptSubtitle = streakAtRisk
    ? "Train today to protect your streak"
    : isNewUser
    ? "Log your first session and start tracking"
    : currentStreak > 0
    ? "Log a session to extend your run"
    : "Log a session today to begin your streak";

  const completeTitle = "Trained today!";
  const completeSubtitle =
    currentStreak > 1
      ? `${currentStreak}-day streak and counting`
      : "Great work getting on the pitch";

  return (
    <Animated.View entering={FadeIn.duration(300)} style={cardStyle}>
      <Pressable
        onPress={hasLoggedToday ? undefined : onLogSession}
        onPressIn={hasLoggedToday ? undefined : handlePressIn}
        onPressOut={hasLoggedToday ? undefined : handlePressOut}
        testID="train-today-log-session"
      >
        <View
          style={[
            styles.card,
            {
              borderColor: hasLoggedToday
                ? GREEN + "55"
                : promptAccent + "55",
            },
          ]}
        >
          <View style={styles.heightHolder}>
            {/* Prompt state (underneath) */}
            <Animated.View style={[styles.inner, promptStyle]}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: promptAccent + "22" },
                ]}
              >
                <Feather name={promptIcon} size={22} color={promptAccent} />
              </View>
              <View style={styles.textBlock}>
                <ThemedText style={[styles.title, { color: promptAccent }]}>
                  {promptTitle}
                </ThemedText>
                <ThemedText style={styles.subtitle}>{promptSubtitle}</ThemedText>
              </View>
              <View style={[styles.ctaButton, { backgroundColor: promptAccent }]}>
                <ThemedText style={styles.ctaText}>Log Session</ThemedText>
              </View>
            </Animated.View>

            {/* Complete state (on top, fades in) */}
            <Animated.View style={[styles.inner, completeStyle]}>
              <View style={styles.iconWrap}>
                <PulseRing color={GREEN} />
                <View
                  style={[styles.iconCircle, { backgroundColor: GREEN + "22" }]}
                >
                  <Feather name="check-circle" size={22} color={GREEN} />
                </View>
              </View>
              <View style={styles.textBlock}>
                <ThemedText style={[styles.title, { color: GREEN }]}>
                  {completeTitle}
                </ThemedText>
                <ThemedText style={styles.subtitle}>{completeSubtitle}</ThemedText>
              </View>
              <View
                style={[
                  styles.doneBadge,
                  {
                    backgroundColor: GREEN + "18",
                    borderColor: GREEN + "44",
                  },
                ]}
              >
                <Feather name="check" size={14} color={GREEN} />
              </View>
            </Animated.View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  heightHolder: {
    height: 44,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    height: 44,
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
