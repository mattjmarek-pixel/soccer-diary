import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Pressable, Alert, Platform, Share, Animated as RNAnimated } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { captureRef } from "react-native-view-shot";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useDiary } from "@/contexts/DiaryContext";
import { useAuth } from "@/contexts/AuthContext";
import { ACHIEVEMENTS } from "@/constants/achievements";

type SharableBadge = {
  title: string;
  description: string;
  icon: string;
  color: string;
};

function CounterProgressBar({ earned, total }: { earned: number; total: number }) {
  const progress = useRef(new RNAnimated.Value(0)).current;
  const fraction = total > 0 ? earned / total : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      RNAnimated.spring(progress, {
        toValue: fraction,
        useNativeDriver: false,
        tension: 50,
        friction: 10,
      }).start();
    }, 300);
    return () => clearTimeout(timer);
  }, [fraction]);

  return (
    <View style={counterStyles.container}>
      <View style={counterStyles.track}>
        <RNAnimated.View
          style={[
            counterStyles.fill,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      <ThemedText style={counterStyles.label}>
        {earned} of {total} badges earned
      </ThemedText>
    </View>
  );
}

const counterStyles = StyleSheet.create({
  container: {
    width: "80%",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  track: {
    width: "100%",
    height: 6,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  fill: {
    height: 6,
    backgroundColor: Colors.dark.primary,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
});

export default function AchievementsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { entries, stats } = useDiary();
  const { user } = useAuth();

  const [sharingBadge, setSharingBadge] = useState<SharableBadge | null>(null);
  const badgeShareRef = useRef<View>(null);

  const earnedStatus = useMemo(() => {
    return ACHIEVEMENTS.map((a) => ({
      ...a,
      earned: a.isEarned(entries, stats),
    }));
  }, [entries, stats]);

  const earnedCount = earnedStatus.filter((a) => a.earned).length;

  const rows: { left: typeof earnedStatus[0]; right?: typeof earnedStatus[0] }[] = [];
  for (let i = 0; i < earnedStatus.length; i += 2) {
    rows.push({ left: earnedStatus[i], right: earnedStatus[i + 1] });
  }

  useEffect(() => {
    if (!sharingBadge) return;
    const timer = setTimeout(async () => {
      const fallbackText = `I just earned the "${sharingBadge.title}" badge on Soccer Diary! ${sharingBadge.description}`;
      try {
        if (Platform.OS === "web" || !badgeShareRef.current) {
          await Share.share({ message: fallbackText });
          setSharingBadge(null);
          return;
        }
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          await Share.share({ message: fallbackText });
          setSharingBadge(null);
          return;
        }
        const uri = await captureRef(badgeShareRef, { format: "png", quality: 1 });
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share Badge" });
      } catch {
        try {
          await Share.share({ message: fallbackText });
        } catch {
          Alert.alert("Error", "Could not share this badge. Please try again.");
        }
      } finally {
        setSharingBadge(null);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [sharingBadge]);

  const handleShareBadge = (badge: SharableBadge) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSharingBadge(badge);
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing["2xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.counterContainer}>
          <ThemedText type="display" style={styles.counterValue}>
            {earnedCount}
          </ThemedText>
          <ThemedText type="h4" style={styles.counterTotal}>
            / {ACHIEVEMENTS.length}
          </ThemedText>
          <ThemedText type="small" style={styles.counterSubtitle}>
            badges earned
          </ThemedText>
          <CounterProgressBar earned={earnedCount} total={ACHIEVEMENTS.length} />
        </Animated.View>

        {rows.map((row, idx) => (
          <View
            key={`row-${idx}`}
            style={styles.row}
          >
            <Animated.View
              entering={FadeInDown.delay(80 + idx * 120).springify()}
              style={styles.badgeWrapper}
            >
              <BadgeCard
                title={row.left.title}
                description={row.left.description}
                icon={row.left.icon}
                color={row.left.color}
                earned={row.left.earned}
                onShare={() =>
                  handleShareBadge({
                    title: row.left.title,
                    description: row.left.description,
                    icon: row.left.icon,
                    color: row.left.color,
                  })
                }
              />
            </Animated.View>
            {row.right ? (
              <Animated.View
                entering={FadeInDown.delay(80 + idx * 120 + 60).springify()}
                style={styles.badgeWrapper}
              >
                <BadgeCard
                  title={row.right.title}
                  description={row.right.description}
                  icon={row.right.icon}
                  color={row.right.color}
                  earned={row.right.earned}
                  onShare={() =>
                    handleShareBadge({
                      title: row.right!.title,
                      description: row.right!.description,
                      icon: row.right!.icon,
                      color: row.right!.color,
                    })
                  }
                />
              </Animated.View>
            ) : (
              <View style={styles.badgePlaceholder} />
            )}
          </View>
        ))}
      </ScrollView>

      {sharingBadge ? (
        <View style={styles.offScreenCapture} collapsable={false} pointerEvents="none" ref={badgeShareRef}>
          <View style={styles.shareCard}>
            <View style={styles.shareCardHeader}>
              <Feather name="activity" size={16} color={Colors.dark.primary} />
              <ThemedText style={styles.shareCardAppName}>Soccer Diary</ThemedText>
            </View>
            <View
              style={[
                styles.shareCardIconCircle,
                { backgroundColor: sharingBadge.color + "25" },
              ]}
            >
              <Feather
                name={sharingBadge.icon as keyof typeof Feather.glyphMap}
                size={48}
                color={sharingBadge.color}
              />
            </View>
            <View
              style={[
                styles.shareCardBadgePill,
                { backgroundColor: sharingBadge.color + "20", borderColor: sharingBadge.color + "55" },
              ]}
            >
              <ThemedText style={[styles.shareCardBadgePillText, { color: sharingBadge.color }]}>
                Badge Unlocked
              </ThemedText>
            </View>
            <ThemedText style={styles.shareCardTitle}>{sharingBadge.title}</ThemedText>
            <ThemedText style={styles.shareCardDesc}>{sharingBadge.description}</ThemedText>
            {user?.name ? (
              <ThemedText style={styles.shareCardPlayer}>{user.name}</ThemedText>
            ) : null}
            <View style={styles.shareCardFooter}>
              <ThemedText style={styles.shareCardFooterText}>Train. Track. Grow.</ThemedText>
            </View>
          </View>
        </View>
      ) : null}
    </>
  );
}

function BadgeCard({
  title,
  description,
  icon,
  color,
  earned,
  onShare,
}: {
  title: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  onShare: () => void;
}) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: earned
            ? Colors.dark.backgroundSecondary
            : Colors.dark.backgroundDefault,
          opacity: earned ? 1 : 0.55,
          borderWidth: 1,
          borderColor: earned ? color + "55" : Colors.dark.backgroundTertiary,
        },
      ]}
    >
      {earned ? (
        <>
          <View style={styles.checkBadge}>
            <Feather name="check" size={10} color={Colors.dark.buttonText} />
          </View>
          <Pressable
            style={styles.shareBadgeBtn}
            onPress={onShare}
            hitSlop={8}
          >
            <Feather name="share-2" size={13} color={Colors.dark.textSecondary} />
          </Pressable>
        </>
      ) : null}

      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: earned ? color + "30" : Colors.dark.backgroundTertiary,
          },
        ]}
      >
        {earned ? (
          <Feather
            name={icon as keyof typeof Feather.glyphMap}
            size={28}
            color={color}
          />
        ) : (
          <Feather name="lock" size={28} color={Colors.dark.textSecondary} />
        )}
      </View>

      <ThemedText
        type="button"
        style={[
          styles.badgeTitle,
          { color: earned ? Colors.dark.text : Colors.dark.textSecondary },
        ]}
      >
        {title}
      </ThemedText>
      <ThemedText type="small" style={styles.badgeDescription}>
        {description}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  counterContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "22",
    marginBottom: Spacing["2xl"],
  },
  counterValue: {
    color: Colors.dark.primary,
    fontSize: 52,
    fontFamily: "Montserrat_700Bold",
  },
  counterTotal: {
    color: Colors.dark.textSecondary,
    marginTop: -Spacing.sm,
  },
  counterSubtitle: {
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  badgeWrapper: {
    width: "48%",
  },
  badge: {
    flex: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    alignItems: "center",
    position: "relative",
    minHeight: 160,
    justifyContent: "center",
  },
  badgePlaceholder: {
    width: "48%",
  },
  checkBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing["2xl"] + Spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  shareBadgeBtn: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  badgeTitle: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  badgeDescription: {
    textAlign: "center",
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  offScreenCapture: {
    position: "absolute",
    left: 0,
    top: 0,
    opacity: 0,
    pointerEvents: "none",
  },
  shareCard: {
    width: 340,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing["2xl"],
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.backgroundSecondary,
  },
  shareCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing["2xl"],
    alignSelf: "flex-start",
  },
  shareCardAppName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.dark.primary,
  },
  shareCardIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  shareCardBadgePill: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  shareCardBadgePillText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  shareCardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.dark.text,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  shareCardDesc: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  shareCardPlayer: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontWeight: "600",
    marginBottom: Spacing.xl,
  },
  shareCardFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.dark.backgroundSecondary,
    paddingTop: Spacing.md,
    alignSelf: "stretch",
    alignItems: "center",
  },
  shareCardFooterText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    letterSpacing: 1,
  },
});
