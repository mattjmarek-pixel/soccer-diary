import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import TimelineStackNavigator from "@/navigation/TimelineStackNavigator";
import StatsStackNavigator from "@/navigation/StatsStackNavigator";
import AchievementsStackNavigator from "@/navigation/AchievementsStackNavigator";
import SocialStackNavigator from "@/navigation/SocialStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

export type MainTabParamList = {
  TimelineTab: undefined;
  StatsTab: undefined;
  AchievementsTab: undefined;
  SocialTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FloatingActionButton() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("NewEntry");
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const tabBarHeight = Platform.select({ ios: 80, android: 60, default: 60 });
  const bottomOffset = tabBarHeight + insets.bottom + Spacing.lg;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.fab,
        animatedStyle,
        { bottom: bottomOffset },
      ]}
      testID="button-new-entry"
    >
      <Feather name="plus" size={28} color={Colors.dark.buttonText} />
    </AnimatedPressable>
  );
}

export default function MainTabNavigator() {
  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="TimelineTab"
        screenOptions={{
          tabBarActiveTintColor: Colors.dark.primary,
          tabBarInactiveTintColor: Colors.dark.tabIconDefault,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: Platform.select({
              ios: "transparent",
              android: Colors.dark.backgroundDefault,
            }),
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={100}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            ) : null,
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="TimelineTab"
          component={TimelineStackNavigator}
          options={{
            title: "Timeline",
            tabBarIcon: ({ color, size }) => (
              <Feather name="clock" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="StatsTab"
          component={StatsStackNavigator}
          options={{
            title: "Stats",
            tabBarIcon: ({ color, size }) => (
              <Feather name="bar-chart-2" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="SocialTab"
          component={SocialStackNavigator}
          options={{
            title: "Social",
            tabBarIcon: ({ color, size }) => (
              <Feather name="globe" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="AchievementsTab"
          component={AchievementsStackNavigator}
          options={{
            title: "Badges",
            tabBarIcon: ({ color, size }) => (
              <Feather name="award" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStackNavigator}
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <FloatingActionButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: Spacing["2xl"],
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dark.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
