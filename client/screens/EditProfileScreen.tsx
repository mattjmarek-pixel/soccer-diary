import React, { useState, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { HeaderButton } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type EditProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, "EditProfile">;

const POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Forward"];
const PREFERRED_FEET = ["Left", "Right", "Both"] as const;

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<EditProfileNavigationProp>();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [age, setAge] = useState(user?.age?.toString() || "");
  const [team, setTeam] = useState(user?.team || "");
  const [position, setPosition] = useState(user?.position || "");
  const [preferredFoot, setPreferredFoot] = useState<"Left" | "Right" | "Both" | undefined>(
    user?.preferredFoot
  );
  const [avatarUrl, setAvatarUri] = useState<string | undefined>(user?.avatarUrl);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Missing Information", "Please enter your name");
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({
        name: name.trim(),
        age: age ? parseInt(age) : undefined,
        team: team.trim() || undefined,
        position: position || undefined,
        preferredFoot,
        avatarUrl,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.dark.primary} />
          ) : (
            <ThemedText type="body" style={{ color: Colors.dark.primary, fontWeight: "600" }}>
              Save
            </ThemedText>
          )}
        </HeaderButton>
      ),
    });
  }, [navigation, name, age, team, position, preferredFoot, avatarUrl, isSaving]);

  const handlePickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Please allow access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      <View style={styles.avatarSection}>
        <Pressable onPress={handlePickAvatar} style={styles.avatarContainer}>
          <Image
            source={
              avatarUrl
                ? { uri: avatarUrl }
                : require("../../assets/images/avatar-placeholder.png")
            }
            style={styles.avatar}
          />
          <View style={styles.editBadge}>
            <Feather name="camera" size={14} color={Colors.dark.buttonText} />
          </View>
        </Pressable>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="small" style={styles.label}>
          Name
        </ThemedText>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={Colors.dark.textSecondary}
          testID="input-name"
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="small" style={styles.label}>
          Age
        </ThemedText>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          placeholder="Your age"
          placeholderTextColor={Colors.dark.textSecondary}
          keyboardType="number-pad"
          testID="input-age"
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="small" style={styles.label}>
          Team
        </ThemedText>
        <TextInput
          style={styles.input}
          value={team}
          onChangeText={setTeam}
          placeholder="Your team name"
          placeholderTextColor={Colors.dark.textSecondary}
          testID="input-team"
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="small" style={styles.label}>
          Position
        </ThemedText>
        <View style={styles.optionRow}>
          {POSITIONS.map((pos) => (
            <Pressable
              key={pos}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPosition(pos === position ? "" : pos);
              }}
              style={[
                styles.optionChip,
                position === pos && styles.optionChipSelected,
              ]}
            >
              <ThemedText
                type="small"
                style={[
                  styles.optionText,
                  position === pos && styles.optionTextSelected,
                ]}
              >
                {pos}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="small" style={styles.label}>
          Preferred Foot
        </ThemedText>
        <View style={styles.optionRow}>
          {PREFERRED_FEET.map((foot) => (
            <Pressable
              key={foot}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPreferredFoot(foot === preferredFoot ? undefined : foot);
              }}
              style={[
                styles.optionChip,
                preferredFoot === foot && styles.optionChipSelected,
              ]}
            >
              <ThemedText
                type="small"
                style={[
                  styles.optionText,
                  preferredFoot === foot && styles.optionTextSelected,
                ]}
              >
                {foot}
              </ThemedText>
            </Pressable>
          ))}
        </View>
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
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.backgroundDefault,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.dark.backgroundRoot,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.dark.textSecondary,
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
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  optionChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundDefault,
  },
  optionChipSelected: {
    backgroundColor: Colors.dark.primary,
  },
  optionText: {
    color: Colors.dark.text,
  },
  optionTextSelected: {
    color: Colors.dark.buttonText,
    fontWeight: "600",
  },
});
