import React, { useLayoutEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Platform,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { HeaderButton } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import { VideoView, useVideoPlayer } from "expo-video";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, MoodColors } from "@/constants/theme";
import { useDiary } from "@/contexts/DiaryContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type DiaryDetailRouteProp = RouteProp<RootStackParamList, "DiaryDetail">;
type DiaryDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, "DiaryDetail">;

const moodLabels = ["Terrible", "Bad", "Okay", "Good", "Great"];

function VideoPlayer({ videoUri }: { videoUri: string }) {
  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = false;
  });

  return (
    <Card elevation={1} style={styles.videoCard}>
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
      />
    </Card>
  );
}

export default function DiaryDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<DiaryDetailNavigationProp>();
  const route = useRoute<DiaryDetailRouteProp>();
  const { getEntry, deleteEntry } = useDiary();
  const shareCardRef = useRef<View>(null);

  const entry = getEntry(route.params.entryId);

  const shareText = entry
    ? `${moodLabels[(entry.mood ?? 1) - 1]} training session — ${entry.duration} min${entry.skills && entry.skills.length > 0 ? ` of ${entry.skills.map((s: { category: string }) => s.category).join(", ")}` : ""}. Logged with Soccer Diary.`
    : "";

  const handleShare = async () => {
    if (!entry) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (Platform.OS === "web" || !shareCardRef.current) {
        await Share.share({ message: shareText });
        return;
      }
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        await Share.share({ message: shareText });
        return;
      }
      const uri = await captureRef(shareCardRef, { format: "png", quality: 1 });
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share Training Session",
      });
    } catch {
      try {
        await Share.share({ message: shareText });
      } catch {
        Alert.alert("Error", "Failed to share. Please try again.");
      }
    }
  };

  useLayoutEffect(() => {
    if (entry) {
      const formattedDate = new Date(entry.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      navigation.setOptions({
        headerTitle: formattedDate,
        headerRight: () => (
          <View style={styles.headerButtons}>
            <HeaderButton onPress={handleShare}>
              <Feather name="share-2" size={20} color={Colors.dark.primary} />
            </HeaderButton>
            <HeaderButton
              onPress={() => navigation.navigate("NewEntry", { entry })}
            >
              <Feather name="edit-2" size={20} color={Colors.dark.text} />
            </HeaderButton>
            <HeaderButton onPress={handleDelete}>
              <Feather name="trash-2" size={20} color={Colors.dark.error} />
            </HeaderButton>
          </View>
        ),
      });
    }
  }, [entry, navigation]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this diary entry? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (entry) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await deleteEntry(entry.id);
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  if (!entry) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ThemedText type="body" style={styles.notFound}>
          Entry not found
        </ThemedText>
      </View>
    );
  }

  const moodColor = MoodColors[entry.mood as keyof typeof MoodColors];

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
    >
      <View style={styles.moodSection}>
        <View style={[styles.moodBadge, { backgroundColor: moodColor + "20" }]}>
          <ThemedText type="heading" style={[styles.moodText, { color: moodColor }]}>
            {moodLabels[entry.mood - 1]}
          </ThemedText>
        </View>
        <View style={styles.durationBadge}>
          <Feather name="clock" size={16} color={Colors.dark.textSecondary} />
          <ThemedText type="body" style={styles.durationText}>
            {entry.duration} minutes
          </ThemedText>
        </View>
      </View>

      {entry.reflection ? (
        <View style={styles.section}>
          <ThemedText type="small" style={styles.sectionLabel}>
            Reflection
          </ThemedText>
          <Card elevation={1} style={styles.reflectionCard}>
            <ThemedText type="body" style={styles.reflectionText}>
              {entry.reflection}
            </ThemedText>
          </Card>
        </View>
      ) : null}

      {entry.skills.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="small" style={styles.sectionLabel}>
            Skills Worked On
          </ThemedText>
          {entry.skills.map((skill) => (
            <Card key={skill.category} elevation={1} style={styles.skillCard}>
              <View style={styles.skillHeader}>
                <View style={styles.skillBadge}>
                  <ThemedText type="small" style={styles.skillCategory}>
                    {skill.category}
                  </ThemedText>
                </View>
              </View>
              {skill.notes ? (
                <ThemedText type="body" style={styles.skillNotes}>
                  {skill.notes}
                </ThemedText>
              ) : null}
            </Card>
          ))}
        </View>
      ) : null}

      {entry.videoUri ? (
        <View style={styles.section}>
          <ThemedText type="small" style={styles.sectionLabel}>
            Video
          </ThemedText>
          <VideoPlayer videoUri={entry.videoUri} />
        </View>
      ) : null}

      <View style={styles.shareCardWrapper} collapsable={false} pointerEvents="none" ref={shareCardRef}>
        <View style={styles.shareCard}>
          <View style={styles.shareHeader}>
            <Feather name="activity" size={16} color={Colors.dark.primary} />
            <ThemedText style={styles.shareAppName}>Soccer Diary</ThemedText>
          </View>
          <View style={[styles.shareMoodBadge, { backgroundColor: moodColor + "20" }]}>
            <ThemedText style={[styles.shareMoodText, { color: moodColor }]}>
              {moodLabels[entry.mood - 1]}
            </ThemedText>
          </View>
          <ThemedText style={styles.shareDuration}>
            {entry.duration} min session
          </ThemedText>
          {entry.skills.length > 0 ? (
            <View style={styles.shareSkillsRow}>
              {entry.skills.slice(0, 4).map((s) => (
                <View key={s.category} style={styles.shareSkillChip}>
                  <ThemedText style={styles.shareSkillChipText}>{s.category}</ThemedText>
                </View>
              ))}
            </View>
          ) : null}
          {entry.reflection ? (
            <ThemedText style={styles.shareReflection} numberOfLines={2}>
              "{entry.reflection}"
            </ThemedText>
          ) : null}
          <View style={styles.shareFooterRow}>
            <ThemedText style={styles.shareDate}>
              {new Date(entry.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </ThemedText>
            <ThemedText style={styles.shareTagline}>Train. Track. Grow.</ThemedText>
          </View>
        </View>
      </View>
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
    alignItems: "center",
    justifyContent: "center",
  },
  notFound: {
    color: Colors.dark.textSecondary,
  },
  headerButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  moodSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  moodBadge: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  moodText: {
    fontWeight: "600",
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  durationText: {
    color: Colors.dark.textSecondary,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionLabel: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  reflectionCard: {
    padding: Spacing.lg,
  },
  reflectionText: {
    color: Colors.dark.text,
    lineHeight: 24,
  },
  skillCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  skillHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  skillBadge: {
    backgroundColor: Colors.dark.primary + "20",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  skillCategory: {
    color: Colors.dark.primary,
    fontWeight: "600",
  },
  skillNotes: {
    color: Colors.dark.text,
    marginTop: Spacing.md,
  },
  videoCard: {
    padding: Spacing.sm,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.sm,
  },
  shareCardWrapper: {
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
    borderWidth: 1,
    borderColor: Colors.dark.backgroundSecondary,
  },
  shareHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  shareAppName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.dark.primary,
  },
  shareMoodBadge: {
    alignSelf: "flex-start",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  shareMoodText: {
    fontSize: 20,
    fontWeight: "800",
  },
  shareDuration: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  shareSkillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  shareSkillChip: {
    backgroundColor: Colors.dark.primary + "18",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  shareSkillChipText: {
    fontSize: 11,
    color: Colors.dark.primary,
    fontWeight: "700",
  },
  shareReflection: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontStyle: "italic",
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  shareFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.dark.backgroundSecondary,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  shareDate: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  shareTagline: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    letterSpacing: 0.5,
  },
});
