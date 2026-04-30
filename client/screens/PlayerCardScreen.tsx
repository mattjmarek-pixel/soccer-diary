import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import {
  Colors,
  Spacing,
  BorderRadius,
  SkillCategories,
  SkillColors,
  SkillCategory,
  getLevelInfo,
} from "@/constants/theme";
import { useDiary } from "@/contexts/DiaryContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/contexts/PremiumContext";

function SkillBar({
  category,
  rating,
  color,
  delay,
}: {
  category: SkillCategory;
  rating: number;
  color: string;
  delay: number;
}) {
  const widthPct = `${rating}%` as const;
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(400)} style={styles.skillRow}>
      <ThemedText style={styles.skillLabel}>{category.toUpperCase()}</ThemedText>
      <View style={styles.skillTrack}>
        <View style={[styles.skillFill, { width: widthPct, backgroundColor: color }]} />
      </View>
      <ThemedText style={[styles.skillRating, { color }]}>{rating}</ThemedText>
    </Animated.View>
  );
}

export default function PlayerCardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { entries, stats } = useDiary();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const levelInfo = getLevelInfo(
    entries.reduce((sum, e) => sum + (e.xpAwarded ?? 0), 0)
  );

  const totalEntries = entries.length;

  const skillRatings = SkillCategories.map((cat) => {
    const count = entries.filter((e) =>
      e.skills.some((s) => s.category === cat)
    ).length;
    const rating =
      totalEntries > 0
        ? Math.max(1, Math.round((count / totalEntries) * 99))
        : 0;
    return { category: cat, rating };
  })
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  const handleShare = async () => {
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert("Sharing not available", "Your device does not support sharing.");
      return;
    }
    try {
      setSharing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await captureRef(cardRef, { format: "png", quality: 1 });
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share Player Card",
        UTI: "public.png",
      });
    } catch {
      // user dismissed share sheet — ignore
    } finally {
      setSharing(false);
    }
  };

  const playerName = user?.name || "Player";
  const position = user?.position || null;
  const team = user?.team || null;
  const levelColor = levelInfo.current.color;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing["4xl"],
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View ref={cardRef} collapsable={false}>
        <View style={[styles.card, { backgroundColor: "#152015" }]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: levelColor + "18", borderRadius: BorderRadius.lg }]} />

          <View style={styles.cardHeader}>
            <View style={[styles.levelBadge, { backgroundColor: levelColor + "22", borderColor: levelColor + "66" }]}>
              <ThemedText style={[styles.levelBadgeText, { color: levelColor }]}>
                {levelInfo.current.name.toUpperCase()}
              </ThemedText>
            </View>
            {isPremium ? (
              <View style={styles.proBadge}>
                <ThemedText style={styles.proBadgeText}>PRO</ThemedText>
              </View>
            ) : null}
          </View>

          <View style={styles.nameBlock}>
            <ThemedText style={styles.playerName}>{playerName}</ThemedText>
            {position ? (
              <ThemedText style={styles.positionText}>{position}</ThemedText>
            ) : null}
            {team ? (
              <ThemedText style={styles.teamText}>{team}</ThemedText>
            ) : null}
          </View>

          <View style={styles.divider} />

          <View style={styles.skillsBlock}>
            <ThemedText style={styles.skillsHeading}>TOP SKILLS</ThemedText>
            {skillRatings.map(({ category, rating }, i) => (
              <SkillBar
                key={category}
                category={category}
                rating={rating}
                color={SkillColors[category]}
                delay={i * 80}
              />
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: Colors.dark.primary }]}>
                {stats.currentStreak}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Day Streak</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: levelColor }]}>
                {totalEntries}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Sessions</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: Colors.dark.accent }]}>
                {levelInfo.totalXp.toLocaleString()}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total XP</ThemedText>
            </View>
          </View>

          <View style={styles.wordmarkRow}>
            <Feather name="target" size={10} color={Colors.dark.primary} />
            <ThemedText style={styles.wordmark}>Soccer Diary</ThemedText>
          </View>
        </View>
      </View>

      <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.shareWrap}>
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
          testID="button-share-player-card"
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator size="small" color={Colors.dark.buttonText} />
          ) : (
            <>
              <Feather name="share-2" size={18} color={Colors.dark.buttonText} />
              <ThemedText style={styles.shareLabel}>Share Card</ThemedText>
            </>
          )}
        </Pressable>
      </Animated.View>

      <ThemedText style={styles.hint}>
        Your card updates as you log more training sessions
      </ThemedText>
    </ScrollView>
  );
}

const CARD_PADDING = Spacing["2xl"];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  card: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    padding: CARD_PADDING,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "33",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  levelBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
    letterSpacing: 1.5,
  },
  proBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs - 1,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.dark.accent + "22",
    borderWidth: 1,
    borderColor: Colors.dark.accent + "66",
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
    color: Colors.dark.accent,
    letterSpacing: 1.5,
  },
  nameBlock: {
    marginBottom: Spacing.lg,
  },
  playerName: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
    color: Colors.dark.text,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  positionText: {
    fontSize: 13,
    color: Colors.dark.primary,
    fontWeight: "600",
    fontFamily: "Montserrat_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  teamText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.text + "14",
    marginVertical: Spacing.lg,
  },
  skillsBlock: {
    gap: Spacing.sm,
  },
  skillsHeading: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
    color: Colors.dark.textSecondary,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  skillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  skillLabel: {
    width: 72,
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
    color: Colors.dark.textSecondary,
    letterSpacing: 0.5,
  },
  skillTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.backgroundSecondary,
    overflow: "hidden",
  },
  skillFill: {
    height: 6,
    borderRadius: 3,
  },
  skillRating: {
    width: 26,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
  },
  statLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.dark.text + "14",
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.lg,
  },
  wordmark: {
    fontSize: 10,
    color: Colors.dark.primary,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  shareWrap: {
    width: "100%",
    marginTop: Spacing["2xl"],
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.sm,
    height: 52,
  },
  shareButtonPressed: {
    opacity: 0.85,
  },
  shareLabel: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
    color: Colors.dark.buttonText,
  },
  hint: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
});
