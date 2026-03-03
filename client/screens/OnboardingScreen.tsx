import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  image: any;
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    title: "Track Every Session",
    subtitle: "Log your training, skills worked on, and how you felt after each practice.",
    image: require("../../assets/images/onboarding-track.png"),
  },
  {
    id: "2",
    title: "Watch Your Progress",
    subtitle: "See your improvement over time with visual timelines and skill tracking.",
    image: require("../../assets/images/onboarding-progress.png"),
  },
  {
    id: "3",
    title: "Build Your Legacy",
    subtitle: "Every entry is a step toward greatness. Start building your soccer journey today.",
    image: require("../../assets/images/onboarding-legacy.png"),
  },
];

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    await completeOnboarding();
    navigation.replace("Auth");
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.imageContainer}>
        <View style={styles.imageWrapper}>
          <Image source={item.image} style={styles.image} resizeMode="cover" />
        </View>
      </View>
      <View style={styles.textContainer}>
        <ThemedText type="display" style={styles.title}>
          {item.title}
        </ThemedText>
        <ThemedText type="body" style={styles.subtitle}>
          {item.subtitle}
        </ThemedText>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor:
                index === currentIndex
                  ? Colors.dark.primary
                  : Colors.dark.textSecondary,
              width: index === currentIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        keyExtractor={(item) => item.id}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {renderDots()}
        <Button onPress={handleNext} style={styles.button}>
          {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
        </Button>
        {currentIndex < slides.length - 1 ? (
          <Button variant="outline" onPress={handleGetStarted} style={styles.skipButton}>
            Skip
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  imageWrapper: {
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.dark.backgroundRoot,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    alignItems: "center",
    paddingBottom: Spacing["4xl"],
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.md,
    color: Colors.dark.text,
  },
  subtitle: {
    textAlign: "center",
    color: Colors.dark.textSecondary,
    paddingHorizontal: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing["2xl"],
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    width: "100%",
  },
  skipButton: {
    width: "100%",
    marginTop: Spacing.md,
  },
});
