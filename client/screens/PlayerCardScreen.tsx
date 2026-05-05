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
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(400)} style={styles.skillRow}>
      <ThemedText style={styles.skillLabel}>{category.toUpperCase()}</ThemedText>
      <View style={styles.skillTrack}>
        <View
          style={[
            styles.skillFill,
            { width: `${rating}%` as any, backgroundColor: color },
          ]}
        />
      </View>
      <ThemedText style={[styles.skillRating, { color }]}>{rating}</ThemedText>
    </Animated.View>
  );
}

export default function PlayerCardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { entries, stats, getLevelInfo } = useDiary();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const levelInfo = getLevelInfo();
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
    .filter((s) => s.rating > 0)
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
  const xpProgressPct = Math.round(levelInfo.progress * 100);

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
        <View style={[styles.card, { backgroundColor: "#16213E" }]}>
          {/* Coloured accent bar at top */}
          <View style={[styles.accentBar, { backgroundColor: levelColor }]} />

          {/* Name row + PRO badge */}
          <View style={styles.nameRow}>
            <View style={styles.nameBlock}>
              <ThemedText style={styles.playerName} numberOfLines={1}>
                {playerName}
              </ThemedText>
              {position ? (
                <ThemedText style={[styles.positionText, { color: levelColor }]}>
                  {position.toUpperCase()}
                </ThemedText>
              ) : null}
              {team ? (
                <ThemedText style={styles.teamText} numberOfLines={1}>
                  {team}
                </ThemedText>
              ) : null}
            </View>
            {isPremium ? (
              <View style={styles.proBadge}>
                <Feather name="star" size={9} color={Colors.dark.accent} />
                <ThemedText style={styles.proBadgeText}>PRO</ThemedText>
              </View>
            ) : null}
          </View>

          {/* Circular level ring */}
          <View style={styles.levelSection}>
            <View
              style={[
                styles.levelRing,
                { borderColor: levelColor + "99" },
              ]}
            >
              <View
                style={[
                  styles.levelRingInner,
                  { backgroundColor: levelColor + "20" },
                ]}
              >
                <ThemedText style={[styles.levelRingName, { color: levelColor }]}>
                  {levelInfo.current.name.toUpperCase()}
                </ThemedText>
                <ThemedText style={[styles.levelRingXp, { color: levelColor + "BB" }]}>
                  {levelInfo.totalXp.toLocaleString()} XP
                </ThemedText>
              </View>
            </View>

            {/* XP progress bar */}
            <View style={styles.xpBarTrack}>
              <View
                style={[
                  styles.xpBarFill,
                  {
                    width: `${xpProgressPct}%` as any,
                    backgroundColor: levelColor,
                  },
                ]}
              />
            </View>
            {levelInfo.next ? (
              <ThemedText style={styles.xpNextLabel}>
                {levelInfo.xpInLevel} / {levelInfo.xpForNext} XP to {levelInfo.next.name}
              </ThemedText>
            ) : (
              <ThemedText style={styles.xpNextLabel}>Max level reached</ThemedText>
            )}
          </View>

          <View style={styles.divider} />

          {/* Top skills */}
          <View style={styles.skillsBlock}>
            <ThemedText style={styles.skillsHeading}>TOP SKILLS</ThemedText>
            {skillRatings.length > 0 ? (
              skillRatings.map(({ category, rating }, i) => (
                <SkillBar
                  key={category}
                  category={category}
                  rating={rating}
                  color={SkillColors[category]}
                  delay={i * 80}
                />
              ))
            ) : (
              <ThemedText style={styles.noSkillsText}>
                Log sessions with skills to unlock ratings
              </ThemedText>
            )}
          </View>

          <View style={styles.divider} />

          {/* Footer stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: Colors.dark.primary }]}>
                {stats.currentStreak}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Streak</ThemedText>
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
                {stats.totalMinutes}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Minutes</ThemedText>
            </View>
          </View>

          {/* Wordmark */}
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
            <View style={styles.shareButtonInner}>
              <Feather name="share-2" size={18} color={Colors.dark.buttonText} />
              <ThemedText style={styles.shareLabel}>Share Card</ThemedText>
            </View>
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
    borderWidth: 1,
    borderColor: "#FFFFFF12",
    overflow: "hidden",
  },
  accentBar: {
    height: 5,
    width: "100%",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: CARD_PADDING,
    paddingBottom: Spacing.lg,
  },
  nameBlock: {
    flex: 1,
    marginRight: Spacing.md,
  },
  playerName: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
    color: Colors.dark.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  positionText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  teamText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.accent + "22",
    borderWidth: 1,
    borderColor: Colors.dark.accent + "66",
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
    color: Colors.dark.accent,
    letterSpacing: 1.5,
  },
  levelSection: {
    alignItems: "center",
    paddingHorizontal: CARD_PADDING,
    paddingBottom: CARD_PADDING,
  },
  levelRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  levelRingInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  levelRingName: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "Montserrat_700Bold",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  levelRingXp: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },
  xpBarTrack: {
    width: "100%",
    height: 5,
    backgroundColor: "#FFFFFF14",
    borderRadius: 2.5,
    overflow: "hidden",
    marginBottom: 6,
  },
  xpBarFill: {
    height: "100%",
    borderRadius: 2.5,
  },
  xpNextLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: "#FFFFFF12",
    marginHorizontal: CARD_PADDING,
    marginBottom: CARD_PADDING,
  },
  skillsBlock: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: CARD_PADDING,
    gap: Spacing.sm,
  },
  skillsHeading: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
    color: Colors.dark.textSecondary,
    letterSpacing: 2,
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
  noSkillsText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontStyle: "italic",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: CARD_PADDING,
    paddingBottom: CARD_PADDING,
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
    backgroundColor: "#FFFFFF12",
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "#FFFFFF10",
    paddingVertical: Spacing.md,
    marginHorizontal: CARD_PADDING,
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
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.sm,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButtonPressed: {
    opacity: 0.85,
  },
  shareButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
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
