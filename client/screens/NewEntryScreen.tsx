import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Alert,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  SlideInRight,
  SlideInLeft,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { MoodSlider } from "@/components/MoodSlider";
import { SkillSelector } from "@/components/SkillSelector";
import { Colors, Spacing, BorderRadius, SkillCategory, MoodColors } from "@/constants/theme";
import { useDiary, DiaryEntry } from "@/contexts/DiaryContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NewEntryRouteProp = RouteProp<RootStackParamList, "NewEntry">;
type NewEntryNavigationProp = NativeStackNavigationProp<RootStackParamList, "NewEntry">;

const STEPS = ["Mood", "Duration", "Skills", "Notes", "Media"] as const;
const DURATION_PRESETS = [15, 30, 45, 60, 90];
const CONFETTI_COLORS = [
  Colors.dark.primary,
  Colors.dark.accent,
  "#FF5252",
  "#7C4DFF",
  "#00BCD4",
  "#FF80AB",
  "#FF9800",
];

const PARTICLES_DATA = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  angle: (i / 28) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
  distance: 90 + Math.random() * 130,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: Math.floor(Math.random() * 120),
  size: 7 + Math.random() * 9,
  isRect: i % 3 !== 0,
}));

function ConfettiParticle({
  angle,
  distance,
  color,
  delay,
  size,
  isRect,
}: {
  angle: number;
  distance: number;
  color: string;
  delay: number;
  size: number;
  isRect: boolean;
}) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 80;
    opacity.value = withDelay(
      delay,
      withSequence(withTiming(1, { duration: 80 }), withDelay(550, withTiming(0, { duration: 350 })))
    );
    scale.value = withDelay(
      delay,
      withSequence(withSpring(1, { damping: 8, stiffness: 260 }), withDelay(550, withTiming(0, { duration: 350 })))
    );
    x.value = withDelay(delay, withSpring(dx, { damping: 14, stiffness: 55 }));
    y.value = withDelay(delay, withSpring(dy, { damping: 14, stiffness: 55 }));
    rotate.value = withDelay(delay, withSpring((Math.random() - 0.5) * 680, { damping: 10, stiffness: 35 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        celebrationStyles.particle,
        {
          width: isRect ? size * 1.6 : size,
          height: size,
          borderRadius: isRect ? 2 : size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function CelebrationOverlay({ onDismiss }: { onDismiss: () => void }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const triggerDismiss = useCallback(() => {
    opacity.value = withTiming(0, { duration: 280 });
    scale.value = withSpring(0, { damping: 14, stiffness: 220 }, () => {
      runOnJS(onDismiss)();
    });
  }, [onDismiss]);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 180 });
    scale.value = withSpring(1, { damping: 11, stiffness: 160 });
    const timer = setTimeout(triggerDismiss, 1600);
    return () => clearTimeout(timer);
  }, [triggerDismiss]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[celebrationStyles.overlay, { pointerEvents: "none" }]}>
      <View style={celebrationStyles.particleOrigin}>
        {PARTICLES_DATA.map((p) => (
          <ConfettiParticle
            key={p.id}
            angle={p.angle}
            distance={p.distance}
            color={p.color}
            delay={p.delay}
            size={p.size}
            isRect={p.isRect}
          />
        ))}
      </View>
      <Animated.View style={[celebrationStyles.card, cardStyle]}>
        <View style={celebrationStyles.iconCircle}>
          <Feather name="check" size={34} color={Colors.dark.buttonText} />
        </View>
        <ThemedText type="h3" style={celebrationStyles.title}>
          Great session!
        </ThemedText>
        <ThemedText type="small" style={celebrationStyles.subtitle}>
          Keep it up — every session counts.
        </ThemedText>
      </Animated.View>
    </View>
  );
}

function ProgressSegment({ active }: { active: boolean }) {
  const opacity = useSharedValue(active ? 1 : 0.25);
  const scaleY = useSharedValue(active ? 1.5 : 1);

  useEffect(() => {
    opacity.value = withSpring(active ? 1 : 0.25, { damping: 14, stiffness: 130 });
    scaleY.value = withSpring(active ? 1.5 : 1, { damping: 14, stiffness: 130 });
  }, [active]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Animated.View style={[progressStyles.segment, style]} />
  );
}

function WizardProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={progressStyles.track}>
      {Array.from({ length: total }, (_, i) => (
        <ProgressSegment key={i} active={i <= step} />
      ))}
    </View>
  );
}

function MoodStep({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={stepStyles.container}>
      <ThemedText type="h3" style={stepStyles.title}>
        How did you feel?
      </ThemedText>
      <ThemedText type="small" style={stepStyles.subtitle}>
        Rate your energy and mindset going into training.
      </ThemedText>
      <View style={stepStyles.moodGrid}>
        {([1, 2, 3, 4, 5] as const).map((m) => {
          const isSelected = value === m;
          const color = MoodColors[m];
          const labels = ["Rough", "Low", "Okay", "Good", "Great"];
          const icons: ("frown" | "frown" | "meh" | "smile" | "smile")[] = ["frown", "frown", "meh", "smile", "smile"];
          return (
            <Pressable
              key={m}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(m);
              }}
              style={[
                stepStyles.moodCard,
                {
                  backgroundColor: isSelected ? color + "22" : Colors.dark.backgroundDefault,
                  borderColor: isSelected ? color : Colors.dark.backgroundSecondary,
                  borderWidth: 2,
                },
              ]}
            >
              <View style={[stepStyles.moodIconCircle, { backgroundColor: isSelected ? color : Colors.dark.backgroundSecondary }]}>
                <Feather name={icons[m - 1]} size={26} color={isSelected ? Colors.dark.buttonText : Colors.dark.textSecondary} />
              </View>
              <ThemedText type="small" style={[stepStyles.moodLabel, { color: isSelected ? color : Colors.dark.textSecondary }]}>
                {labels[m - 1]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DurationStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const numVal = parseInt(value) || 0;

  const adjust = (delta: number) => {
    const next = Math.max(0, numVal + delta);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(next.toString());
  };

  return (
    <View style={stepStyles.container}>
      <ThemedText type="h3" style={stepStyles.title}>
        How long did you train?
      </ThemedText>
      <ThemedText type="small" style={stepStyles.subtitle}>
        Enter the number of minutes you spent on the pitch.
      </ThemedText>
      <View style={stepStyles.durationDisplay}>
        <Pressable onPress={() => adjust(-5)} style={stepStyles.adjustBtn}>
          <Feather name="minus" size={24} color={Colors.dark.text} />
        </Pressable>
        <View style={stepStyles.durationValueWrap}>
          <ThemedText style={stepStyles.durationValue}>{numVal}</ThemedText>
          <ThemedText type="small" style={stepStyles.durationUnit}>min</ThemedText>
        </View>
        <Pressable onPress={() => adjust(5)} style={stepStyles.adjustBtn}>
          <Feather name="plus" size={24} color={Colors.dark.text} />
        </Pressable>
      </View>
      <View style={stepStyles.presetRow}>
        {DURATION_PRESETS.map((p) => (
          <Pressable
            key={p}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(p.toString());
            }}
            style={[
              stepStyles.presetChip,
              numVal === p && stepStyles.presetChipActive,
            ]}
          >
            <ThemedText
              type="small"
              style={[stepStyles.presetLabel, numVal === p && stepStyles.presetLabelActive]}
            >
              {p}m
            </ThemedText>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={stepStyles.durationInput}
        value={value}
        onChangeText={onChange}
        placeholder="Custom minutes..."
        placeholderTextColor={Colors.dark.textSecondary}
        keyboardType="number-pad"
        testID="input-duration"
      />
    </View>
  );
}

function SkillsStep({
  skills,
  onChange,
}: {
  skills: { category: SkillCategory; notes: string }[];
  onChange: (s: { category: SkillCategory; notes: string }[]) => void;
}) {
  return (
    <View style={stepStyles.container}>
      <ThemedText type="h3" style={stepStyles.title}>
        What did you work on?
      </ThemedText>
      <ThemedText type="small" style={stepStyles.subtitle}>
        Select the skills you focused on. Add notes for each if you want.
      </ThemedText>
      <SkillSelector selectedSkills={skills} onChange={onChange} />
    </View>
  );
}

function NotesStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={stepStyles.container}>
      <ThemedText type="h3" style={stepStyles.title}>
        Reflect on your session
      </ThemedText>
      <ThemedText type="small" style={stepStyles.subtitle}>
        What went well? What do you want to improve? (Optional)
      </ThemedText>
      <TextInput
        style={stepStyles.notesInput}
        value={value}
        onChangeText={onChange}
        placeholder="e.g. Worked hard on first touch drills, felt sharp in the final 20 minutes..."
        placeholderTextColor={Colors.dark.textSecondary}
        multiline
        textAlignVertical="top"
        autoFocus
        testID="input-reflection"
      />
      <ThemedText type="small" style={stepStyles.promptHint}>
        Tip: even 1–2 sentences builds a powerful training journal over time.
      </ThemedText>
    </View>
  );
}

function MediaStep({
  mediaUri,
  mediaType,
  onPickFromLibrary,
  onTakePhoto,
  onRecordVideo,
  onRemoveMedia,
}: {
  mediaUri?: string;
  mediaType?: "photo" | "video";
  onPickFromLibrary: () => void;
  onTakePhoto: () => void;
  onRecordVideo: () => void;
  onRemoveMedia: () => void;
}) {
  const iconName = mediaType === "video" ? "video" : "image";
  const label = mediaType === "video" ? "Video attached" : "Photo attached";

  return (
    <View style={stepStyles.container}>
      <ThemedText type="h3" style={stepStyles.title}>
        Attach media
      </ThemedText>
      <ThemedText type="small" style={stepStyles.subtitle}>
        Add a photo or video from your session. (Optional)
      </ThemedText>
      {mediaUri ? (
        <View style={stepStyles.videoAttached}>
          <View style={stepStyles.videoAttachedLeft}>
            <View style={stepStyles.videoIconCircle}>
              <Feather name={iconName} size={22} color={Colors.dark.primary} />
            </View>
            <ThemedText type="small" style={stepStyles.videoAttachedLabel}>
              {label}
            </ThemedText>
          </View>
          <Pressable onPress={onRemoveMedia} style={stepStyles.removeBtn}>
            <Feather name="x" size={18} color={Colors.dark.error} />
          </Pressable>
        </View>
      ) : (
        <View style={stepStyles.mediaGrid}>
          <Pressable onPress={onPickFromLibrary} style={stepStyles.mediaBtn}>
            <View style={stepStyles.mediaBtnIcon}>
              <Feather name="folder" size={26} color={Colors.dark.primary} />
            </View>
            <ThemedText type="small" style={stepStyles.mediaBtnLabel}>
              Library
            </ThemedText>
          </Pressable>
          <Pressable onPress={onTakePhoto} style={stepStyles.mediaBtn}>
            <View style={stepStyles.mediaBtnIcon}>
              <Feather name="camera" size={26} color={Colors.dark.accent} />
            </View>
            <ThemedText type="small" style={stepStyles.mediaBtnLabel}>
              Take Photo
            </ThemedText>
          </Pressable>
          <Pressable onPress={onRecordVideo} style={stepStyles.mediaBtn}>
            <View style={stepStyles.mediaBtnIcon}>
              <Feather name="video" size={26} color="#FF9800" />
            </View>
            <ThemedText type="small" style={stepStyles.mediaBtnLabel}>
              Record Video
            </ThemedText>
          </Pressable>
        </View>
      )}
      <ThemedText type="small" style={stepStyles.skipHint}>
        You can skip this step — it's totally optional.
      </ThemedText>
    </View>
  );
}

export default function NewEntryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NewEntryNavigationProp>();
  const route = useRoute<NewEntryRouteProp>();
  const { addEntry, updateEntry } = useDiary();

  const existingEntry = route.params?.entry;
  const isEditing = !!existingEntry;

  const [date, setDate] = useState(existingEntry?.date || new Date().toISOString().split("T")[0]);
  const [mood, setMood] = useState(existingEntry?.mood || 3);
  const [duration, setDuration] = useState(existingEntry?.duration?.toString() || "");
  const [reflection, setReflection] = useState(existingEntry?.reflection || "");
  const [skills, setSkills] = useState<{ category: SkillCategory; notes: string }[]>(
    existingEntry?.skills || []
  );
  const [mediaUri, setMediaUri] = useState<string | undefined>(existingEntry?.videoUri);
  const [mediaType, setMediaType] = useState<"photo" | "video" | undefined>(
    existingEntry?.mediaType ?? (existingEntry?.videoUri ? "video" : undefined)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [navDir, setNavDir] = useState<1 | -1>(1);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [xpFlashAmount, setXpFlashAmount] = useState(0);
  const savedRef = useRef(false);
  const xpFlashOpacity = useSharedValue(0);
  const xpFlashTranslateY = useSharedValue(0);

  const xpFlashStyle = useAnimatedStyle(() => ({
    opacity: xpFlashOpacity.value,
    transform: [{ translateY: xpFlashTranslateY.value }],
  }));

  useEffect(() => {
    if (xpFlashAmount <= 0) return;
    xpFlashOpacity.value = 0;
    xpFlashTranslateY.value = 0;
    xpFlashOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(500, withTiming(0, { duration: 300 }))
    );
    xpFlashTranslateY.value = withTiming(-44, { duration: 950 });
  }, [xpFlashAmount]);

  const hasData = useCallback(() => {
    return (
      mood !== 3 ||
      duration !== "" ||
      reflection !== "" ||
      skills.length > 0 ||
      mediaUri !== undefined
    );
  }, [mood, duration, reflection, skills, mediaUri]);

  useEffect(() => {
    if (isEditing) return;
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (savedRef.current) return;
      if (!hasData() && currentStep === 0) return;
      e.preventDefault();
      Alert.alert("Discard session?", "Your unsaved progress will be lost.", [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsubscribe;
  }, [navigation, isEditing, hasData, currentStep]);

  const handlePickFromLibrary = async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!result.granted) {
      Alert.alert("Permission Required", "Please allow access to your media library.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0];
      setMediaUri(asset.uri);
      setMediaType(asset.type === "video" ? "video" : "photo");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleTakePhoto = async () => {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    if (!result.granted) {
      Alert.alert("Permission Required", "Please allow camera access.");
      return;
    }
    const photo = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.8,
    });
    if (!photo.canceled && photo.assets[0]) {
      setMediaUri(photo.assets[0].uri);
      setMediaType("photo");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRecordVideo = async () => {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    if (!result.granted) {
      Alert.alert("Permission Required", "Please allow camera access.");
      return;
    }
    const recorded = await ImagePicker.launchCameraAsync({
      mediaTypes: "videos",
      allowsEditing: true,
      quality: 0.7,
      videoMaxDuration: 60,
    });
    if (!recorded.canceled && recorded.assets[0]) {
      setMediaUri(recorded.assets[0].uri);
      setMediaType("video");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSave = async () => {
    const mins = parseInt(duration);
    if (!duration || mins <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Missing Duration", "Please enter how long you trained.");
      if (!isEditing) { setNavDir(1); setCurrentStep(1); }
      return;
    }

    setIsSaving(true);
    try {
      const entryData = { date, mood, duration: mins, reflection, skills, videoUri: mediaUri, mediaType };
      if (isEditing && existingEntry) {
        const { xpDelta } = await updateEntry(existingEntry.id, entryData);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (xpDelta > 0) {
          setXpFlashAmount(xpDelta);
          setTimeout(() => navigation.goBack(), 1000);
        } else {
          navigation.goBack();
        }
      } else {
        const savedEntry = await addEntry(entryData);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        savedRef.current = true;
        setXpFlashAmount(savedEntry.xpAwarded);
        setTimeout(() => setIsCelebrating(true), 750);
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to save entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setNavDir(1);
      setCurrentStep((s) => s + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setNavDir(-1);
      setCurrentStep((s) => s - 1);
    } else {
      navigation.goBack();
    }
  };

  if (isEditing) {
    return (
      <View style={{ flex: 1 }}>
      {xpFlashAmount > 0 ? (
        <Animated.View style={[editStyles.xpFlashOverlay, xpFlashStyle, { pointerEvents: "none" }]}>
          <ThemedText style={wizardStyles.xpFlashText}>+{xpFlashAmount} XP</ThemedText>
        </Animated.View>
      ) : null}
      <KeyboardAwareScrollViewCompat
        style={editStyles.container}
        contentContainerStyle={[editStyles.content, { paddingBottom: insets.bottom + Spacing["2xl"] }]}
      >
        <View style={editStyles.section}>
          <ThemedText type="body" style={editStyles.label}>Date</ThemedText>
          <TextInput
            style={editStyles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.dark.textSecondary}
            testID="input-date"
          />
        </View>
        <MoodSlider value={mood} onChange={setMood} />
        <View style={editStyles.section}>
          <ThemedText type="body" style={editStyles.label}>Training Duration (minutes)</ThemedText>
          <TextInput
            style={editStyles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="e.g. 90"
            placeholderTextColor={Colors.dark.textSecondary}
            keyboardType="number-pad"
            testID="input-duration"
          />
        </View>
        <View style={editStyles.section}>
          <ThemedText type="body" style={editStyles.label}>Reflection</ThemedText>
          <TextInput
            style={[editStyles.input, editStyles.textArea]}
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
        <View style={editStyles.section}>
          <ThemedText type="body" style={editStyles.label}>Media</ThemedText>
          {mediaUri ? (
            <View style={editStyles.videoRow}>
              <View style={editStyles.videoLeft}>
                <Feather name={mediaType === "video" ? "video" : "image"} size={20} color={Colors.dark.primary} />
                <ThemedText type="small" style={{ color: Colors.dark.primary, marginLeft: 8 }}>
                  {mediaType === "video" ? "Video" : "Photo"} attached
                </ThemedText>
              </View>
              <Pressable onPress={() => { setMediaUri(undefined); setMediaType(undefined); }} style={{ padding: 8 }}>
                <Feather name="x" size={18} color={Colors.dark.error} />
              </Pressable>
            </View>
          ) : (
            <View style={editStyles.videoButtons}>
              <Button variant="secondary" onPress={handlePickFromLibrary} style={{ flex: 1 }}>Library</Button>
              <Button variant="secondary" onPress={handleRecordVideo} style={{ flex: 1 }}>Record</Button>
            </View>
          )}
        </View>
        <Button onPress={handleSave} style={{ marginTop: Spacing.lg }} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color={Colors.dark.buttonText} /> : "Update Entry"}
        </Button>
      </KeyboardAwareScrollViewCompat>
      </View>
    );
  }

  const isLastStep = currentStep === STEPS.length - 1;
  const topPad = insets.top + Spacing.md;

  return (
    <View style={wizardStyles.root}>
      {isCelebrating ? (
        <CelebrationOverlay onDismiss={() => navigation.goBack()} />
      ) : null}

      <View style={[wizardStyles.header, { paddingTop: topPad }]}>
        <Pressable onPress={handleBack} style={wizardStyles.headerBtn} testID="button-wizard-back">
          <Feather name={currentStep === 0 ? "x" : "arrow-left"} size={22} color={Colors.dark.text} />
        </Pressable>
        <View style={wizardStyles.headerCenter}>
          <ThemedText type="small" style={wizardStyles.stepLabel}>
            {currentStep + 1} of {STEPS.length}
          </ThemedText>
        </View>
        <View style={wizardStyles.headerBtn} />
      </View>

      <WizardProgressBar step={currentStep} total={STEPS.length} />

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={wizardStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          key={currentStep}
          entering={(navDir === 1 ? SlideInRight : SlideInLeft)
            .springify()
            .damping(22)
            .stiffness(200)}
          exiting={(navDir === 1 ? SlideOutLeft : SlideOutRight)
            .springify()
            .damping(22)
            .stiffness(200)}
        >
          {currentStep === 0 ? (
            <MoodStep value={mood} onChange={setMood} />
          ) : currentStep === 1 ? (
            <DurationStep value={duration} onChange={setDuration} />
          ) : currentStep === 2 ? (
            <SkillsStep skills={skills} onChange={setSkills} />
          ) : currentStep === 3 ? (
            <NotesStep value={reflection} onChange={setReflection} />
          ) : (
            <MediaStep
              mediaUri={mediaUri}
              mediaType={mediaType}
              onPickFromLibrary={handlePickFromLibrary}
              onTakePhoto={handleTakePhoto}
              onRecordVideo={handleRecordVideo}
              onRemoveMedia={() => { setMediaUri(undefined); setMediaType(undefined); }}
            />
          )}
        </Animated.View>

        <View style={[wizardStyles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
          {xpFlashAmount > 0 ? (
            <Animated.View style={[wizardStyles.xpFlash, xpFlashStyle]} pointerEvents="none">
              <ThemedText style={wizardStyles.xpFlashText}>+{xpFlashAmount} XP</ThemedText>
            </Animated.View>
          ) : null}
          {isLastStep ? (
            <Button onPress={handleSave} disabled={isSaving} testID="button-save-entry">
              {isSaving ? <ActivityIndicator color={Colors.dark.buttonText} /> : "Save Session"}
            </Button>
          ) : (
            <Button onPress={handleNext} testID="button-next-step">
              Continue
            </Button>
          )}
          {isLastStep ? (
            <Pressable
              onPress={isSaving ? undefined : handleSave}
              style={[wizardStyles.skipBtn, isSaving ? { opacity: 0.4 } : null]}
            >
              <ThemedText type="small" style={wizardStyles.skipLabel}>Skip media & save</ThemedText>
            </Pressable>
          ) : currentStep >= 2 ? (
            <Pressable onPress={handleNext} style={wizardStyles.skipBtn}>
              <ThemedText type="small" style={wizardStyles.skipLabel}>Skip this step</ThemedText>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const celebrationStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 100,
  },
  particleOrigin: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
  },
  card: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing["4xl"],
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.primary + "40",
    width: 280,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

const progressStyles = StyleSheet.create({
  track: {
    flexDirection: "row",
    gap: 5,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  segment: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.dark.primary,
    borderRadius: 2,
  },
});

const stepStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing["2xl"],
  },
  title: {
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    marginBottom: Spacing["2xl"],
    lineHeight: 20,
  },
  moodGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  moodCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  moodIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  durationDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing["2xl"],
    marginBottom: Spacing["2xl"],
  },
  adjustBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.dark.backgroundDefault,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.backgroundSecondary,
  },
  durationValueWrap: {
    alignItems: "center",
    minWidth: 100,
  },
  durationValue: {
    fontSize: 56,
    fontWeight: "700",
    color: Colors.dark.text,
    lineHeight: 64,
    fontFamily: "Montserrat_700Bold",
  },
  durationUnit: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
  presetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  presetChip: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundDefault,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.backgroundSecondary,
  },
  presetChipActive: {
    backgroundColor: Colors.dark.primary + "22",
    borderColor: Colors.dark.primary,
  },
  presetLabel: {
    color: Colors.dark.textSecondary,
    fontWeight: "600",
  },
  presetLabelActive: {
    color: Colors.dark.primary,
  },
  durationInput: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.dark.text,
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundSecondary,
    textAlign: "center",
  },
  notesInput: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: 16,
    color: Colors.dark.text,
    minHeight: 180,
    textAlignVertical: "top",
    lineHeight: 24,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundSecondary,
  },
  promptHint: {
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
    fontStyle: "italic",
    lineHeight: 18,
  },
  videoAttached: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.dark.primary + "44",
  },
  videoAttachedLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  videoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.primary + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  videoAttachedLabel: {
    color: Colors.dark.primary,
    fontWeight: "600",
  },
  removeBtn: {
    padding: Spacing.sm,
  },
  mediaButtons: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  mediaGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  mediaBtn: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing["2xl"],
    alignItems: "center",
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundSecondary,
  },
  mediaBtnIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaBtnLabel: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  skipHint: {
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginTop: Spacing.lg,
    fontStyle: "italic",
  },
});

const wizardStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  stepLabel: {
    color: Colors.dark.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  scrollContent: {
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.sm,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  skipLabel: {
    color: Colors.dark.textSecondary,
    textDecorationLine: "underline",
  },
  xpFlash: {
    alignSelf: "center",
    marginBottom: Spacing.sm,
  },
  xpFlashText: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
    color: Colors.dark.primary,
  },
});

const editStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
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
  videoRow: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  videoLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  videoButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  xpFlashOverlay: {
    position: "absolute",
    top: 220,
    alignSelf: "center",
    zIndex: 100,
  },
});
