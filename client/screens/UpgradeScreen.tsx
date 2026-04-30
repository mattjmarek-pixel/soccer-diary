import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

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
    icon: "zap" as const,
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
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleWaitlistSubmit = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/waitlist", { email });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to join the waitlist. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setWaitlistOpen(false);
    setEmail("");
    setErrorMsg("");
    setSubmitted(false);
  };

  return (
    <>
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

        <View style={styles.comingSoonBanner}>
          <Feather name="clock" size={16} color={Colors.dark.primary} />
          <ThemedText type="small" style={styles.comingSoonText}>
            Pro features are coming soon
          </ThemedText>
        </View>

        <View style={styles.featureList}>
          {PRO_FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Feather name={feature.icon} size={20} color={Colors.dark.primary} />
              </View>
              <View style={styles.featureInfo}>
                <View style={styles.featureTitleRow}>
                  <ThemedText type="button" style={styles.featureTitle}>
                    {feature.title}
                  </ThemedText>
                  <View style={styles.lockBadge}>
                    <Feather name="lock" size={10} color={Colors.dark.textSecondary} />
                    <ThemedText type="small" style={styles.lockText}>
                      Soon
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="small" style={styles.featureDescription}>
                  {feature.description}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        <Button
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setWaitlistOpen(true);
          }}
          style={styles.waitlistButton}
        >
          Join the Waitlist
        </Button>

        <ThemedText type="small" style={styles.disclaimer}>
          Be the first to know when Pro launches. No spam, unsubscribe any time.
        </ThemedText>
      </ScrollView>

      {/* Waitlist Modal */}
      <Modal
        visible={waitlistOpen}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />

            {submitted ? (
              <View style={styles.successContainer} testID="waitlist-success">
                <View style={styles.successIconWrap}>
                  <Feather name="check-circle" size={48} color={Colors.dark.primary} />
                </View>
                <ThemedText type="h3" style={styles.modalTitle}>
                  You're on the list!
                </ThemedText>
                <ThemedText type="body" style={styles.modalSubtitle}>
                  We'll let you know the moment Soccer Diary Pro launches.
                </ThemedText>
                <Button onPress={closeModal} style={styles.submitButton}>
                  Done
                </Button>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconWrap}>
                    <Feather name="bell" size={24} color={Colors.dark.primary} />
                  </View>
                  <ThemedText type="h3" style={styles.modalTitle}>
                    Join the Waitlist
                  </ThemedText>
                  <ThemedText type="body" style={styles.modalSubtitle}>
                    Enter your email and we'll notify you the moment Soccer Diary Pro launches.
                  </ThemedText>
                </View>

                <TextInput
                  style={styles.emailInput}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setErrorMsg(""); }}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.dark.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  testID="input-waitlist-email"
                />

                {errorMsg.length > 0 ? (
                  <ThemedText type="small" style={styles.errorText} testID="waitlist-error">
                    {errorMsg}
                  </ThemedText>
                ) : null}

                <Button
                  onPress={handleWaitlistSubmit}
                  style={styles.submitButton}
                  disabled={isSubmitting}
                  testID="button-notify-me"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={Colors.dark.buttonText} />
                  ) : (
                    "Notify Me"
                  )}
                </Button>

                <Button
                  variant="outline"
                  onPress={closeModal}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
              </>
            )}

            <View style={{ height: insets.bottom }} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  comingSoonBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.dark.primary + "18",
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  comingSoonText: {
    color: Colors.dark.primary,
    fontWeight: "600",
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
  featureTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 2,
  },
  featureTitle: {
    color: Colors.dark.text,
  },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  lockText: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
  },
  featureDescription: {
    color: Colors.dark.textSecondary,
  },
  waitlistButton: {
    marginBottom: Spacing.md,
  },
  disclaimer: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.7,
    marginBottom: Spacing.lg,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingTop: Spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignSelf: "center",
    marginBottom: Spacing.xl,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  modalSubtitle: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  emailInput: {
    height: 52,
    backgroundColor: Colors.dark.backgroundRoot,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: Spacing.lg,
  },
  submitButton: {
    marginBottom: Spacing.sm,
  },
  cancelButton: {},
  successContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  successIconWrap: {
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: "#FF5252",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
});
