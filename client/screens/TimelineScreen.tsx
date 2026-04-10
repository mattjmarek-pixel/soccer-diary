import React, { useCallback, useMemo } from "react";
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
import Animated, { FadeIn } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { DiaryEntryCard } from "@/components/DiaryEntryCard";
import { EmptyState } from "@/components/EmptyState";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useDiary, DiaryEntry, DiaryStats } from "@/contexts/DiaryContext";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const formatMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

function WeeklyBanner({ entries, stats }: { entries: DiaryEntry[]; stats: DiaryStats }) {
  const weeklyData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekEntries = entries.filter((e) => {
      const d = new Date(e.date);
      return d >= startOfWeek;
    });

    const weeklyMinutes = thisWeekEntries.reduce((sum, e) => sum + e.duration, 0);
    return { sessions: thisWeekEntries.length, minutes: weeklyMinutes };
  }, [entries]);

  return (
    <Animated.View entering={FadeIn.delay(100)} style={styles.bannerCard}>
      <View style={styles.bannerRow}>
        <View style={styles.bannerItem}>
          <View style={[styles.bannerIconWrap, { backgroundColor: Colors.dark.primary + "20" }]}>
            <Feather name="zap" size={16} color={Colors.dark.primary} />
          </View>
          <ThemedText style={[styles.bannerValue, { color: Colors.dark.primary }]}>
            {stats.currentStreak}
          </ThemedText>
          <ThemedText style={styles.bannerLabel}>Day Streak</ThemedText>
        </View>

        <View style={styles.bannerDivider} />

        <View style={styles.bannerItem}>
          <View style={[styles.bannerIconWrap, { backgroundColor: Colors.dark.accent + "20" }]}>
            <Feather name="calendar" size={16} color={Colors.dark.accent} />
          </View>
          <ThemedText style={[styles.bannerValue, { color: Colors.dark.accent }]}>
            {weeklyData.sessions}
          </ThemedText>
          <ThemedText style={styles.bannerLabel}>This Week</ThemedText>
        </View>

        <View style={styles.bannerDivider} />

        <View style={styles.bannerItem}>
          <View style={[styles.bannerIconWrap, { backgroundColor: "#FF6B6B20" }]}>
            <Feather name="clock" size={16} color="#FF6B6B" />
          </View>
          <ThemedText style={[styles.bannerValue, { color: "#FF6B6B" }]}>
            {formatMinutes(weeklyData.minutes)}
          </ThemedText>
          <ThemedText style={styles.bannerLabel}>Weekly Time</ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { entries, isLoading, refreshEntries, stats } = useDiary();
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

  const renderHeader = useCallback(
    () => (
      <WeeklyBanner entries={entries} stats={stats} />
    ),
    [entries, stats]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: typeof entries[0]; index: number }) => (
      <Animated.View entering={FadeIn.delay(index * 60).duration(400)}>
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
    [entries]
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
      ListHeaderComponent={entries.length > 0 ? renderHeader : null}
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
  bannerCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "22",
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  bannerItem: {
    alignItems: "center",
    flex: 1,
  },
  bannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  bannerValue: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Montserrat_700Bold",
  },
  bannerLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  bannerDivider: {
    width: 1,
    height: 48,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
});
