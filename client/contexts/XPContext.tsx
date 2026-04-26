import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import {
  View,
  StyleSheet,
  Pressable,
} from "react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, getLevelInfo } from "@/constants/theme";
import { useDiary } from "@/contexts/DiaryContext";

interface XPContextType {
  getLevelInfo: () => ReturnType<typeof getLevelInfo>;
}

const XPContext = createContext<XPContextType | undefined>(undefined);

const CONFETTI_COLORS = [
  Colors.dark.primary,
  Colors.dark.accent,
  "#FF5252",
  "#7C4DFF",
  "#00BCD4",
  "#FF80AB",
];

const LEVEL_PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  angle: (i / 24) * Math.PI * 2,
  distance: 80 + (i % 3) * 40,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: Math.floor((i / 24) * 100),
  size: 6 + (i % 4) * 3,
  isRect: i % 2 === 0,
}));

function LevelParticle({
  angle,
  distance,
  color,
  delay,
  size,
  isRect,
}: {
  angle: number;
  distance: number;
  color: string;
  delay: number;
  size: number;
  isRect: boolean;
}) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 60;
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 80 }),
        withDelay(600, withTiming(0, { duration: 400 }))
      )
    );
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1, { damping: 8, stiffness: 260 }),
        withDelay(600, withTiming(0, { duration: 400 }))
      )
    );
    x.value = withDelay(delay, withSpring(dx, { damping: 14, stiffness: 55 }));
    y.value = withDelay(delay, withSpring(dy, { damping: 14, stiffness: 55 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        levelStyles.particle,
        {
          width: isRect ? size * 1.6 : size,
          height: size,
          borderRadius: isRect ? 2 : size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function LevelUpModal({
  levelName,
  levelColor,
  onDismiss,
}: {
  levelName: string;
  levelColor: string;
  onDismiss: () => void;
}) {
  const overlayOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0);
  const cardOpacity = useSharedValue(0);

  const triggerDismiss = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 300 });
    cardScale.value = withSpring(0, { damping: 14, stiffness: 220 }, () => {
      runOnJS(onDismiss)();
    });
    cardOpacity.value = withTiming(0, { duration: 300 });
  }, [onDismiss]);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    overlayOpacity.value = withTiming(1, { duration: 200 });
    cardScale.value = withSpring(1, { damping: 11, stiffness: 150 });
    cardOpacity.value = withTiming(1, { duration: 200 });
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const handleShare = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) return;
      const msg = `I just reached ${levelName} on Soccer Diary! Keep grinding!`;
      const uri = (FileSystem.cacheDirectory ?? "") + "level_share.txt";
      await FileSystem.writeAsStringAsync(uri, msg);
      await Sharing.shareAsync(uri, { mimeType: "text/plain", dialogTitle: "Share achievement" });
    } catch {}
  };

  return (
    <Animated.View style={[levelStyles.overlay, overlayStyle]}>
      <View style={levelStyles.particleOrigin}>
        {LEVEL_PARTICLES.map((p) => (
          <LevelParticle key={p.id} {...p} />
        ))}
      </View>
      <Animated.View style={[levelStyles.card, cardStyle]}>
        <View style={[levelStyles.badge, { backgroundColor: levelColor + "22", borderColor: levelColor + "66" }]}>
          <ThemedText style={[levelStyles.badgeText, { color: levelColor }]}>
            LEVEL UP
          </ThemedText>
        </View>
        <ThemedText type="h2" style={[levelStyles.levelName, { color: levelColor }]}>
          {levelName}
        </ThemedText>
        <ThemedText type="small" style={levelStyles.subtitle}>
          You have reached a new level. Keep training!
        </ThemedText>
        <View style={levelStyles.buttons}>
          <Pressable onPress={handleShare} style={[levelStyles.shareBtn, { borderColor: levelColor + "66" }]}>
            <ThemedText type="small" style={[levelStyles.shareText, { color: levelColor }]}>
              Share achievement
            </ThemedText>
          </Pressable>
          <Pressable onPress={triggerDismiss} style={levelStyles.dismissBtn}>
            <ThemedText type="small" style={levelStyles.dismissText}>
              Continue
            </ThemedText>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const levelStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  particleOrigin: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
  },
  card: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.xl,
    padding: Spacing["3xl"],
    alignItems: "center",
    width: 300,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundSecondary,
  },
  badge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  levelName: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  buttons: {
    width: "100%",
    gap: Spacing.sm,
  },
  shareBtn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
  },
  shareText: {
    fontWeight: "600",
  },
  dismissBtn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
  },
  dismissText: {
    color: Colors.dark.text,
    fontWeight: "600",
  },
});

export function XPProvider({ children }: { children: ReactNode }) {
  const { totalXp, isLoading } = useDiary();
  const [levelUpInfo, setLevelUpInfo] = useState<{ name: string; color: string } | null>(null);
  const prevLevelIdxRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      prevLevelIdxRef.current = null;
      return;
    }
    const { currentIdx, current } = getLevelInfo(totalXp);
    if (prevLevelIdxRef.current === null) {
      prevLevelIdxRef.current = currentIdx;
      return;
    }
    if (currentIdx > prevLevelIdxRef.current) {
      setLevelUpInfo({ name: current.name, color: current.color });
    }
    prevLevelIdxRef.current = currentIdx;
  }, [totalXp, isLoading]);

  const getLevelInfoForUser = useCallback(() => getLevelInfo(totalXp), [totalXp]);

  return (
    <XPContext.Provider value={{ getLevelInfo: getLevelInfoForUser }}>
      {children}
      {levelUpInfo ? (
        <LevelUpModal
          levelName={levelUpInfo.name}
          levelColor={levelUpInfo.color}
          onDismiss={() => setLevelUpInfo(null)}
        />
      ) : null}
    </XPContext.Provider>
  );
}

export function useXP() {
  const context = useContext(XPContext);
  if (context === undefined) {
    throw new Error("useXP must be used within an XPProvider");
  }
  return context;
}
