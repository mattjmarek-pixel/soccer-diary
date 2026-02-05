import React from "react";
import { View, ScrollView, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { usePremium } from "@/contexts/PremiumContext";
import { TRAINING_TEMPLATES, TrainingTemplate } from "@/constants/templates";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { isPremium } = usePremium();

  const handleSelectTemplate = (template: TrainingTemplate) => {
    if (template.isPremium && !isPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Pro Feature",
        "This template is available with Soccer Diary Pro. Upgrade to access all templates.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Upgrade",
            onPress: () => navigation.navigate("Upgrade" as any),
          },
        ]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("NewEntry", {
      entry: {
        id: "",
        userId: "",
        date: new Date().toISOString().split("T")[0],
        mood: 3,
        duration: template.duration,
        reflection: "",
        skills: template.skills,
        createdAt: "",
        updatedAt: "",
      },
    });
  };

  const freeTemplates = TRAINING_TEMPLATES.filter((t) => !t.isPremium);
  const premiumTemplates = TRAINING_TEMPLATES.filter((t) => t.isPremium);

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
      <ThemedText type="small" style={styles.sectionLabel}>
        FREE TEMPLATES
      </ThemedText>
      {freeTemplates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onPress={() => handleSelectTemplate(template)}
          locked={false}
        />
      ))}

      <ThemedText type="small" style={[styles.sectionLabel, styles.proSection]}>
        PRO TEMPLATES
      </ThemedText>
      {premiumTemplates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onPress={() => handleSelectTemplate(template)}
          locked={!isPremium}
        />
      ))}
    </ScrollView>
  );
}

function TemplateCard({
  template,
  onPress,
  locked,
}: {
  template: TrainingTemplate;
  onPress: () => void;
  locked: boolean;
}) {
  return (
    <Card elevation={1} onPress={onPress} style={styles.templateCard}>
      <View style={styles.templateRow}>
        <View style={[styles.iconContainer, { opacity: locked ? 0.5 : 1 }]}>
          <Feather
            name={template.icon as keyof typeof Feather.glyphMap}
            size={24}
            color={locked ? Colors.dark.textSecondary : Colors.dark.primary}
          />
        </View>
        <View style={styles.templateInfo}>
          <View style={styles.templateTitleRow}>
            <ThemedText
              type="heading"
              style={[styles.templateName, locked ? styles.lockedText : null]}
            >
              {template.name}
            </ThemedText>
            {locked ? (
              <View style={styles.proBadge}>
                <Feather name="lock" size={10} color={Colors.dark.buttonText} />
                <ThemedText type="small" style={styles.proBadgeText}>
                  PRO
                </ThemedText>
              </View>
            ) : null}
          </View>
          <View style={styles.templateMeta}>
            <Feather name="clock" size={12} color={Colors.dark.textSecondary} />
            <ThemedText type="small" style={styles.metaText}>
              {template.duration} min
            </ThemedText>
            <ThemedText type="small" style={styles.metaDot}>
              {" "}
            </ThemedText>
            <ThemedText type="small" style={styles.metaText}>
              {template.skills.map((s) => s.category).join(", ")}
            </ThemedText>
          </View>
        </View>
        <Feather
          name="chevron-right"
          size={20}
          color={Colors.dark.textSecondary}
        />
      </View>
    </Card>
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
  sectionLabel: {
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  proSection: {
    marginTop: Spacing.xl,
  },
  templateCard: {
    marginBottom: Spacing.md,
  },
  templateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  templateName: {
    color: Colors.dark.text,
    fontSize: 16,
  },
  lockedText: {
    color: Colors.dark.textSecondary,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  proBadgeText: {
    color: Colors.dark.buttonText,
    fontSize: 10,
    fontWeight: "700",
  },
  templateMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  metaDot: {
    color: Colors.dark.textSecondary,
  },
});
