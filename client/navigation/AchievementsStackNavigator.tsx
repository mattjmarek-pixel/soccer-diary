import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AchievementsScreen from "@/screens/AchievementsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type AchievementsStackParamList = {
  Achievements: undefined;
};

const Stack = createNativeStackNavigator<AchievementsStackParamList>();

export default function AchievementsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{
          title: "Badges",
        }}
      />
    </Stack.Navigator>
  );
}
