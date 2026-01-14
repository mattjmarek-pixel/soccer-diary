import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Alert,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { MoodSlider } from "@/components/MoodSlider";
import { SkillSelector } from "@/components/SkillSelector";
import { Colors, Spacing, BorderRadius, SkillCategory } from "@/constants/theme";
import { useDiary, DiaryEntry } from "@/contexts/DiaryContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NewEntryRouteProp = RouteProp<RootStackParamList, "NewEntry">;
type NewEntryNavigationProp = NativeStackNavigationProp<RootStackParamList, "NewEntry">;

export default function NewEntryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NewEntryNavigationProp>();
  const route = useRoute<NewEntryRouteProp>();
  const { addEntry, updateEntry, getEntry } = useDiary();

  const existingEntry = route.params?.entry;
  const isEditing = !!existingEntry;

  const [date, setDate] = useState(existingEntry?.date || new Date().toISOString().split("T")[0]);
  const [mood, setMood] = useState(existingEntry?.mood || 3);
  const [duration, setDuration] = useState(existingEntry?.duration?.toString() || "");
  const [reflection, setReflection] = useState(existingEntry?.reflection || "");
  const [skills, setSkills] = useState<{ category: SkillCategory; notes: string }[]>(
    existingEntry?.skills || []
  );
  const [videoUri, setVideoUri] = useState<string | undefined>(existingEntry?.videoUri);
  const [isSaving, setIsSaving] = useState(false);

  const handlePickVideo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Please allow access to your media library to add videos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos",
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRecordVideo = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Please allow access to your camera to record videos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "videos",
      allowsEditing: true,
      quality: 0.7,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRemoveVideo = () => {
    setVideoUri(undefined);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (!duration || parseInt(duration) <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Missing Information", "Please enter training duration");
      return;
    }

    setIsSaving(true);
    try {
      const entryData = {
        date,
        mood,
        duration: parseInt(duration),
        reflection,
        skills,
        videoUri,
      };

      if (isEditing && existingEntry) {
        await updateEntry(existingEntry.id, entryData);
      } else {
        await addEntry(entryData);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to save entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { 
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing["2xl"] 
        },
      ]}
    >
      <View style={styles.section}>
        <ThemedText type="body" style={styles.label}>
          Date
        </ThemedText>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.dark.textSecondary}
          testID="input-date"
        />
      </View>

      <MoodSlider value={mood} onChange={setMood} />

      <View style={styles.section}>
        <ThemedText type="body" style={styles.label}>
          Training Duration (minutes)
        </ThemedText>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          placeholder="e.g. 90"
          placeholderTextColor={Colors.dark.textSecondary}
          keyboardType="number-pad"
          testID="input-duration"
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="body" style={styles.label}>
          How did training go?
        </ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={reflection}
          onChangeText={setReflection}
          placeholder="Write about your session..."
          placeholderTextColor={Colors.dark.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          testID="input-reflection"
        />
      </View>

      <SkillSelector selectedSkills={skills} onChange={setSkills} />

      <View style={styles.section}>
        <ThemedText type="body" style={styles.label}>
          Video
        </ThemedText>
        {videoUri ? (
          <View style={styles.videoPreview}>
            <View style={styles.videoPlaceholder}>
              <Feather name="video" size={32} color={Colors.dark.primary} />
              <ThemedText type="small" style={styles.videoText}>
                Video attached
              </ThemedText>
            </View>
            <Pressable onPress={handleRemoveVideo} style={styles.removeButton}>
              <Feather name="x" size={20} color={Colors.dark.error} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.videoButtons}>
            <Button variant="secondary" onPress={handlePickVideo} style={styles.videoButton}>
              Choose Video
            </Button>
            <Button variant="secondary" onPress={handleRecordVideo} style={styles.videoButton}>
              Record Video
            </Button>
          </View>
        )}
      </View>

      <Button onPress={handleSave} style={styles.saveButton} disabled={isSaving}>
        {isSaving ? (
          <ActivityIndicator color={Colors.dark.buttonText} />
        ) : isEditing ? (
          "Update Entry"
        ) : (
          "Save Entry"
        )}
      </Button>
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
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.dark.text,
    height: Spacing.inputHeight,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  videoButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  videoButton: {
    flex: 1,
  },
  videoPreview: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  videoPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  videoText: {
    color: Colors.dark.primary,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
});
