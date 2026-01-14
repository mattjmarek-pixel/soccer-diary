import React from "react";
import { View, StyleSheet, Image, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { StatCard } from "@/components/StatCard";
import { SettingsRow } from "@/components/SettingsRow";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useDiary } from "@/contexts/DiaryContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();
  const { stats } = useDiary();

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
      <View style={styles.profileSection}>
        <Image
          source={
            user?.avatarUri
              ? { uri: user.avatarUri }
              : require("../../assets/images/avatar-placeholder.png")
          }
          style={styles.avatar}
        />
        <ThemedText type="display" style={styles.name}>
          {user?.name || "Player"}
        </ThemedText>
        {user?.team ? (
          <ThemedText type="body" style={styles.team}>
            {user.team}
          </ThemedText>
        ) : null}
        {user?.position ? (
          <View style={styles.positionBadge}>
            <ThemedText type="small" style={styles.positionText}>
              {user.position}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.statsSection}>
        <ThemedText type="small" style={styles.sectionLabel}>
          Your Stats
        </ThemedText>
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
      </View>

      <View style={styles.settingsSection}>
        <ThemedText type="small" style={styles.sectionLabel}>
          Settings
        </ThemedText>
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
      </View>
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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.lg,
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
  positionBadge: {
    backgroundColor: Colors.dark.primary + "20",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  positionText: {
    color: Colors.dark.primary,
    fontWeight: "600",
  },
  statsSection: {
    marginBottom: Spacing["2xl"],
  },
  sectionLabel: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  settingsSection: {
    marginBottom: Spacing["2xl"],
  },
});
