import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { DiaryEntryCard } from "@/components/DiaryEntryCard";
import { EmptyState } from "@/components/EmptyState";
import { Colors, Spacing } from "@/constants/theme";
import { useDiary } from "@/contexts/DiaryContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { entries, isLoading, refreshEntries } = useDiary();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshEntries();
    setIsRefreshing(false);
  }, [refreshEntries]);

  const handleEntryPress = (entryId: string) => {
    navigation.navigate("DiaryDetail", { entryId });
  };

  const handleNewEntry = () => {
    navigation.navigate("NewEntry");
  };

  const renderItem = useCallback(
    ({ item, index }: { item: typeof entries[0]; index: number }) => (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <DiaryEntryCard
          date={item.date}
          mood={item.mood}
          duration={item.duration}
          reflection={item.reflection}
          skills={item.skills}
          videoUri={item.videoUri}
          onPress={() => handleEntryPress(item.id)}
        />
      </Animated.View>
    ),
    []
  );

  const renderEmpty = useCallback(
    () => (
      <EmptyState
        image={require("../../assets/images/empty-timeline.png")}
        title="Start your journey"
        subtitle="Log your first training session and begin tracking your progress"
        actionLabel="Add First Entry"
        onAction={handleNewEntry}
      />
    ),
    []
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing["4xl"] + 60,
        },
        entries.length === 0 && styles.emptyContent,
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      data={entries}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.dark.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    />
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
  emptyContent: {
    flexGrow: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
});
