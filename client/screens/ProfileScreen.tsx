import React, { useEffect } from "react";
import { View, StyleSheet, Image, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { StatCard } from "@/components/StatCard";
import { SettingsRow } from "@/components/SettingsRow";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useDiary } from "@/contexts/DiaryContext";
import { usePremium } from "@/contexts/PremiumContext";
import { useXP } from "@/contexts/XPContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

function XPProgressBar({ progress, color }: { progress: number; color: string }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress, { duration: 800 });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
    backgroundColor: color,
  }));

  return (
    <View style={xpBarStyles.track}>
      <Animated.View style={[xpBarStyles.fill, barStyle]} />
    </View>
  );
}

const xpBarStyles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: Spacing.sm,
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
});

function SectionHeader({ icon, label }: { icon: keyof typeof Feather.glyphMap; label: string }) {
  return (
    <View style={sectionStyles.container}>
      <View style={sectionStyles.iconWrap}>
        <Feather name={icon} size={13} color={Colors.dark.primary} />
      </View>
      <ThemedText style={sectionStyles.label}>{label}</ThemedText>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: Colors.dark.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
});

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();
  const { entries, stats } = useDiary();
  const { isPremium, subscriptionTier } = usePremium();
  const { getLevelInfo } = useXP();
  const levelInfo = getLevelInfo();

  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: "Auth" }],
            });
          },
        },
      ]
    );
  };

  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing["2xl"],
        },
      ]}
    >
      <Animated.View entering={FadeIn.delay(50)} style={styles.profileSection}>
        <View style={styles.avatarGlowRing}>
          <Image
            source={
              user?.avatarUri
                ? { uri: user.avatarUri }
                : require("../../assets/images/avatar-placeholder.png")
            }
            style={styles.avatar}
          />
        </View>
        <ThemedText type="display" style={styles.name}>
          {user?.name || "Player"}
        </ThemedText>
        {user?.team ? (
          <ThemedText type="body" style={styles.team}>
            {user.team}
          </ThemedText>
        ) : null}
        <View style={styles.badgeRow}>
          {user?.position ? (
            <View style={styles.positionBadge}>
              <ThemedText type="small" style={styles.positionText}>
                {user.position}
              </ThemedText>
            </View>
          ) : null}
          <View style={[styles.positionBadge, isPremium ? styles.proBadge : styles.freeBadge]}>
            <ThemedText type="small" style={[styles.positionText, isPremium ? styles.proText : styles.freeText]}>
              {isPremium ? "PRO" : "FREE"}
            </ThemedText>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(75).duration(400)} style={styles.levelSection}>
        <Card elevation={1} style={[styles.levelCard, { borderColor: levelInfo.current.color + "44" }]}>
          <View style={styles.levelRow}>
            <View style={[styles.levelBadge, { backgroundColor: levelInfo.current.color + "22", borderColor: levelInfo.current.color + "66" }]}>
              <ThemedText style={[styles.levelBadgeText, { color: levelInfo.current.color }]}>
                {levelInfo.current.name.toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.levelXpWrap}>
              <ThemedText style={[styles.levelXpValue, { color: levelInfo.current.color }]}>
                {levelInfo.totalXp.toLocaleString()} XP
              </ThemedText>
              {levelInfo.next ? (
                <ThemedText type="small" style={styles.levelXpNext}>
                  {levelInfo.xpForNext ? levelInfo.xpForNext - levelInfo.xpInLevel : 0} XP to {levelInfo.next.name}
                </ThemedText>
              ) : (
                <ThemedText type="small" style={styles.levelXpNext}>Max level reached</ThemedText>
              )}
            </View>
          </View>
          <XPProgressBar progress={levelInfo.progress} color={levelInfo.current.color} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.statsSection}>
        <SectionHeader icon="bar-chart-2" label="Your Stats" />
        <View style={styles.statsRow}>
          <StatCard
            icon="book-open"
            value={stats.totalEntries}
            label="Entries"
            color={Colors.dark.primary}
          />
          <StatCard
            icon="clock"
            value={formatMinutes(stats.totalMinutes)}
            label="Training"
            color={Colors.dark.accent}
          />
          <StatCard
            icon="zap"
            value={stats.currentStreak}
            label="Day Streak"
            color="#FF6B6B"
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(160).duration(400)} style={styles.heatmapSection}>
        <SectionHeader icon="grid" label="Activity" />
        <Card elevation={1} style={styles.heatmapCard}>
          <CalendarHeatmap entries={entries} weeks={12} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(220).duration(400)} style={styles.settingsSection}>
        <SectionHeader icon="star" label="Features" />
        <SettingsRow
          icon="credit-card"
          label="My Player Card"
          onPress={() => navigation.navigate("PlayerCardModal")}
          iconColor={Colors.dark.primary}
        />
        <SettingsRow
          icon="clipboard"
          label="Training Templates"
          onPress={() => navigation.navigate("Templates")}
        />
        <SettingsRow
          icon="cpu"
          label="AI Insights"
          onPress={() => navigation.navigate("Insights")}
        />
        <SettingsRow
          icon="star"
          label={isPremium ? "Manage Subscription" : "Upgrade to Pro"}
          onPress={() => navigation.navigate("Upgrade")}
          iconColor={Colors.dark.accent}
        />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(280).duration(400)} style={styles.settingsSection}>
        <SectionHeader icon="settings" label="Settings" />
        <SettingsRow
          icon="user"
          label="Edit Profile"
          onPress={handleEditProfile}
        />
        <SettingsRow
          icon="log-out"
          label="Log Out"
          onPress={handleLogout}
          destructive
          showChevron={false}
        />
      </Animated.View>
    </KeyboardAwareScrollViewCompat>
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
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  avatarGlowRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: Colors.dark.primary + "66",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    shadowColor: Colors.dark.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  avatar: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: Colors.dark.backgroundDefault,
  },
  name: {
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  team: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  positionBadge: {
    backgroundColor: Colors.dark.primary + "20",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "44",
  },
  positionText: {
    color: Colors.dark.primary,
    fontWeight: "600",
  },
  proBadge: {
    backgroundColor: Colors.dark.accent + "20",
    borderColor: Colors.dark.accent + "44",
  },
  proText: {
    color: Colors.dark.accent,
  },
  freeBadge: {
    backgroundColor: Colors.dark.textSecondary + "20",
    borderColor: Colors.dark.textSecondary + "44",
  },
  freeText: {
    color: Colors.dark.textSecondary,
  },
  levelSection: {
    marginBottom: Spacing["2xl"],
  },
  levelCard: {
    padding: Spacing.lg,
    borderWidth: 1,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  levelBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  levelXpWrap: {
    flex: 1,
  },
  levelXpValue: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
  },
  levelXpNext: {
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  statsSection: {
    marginBottom: Spacing["2xl"],
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  heatmapSection: {
    marginBottom: Spacing["2xl"],
  },
  heatmapCard: {
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "22",
  },
  settingsSection: {
    marginBottom: Spacing["2xl"],
  },
});
