import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { HeaderButton } from "@react-navigation/elements";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import OnboardingScreen from "@/screens/OnboardingScreen";
import AuthScreen from "@/screens/AuthScreen";
import NewEntryScreen from "@/screens/NewEntryScreen";
import DiaryDetailScreen from "@/screens/DiaryDetailScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import InsightsScreen from "@/screens/InsightsScreen";
import TemplatesScreen from "@/screens/TemplatesScreen";
import UpgradeScreen from "@/screens/UpgradeScreen";
import PlayerCardScreen from "@/screens/PlayerCardScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/theme";
import { DiaryEntry } from "@/contexts/DiaryContext";

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  NewEntry: { entry?: DiaryEntry } | undefined;
  DiaryDetail: { entryId: string };
  EditProfile: undefined;
  Insights: undefined;
  Templates: undefined;
  Upgrade: undefined;
  PlayerCardModal: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { user, isLoading, isOnboarded } = useAuth();

  if (isLoading) {
    return null;
  }

  const getInitialRoute = (): keyof RootStackParamList => {
    if (!isOnboarded) return "Onboarding";
    if (!user) return "Auth";
    return "Main";
  };

  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      initialRouteName={getInitialRoute()}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NewEntry"
        component={NewEntryScreen}
        options={({ navigation, route }) => ({
          presentation: "modal",
          headerShown: !!route.params?.entry,
          headerTitle: "Edit Entry",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={24} color={Colors.dark.text} />
            </HeaderButton>
          ),
        })}
      />
      <Stack.Screen
        name="DiaryDetail"
        component={DiaryDetailScreen}
        options={{
          headerTitle: "",
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerTitle: "Edit Profile",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={24} color={Colors.dark.text} />
            </HeaderButton>
          ),
        })}
      />
      <Stack.Screen
        name="Insights"
        component={InsightsScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerTitle: "AI Insights",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={24} color={Colors.dark.text} />
            </HeaderButton>
          ),
        })}
      />
      <Stack.Screen
        name="Templates"
        component={TemplatesScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerTitle: "Templates",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={24} color={Colors.dark.text} />
            </HeaderButton>
          ),
        })}
      />
      <Stack.Screen
        name="Upgrade"
        component={UpgradeScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerTitle: "Go Pro",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={24} color={Colors.dark.text} />
            </HeaderButton>
          ),
        })}
      />
      <Stack.Screen
        name="PlayerCardModal"
        component={PlayerCardScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerTitle: "My Player Card",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={24} color={Colors.dark.text} />
            </HeaderButton>
          ),
        })}
      />
    </Stack.Navigator>
  );
}
