import React, { useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { Achievement } from "@/constants/achievements";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const PARTICLE_COUNT = 20;
const PARTICLE_COLORS = [
  Colors.dark.primary,
  Colors.dark.accent,
  "#FF6B6B",
  "#9C27B0",
  "#2196F3",
  "#FF9800",
  "#E040FB",
  "#00BCD4",
];

interface ParticleConfig {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
  color: string;
  delay: number;
  rotation: number;
}

function generateParticles(): ParticleConfig[] {
  const particles: ParticleConfig[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
    const radius = 120 + Math.random() * 100;
    particles.push({
      startX: SCREEN_WIDTH / 2,
      startY: SCREEN_HEIGHT / 2 - 40,
      endX: SCREEN_WIDTH / 2 + Math.cos(angle) * radius,
      endY: SCREEN_HEIGHT / 2 - 40 + Math.sin(angle) * radius,
      size: 6 + Math.random() * 10,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      delay: Math.random() * 200,
      rotation: Math.random() * 360,
    });
  }
  return particles;
}

function Particle({ config }: { config: ParticleConfig }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      config.delay,
      withSequence(
        withTiming(1, { duration: 150 }),
        withDelay(500, withTiming(0, { duration: 400 }))
      )
    );
    progress.value = withDelay(
      config.delay,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const x = config.startX + (config.endX - config.startX) * progress.value;
    const y =
      config.startY +
      (config.endY - config.startY) * progress.value -
      Math.sin(progress.value * Math.PI) * 60;

    return {
      position: "absolute",
      left: x - config.size / 2,
      top: y - config.size / 2,
      width: config.size,
      height: config.size,
      borderRadius: config.size / 2,
      backgroundColor: config.color,
      opacity: opacity.value,
      transform: [
        { rotate: `${config.rotation * progress.value}deg` },
        { scale: 1 - progress.value * 0.5 },
      ],
    };
  });

  return <Animated.View style={animatedStyle} />;
}

interface BadgeCelebrationProps {
  visible: boolean;
  achievement: Achievement | null;
  onDismiss: () => void;
}

export function BadgeCelebration({
  visible,
  achievement,
  onDismiss,
}: BadgeCelebrationProps) {
  const backdropOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const badgeRotation = useSharedValue(0);
  const glowScale = useSharedValue(0.5);
  const glowOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const descOpacity = useSharedValue(0);
  const descTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  const particles = React.useMemo(() => generateParticles(), [visible]);

  const triggerHaptics = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 300);
  }, []);

  useEffect(() => {
    if (visible && achievement) {
      triggerHaptics();

      backdropOpacity.value = withTiming(1, { duration: 300 });

      glowScale.value = withDelay(100, withSpring(1.2, { damping: 8, stiffness: 80 }));
      glowOpacity.value = withDelay(
        100,
        withSequence(
          withTiming(0.6, { duration: 400 }),
          withRepeat(
            withSequence(
              withTiming(0.3, { duration: 1000 }),
              withTiming(0.6, { duration: 1000 })
            ),
            -1,
            true
          )
        )
      );

      ringScale.value = withDelay(
        200,
        withSpring(1, { damping: 6, stiffness: 60 })
      );
      ringOpacity.value = withDelay(
        200,
        withSequence(
          withTiming(0.8, { duration: 300 }),
          withTiming(0, { duration: 800 })
        )
      );

      badgeScale.value = withDelay(
        150,
        withSpring(1, { damping: 6, stiffness: 100 })
      );
      badgeRotation.value = withDelay(
        150,
        withSequence(
          withTiming(-10, { duration: 100 }),
          withSpring(0, { damping: 4, stiffness: 120 })
        )
      );

      titleOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
      titleTranslateY.value = withDelay(
        400,
        withSpring(0, { damping: 12, stiffness: 100 })
      );

      descOpacity.value = withDelay(550, withTiming(1, { duration: 300 }));
      descTranslateY.value = withDelay(
        550,
        withSpring(0, { damping: 12, stiffness: 100 })
      );

      buttonOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));
      buttonTranslateY.value = withDelay(
        700,
        withSpring(0, { damping: 12, stiffness: 100 })
      );
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      badgeScale.value = withTiming(0, { duration: 200 });
      glowScale.value = 0.5;
      glowOpacity.value = 0;
      titleOpacity.value = 0;
      titleTranslateY.value = 20;
      descOpacity.value = 0;
      descTranslateY.value = 20;
      buttonOpacity.value = 0;
      buttonTranslateY.value = 20;
      ringScale.value = 0;
      ringOpacity.value = 0;
      badgeRotation.value = 0;
    }
  }, [visible, achievement]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: badgeScale.value },
      { rotate: `${badgeRotation.value}deg` },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const descStyle = useAnimatedStyle(() => ({
    opacity: descOpacity.value,
    transform: [{ translateY: descTranslateY.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const handleDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  }, [onDismiss]);

  if (!achievement) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        {visible
          ? particles.map((p, i) => <Particle key={`p-${i}`} config={p} />)
          : null}

        <View style={styles.centerContent}>
          <Animated.View
            style={[
              styles.glow,
              { backgroundColor: achievement.color },
              glowStyle,
            ]}
          />

          <Animated.View
            style={[
              styles.ring,
              { borderColor: achievement.color },
              ringStyle,
            ]}
          />

          <Animated.View
            style={[
              styles.badgeCircle,
              { backgroundColor: achievement.color + "25" },
              badgeStyle,
            ]}
          >
            <View
              style={[
                styles.badgeInner,
                { backgroundColor: achievement.color + "40" },
              ]}
            >
              <Feather
                name={achievement.icon as keyof typeof Feather.glyphMap}
                size={48}
                color={achievement.color}
              />
            </View>
          </Animated.View>

          <Animated.View style={[styles.textContainer, titleStyle]}>
            <ThemedText type="small" style={styles.congratsLabel}>
              Achievement Unlocked
            </ThemedText>
            <ThemedText type="h2" style={styles.badgeTitle}>
              {achievement.title}
            </ThemedText>
          </Animated.View>

          <Animated.View style={descStyle}>
            <ThemedText type="body" style={styles.badgeDescription}>
              {achievement.description}
            </ThemedText>
          </Animated.View>

          <Animated.View style={[styles.buttonWrapper, buttonAnimStyle]}>
            <Pressable
              style={({ pressed }) => [
                styles.dismissButton,
                { backgroundColor: achievement.color },
                pressed ? { opacity: 0.85, transform: [{ scale: 0.97 }] } : {},
              ]}
              onPress={handleDismiss}
            >
              <ThemedText type="button" style={styles.dismissText}>
                Awesome!
              </ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  glow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  ring: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
  },
  badgeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  badgeInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  congratsLabel: {
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  badgeTitle: {
    color: Colors.dark.text,
    textAlign: "center",
  },
  badgeDescription: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: Spacing["3xl"],
    lineHeight: 24,
  },
  buttonWrapper: {
    width: "100%",
  },
  dismissButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["3xl"],
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  dismissText: {
    color: Colors.dark.buttonText,
  },
});
