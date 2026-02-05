import React from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { usePremium } from "@/contexts/PremiumContext";

const PRO_FEATURES = [
  {
    icon: "cpu" as const,
    title: "AI Training Insights",
    description: "Get personalized coaching tips powered by AI analysis",
  },
  {
    icon: "bar-chart-2" as const,
    title: "Advanced Charts",
    description: "Detailed mood trends, duration graphs, and skill analytics",
  },
  {
    icon: "infinity" as const,
    title: "Unlimited Entries",
    description: "Log as many training sessions as you want",
  },
  {
    icon: "video" as const,
    title: "Video Attachments",
    description: "Attach training videos to your diary entries",
  },
  {
    icon: "share-2" as const,
    title: "Social Sharing",
    description: "Share milestone cards and training summaries",
  },
  {
    icon: "clipboard" as const,
    title: "Premium Templates",
    description: "Access all training session templates",
  },
];

export default function UpgradeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { isPremium, upgradeToPro, restorePurchases } = usePremium();

  const handleUpgrade = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await upgradeToPro();
      Alert.alert(
        "Welcome to Pro!",
        "You now have access to all premium features. In a production app, this would be handled by App Store or Google Play billing.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to upgrade. Please try again.");
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Restored", "Your purchases have been restored.");
    } catch (error) {
      Alert.alert("Error", "Failed to restore purchases.");
    }
  };

  if (isPremium) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          styles.centered,
          {
            paddingTop: headerHeight + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
      >
        <View style={styles.activeContainer}>
          <View style={styles.checkCircle}>
            <Feather name="check" size={32} color={Colors.dark.buttonText} />
          </View>
          <ThemedText type="h3" style={styles.activeTitle}>
            You're a Pro!
          </ThemedText>
          <ThemedText type="body" style={styles.activeSubtitle}>
            All premium features are unlocked. Enjoy your full Soccer Diary
            experience.
          </ThemedText>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing["2xl"],
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.proBadge}>
          <Feather name="star" size={20} color={Colors.dark.buttonText} />
        </View>
        <ThemedText type="h2" style={styles.title}>
          Soccer Diary Pro
        </ThemedText>
        <ThemedText type="body" style={styles.subtitle}>
          Take your training to the next level with premium features
        </ThemedText>
      </View>

      <View style={styles.priceCard}>
        <ThemedText type="h2" style={styles.price}>
          $4.99
        </ThemedText>
        <ThemedText type="body" style={styles.priceUnit}>
          / month
        </ThemedText>
      </View>

      <View style={styles.featureList}>
        {PRO_FEATURES.map((feature) => (
          <View key={feature.title} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Feather
                name={feature.icon}
                size={20}
                color={Colors.dark.primary}
              />
            </View>
            <View style={styles.featureInfo}>
              <ThemedText type="button" style={styles.featureTitle}>
                {feature.title}
              </ThemedText>
              <ThemedText type="small" style={styles.featureDescription}>
                {feature.description}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      <Button onPress={handleUpgrade} style={styles.upgradeButton}>
        Start Pro (Test Mode)
      </Button>

      <Button
        variant="outline"
        onPress={handleRestore}
        style={styles.restoreButton}
      >
        Restore Purchases
      </Button>

      <ThemedText type="small" style={styles.disclaimer}>
        In production, subscriptions are handled through the App Store or Google
        Play Store. This is a test mode for development.
      </ThemedText>
    </ScrollView>
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
  centered: {
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  proBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  priceCard: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    marginBottom: Spacing["2xl"],
  },
  price: {
    color: Colors.dark.primary,
  },
  priceUnit: {
    color: Colors.dark.textSecondary,
    marginLeft: Spacing.xs,
  },
  featureList: {
    marginBottom: Spacing["2xl"],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    color: Colors.dark.text,
    marginBottom: 2,
  },
  featureDescription: {
    color: Colors.dark.textSecondary,
  },
  upgradeButton: {
    marginBottom: Spacing.md,
  },
  restoreButton: {
    marginBottom: Spacing.lg,
  },
  disclaimer: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.6,
  },
  activeContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  activeTitle: {
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  activeSubtitle: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
});
