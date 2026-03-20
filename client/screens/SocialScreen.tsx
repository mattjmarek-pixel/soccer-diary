import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  TextInput,
  Platform,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useDiary, DiaryEntry } from "@/contexts/DiaryContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/contexts/PremiumContext";
import { ACHIEVEMENTS } from "@/constants/achievements";

const FRIENDS_STORAGE_BASE_KEY = "@soccer_diary_friends";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface LeaderboardPlayer {
  id: string;
  name: string;
  username: string;
  position: string;
  weeklyMinutes: number;
  totalMinutes: number;
  streak: number;
  totalSessions: number;
  achievementCount: number;
  topSkill: string;
  level: number;
  isPro: boolean;
  avatarColor: string;
  initials: string;
  isMe?: boolean;
}

interface Friend {
  id: string;
  name: string;
  username: string;
  position: string;
  weeklyMinutes: number;
  totalMinutes: number;
  streak: number;
  totalSessions: number;
  achievementCount: number;
  topSkill: string;
  isPro: boolean;
  avatarColor: string;
  initials: string;
}

const GLOBAL_PLAYERS: LeaderboardPlayer[] = [
  { id: "p1", name: "Mateo Rodriguez", username: "mateo_cr7", position: "Forward", weeklyMinutes: 840, totalMinutes: 18400, streak: 45, totalSessions: 312, achievementCount: 9, topSkill: "Shooting", level: 28, isPro: true, avatarColor: "#FF6B6B", initials: "MR" },
  { id: "p2", name: "Jamie Chen", username: "jchen_gk", position: "Goalkeeper", weeklyMinutes: 780, totalMinutes: 16200, streak: 38, totalSessions: 287, achievementCount: 8, topSkill: "Fitness", level: 25, isPro: true, avatarColor: "#4ECDC4", initials: "JC" },
  { id: "p3", name: "Luca Bianchi", username: "luca_mid10", position: "Midfielder", weeklyMinutes: 720, totalMinutes: 14800, streak: 22, totalSessions: 264, achievementCount: 7, topSkill: "Passing", level: 23, isPro: false, avatarColor: "#45B7D1", initials: "LB" },
  { id: "p4", name: "Sofia Andersen", username: "sofia_a11", position: "Forward", weeklyMinutes: 660, totalMinutes: 13600, streak: 31, totalSessions: 241, achievementCount: 7, topSkill: "Dribbling", level: 21, isPro: true, avatarColor: "#96CEB4", initials: "SA" },
  { id: "p5", name: "Kai Nakamura", username: "kai_mid", position: "Midfielder", weeklyMinutes: 600, totalMinutes: 12200, streak: 17, totalSessions: 218, achievementCount: 6, topSkill: "Tactics", level: 19, isPro: false, avatarColor: "#FFEAA7", initials: "KN" },
  { id: "p6", name: "Aiden Okafor", username: "aiden_def", position: "Defender", weeklyMinutes: 540, totalMinutes: 11000, streak: 14, totalSessions: 196, achievementCount: 5, topSkill: "Fitness", level: 17, isPro: true, avatarColor: "#DDA0DD", initials: "AO" },
  { id: "p7", name: "Emma Walsh", username: "emma_gk", position: "Goalkeeper", weeklyMinutes: 480, totalMinutes: 9800, streak: 9, totalSessions: 175, achievementCount: 5, topSkill: "First Touch", level: 15, isPro: false, avatarColor: "#F0E68C", initials: "EW" },
  { id: "p8", name: "Carlos Mendez", username: "c_mendez9", position: "Forward", weeklyMinutes: 420, totalMinutes: 8600, streak: 7, totalSessions: 154, achievementCount: 4, topSkill: "Shooting", level: 13, isPro: false, avatarColor: "#98FB98", initials: "CM" },
  { id: "p9", name: "Zara Ahmed", username: "zara_mid", position: "Midfielder", weeklyMinutes: 360, totalMinutes: 7200, streak: 5, totalSessions: 132, achievementCount: 3, topSkill: "Passing", level: 11, isPro: true, avatarColor: "#FFB347", initials: "ZA" },
  { id: "p10", name: "Tyler Brooks", username: "tbrooks_def", position: "Defender", weeklyMinutes: 300, totalMinutes: 6000, streak: 3, totalSessions: 110, achievementCount: 2, topSkill: "Tactics", level: 9, isPro: false, avatarColor: "#87CEEB", initials: "TB" },
];

const SEARCH_POOL: Friend[] = [
  { id: "s1", name: "Alex Torres", username: "alex_t22", position: "Midfielder", weeklyMinutes: 420, totalMinutes: 7800, streak: 8, totalSessions: 143, achievementCount: 4, topSkill: "Dribbling", isPro: false, avatarColor: "#FF8C69", initials: "AT" },
  { id: "s2", name: "Riley Park", username: "riley_fwd", position: "Forward", weeklyMinutes: 360, totalMinutes: 6500, streak: 5, totalSessions: 118, achievementCount: 3, topSkill: "Shooting", isPro: true, avatarColor: "#7B68EE", initials: "RP" },
  { id: "s3", name: "Sam Dubois", username: "sam_d7", position: "Midfielder", weeklyMinutes: 480, totalMinutes: 8900, streak: 12, totalSessions: 161, achievementCount: 5, topSkill: "Passing", isPro: false, avatarColor: "#20B2AA", initials: "SD" },
  { id: "s4", name: "Jordan Lee", username: "jordan_gk1", position: "Goalkeeper", weeklyMinutes: 300, totalMinutes: 5400, streak: 4, totalSessions: 97, achievementCount: 2, topSkill: "First Touch", isPro: false, avatarColor: "#DA70D6", initials: "JL" },
  { id: "s5", name: "Marcus Webb", username: "m_webb", position: "Defender", weeklyMinutes: 540, totalMinutes: 9600, streak: 16, totalSessions: 177, achievementCount: 6, topSkill: "Fitness", isPro: true, avatarColor: "#3CB371", initials: "MW" },
  { id: "s6", name: "Priya Sharma", username: "priya_s", position: "Forward", weeklyMinutes: 390, totalMinutes: 7100, streak: 6, totalSessions: 129, achievementCount: 3, topSkill: "Dribbling", isPro: false, avatarColor: "#CD853F", initials: "PS" },
];

const WEEKLY_CHALLENGE = {
  title: "Training Blitz",
  description: "Log at least 5 training sessions this week",
  target: 5,
  participants: 2847,
  daysLeft: 4,
  reward: "Blitz Badge",
  icon: "zap" as FeatherIconName,
};

function getWeekSessionCount(entries: DiaryEntry[]): number {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return entries.filter((e) => new Date(e.date) >= weekStart).length;
}

function getWeeklyMinutes(entries: DiaryEntry[]): number {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return entries
    .filter((e) => new Date(e.date) >= weekStart)
    .reduce((sum, e) => sum + e.duration, 0);
}

function getUserLevel(totalSessions: number): number {
  return Math.max(1, Math.floor(totalSessions / 10) + 1);
}

function getTopSkill(entries: DiaryEntry[]): string {
  if (entries.length === 0) return "Dribbling";
  const counts: Record<string, number> = {};
  entries.forEach((e) => {
    e.skills.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "Dribbling";
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function AvatarBubble({ initials, color, size = 40, isPro }: { initials: string; color: string; size?: number; isPro?: boolean }) {
  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + "33", borderColor: color }]}>
        <ThemedText style={{ fontSize: size * 0.35, fontWeight: "700", color }}>{initials}</ThemedText>
      </View>
      {isPro ? (
        <View style={[styles.proBadgeDot, { bottom: -2, right: -2 }]}>
          <ThemedText style={{ fontSize: 6, color: "#121212", fontWeight: "800" }}>PRO</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const color = rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : rank === 3 ? "#CD7F32" : Colors.dark.textSecondary;
  const bg = rank <= 3 ? color + "22" : "transparent";
  const borderColor = rank <= 3 ? color : "transparent";
  return (
    <View style={[styles.rankBadge, { backgroundColor: bg, borderColor }]}>
      <ThemedText style={{ fontSize: 12, fontWeight: "700", color, minWidth: 20, textAlign: "center" }}>
        {rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `#${rank}`}
      </ThemedText>
    </View>
  );
}

function PlayerRow({
  player,
  rank,
  onPress,
}: {
  player: LeaderboardPlayer;
  rank: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View entering={FadeInDown.delay(rank * 40).springify()} style={animStyle}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          scale.value = withSpring(0.97, { damping: 15 }, () => { scale.value = withSpring(1); });
          onPress();
        }}
        style={[styles.playerRow, player.isMe && styles.playerRowMe]}
      >
        <RankBadge rank={rank} />
        <View style={{ marginLeft: Spacing.md }}>
          <AvatarBubble initials={player.initials} color={player.avatarColor} size={44} isPro={player.isPro} />
        </View>
        <View style={styles.playerInfo}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <ThemedText style={[styles.playerName, player.isMe && { color: Colors.dark.primary }]} numberOfLines={1}>
              {player.name}
            </ThemedText>
            {player.isMe ? (
              <View style={styles.meTag}>
                <ThemedText style={{ fontSize: 9, color: Colors.dark.buttonText, fontWeight: "800" }}>YOU</ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText style={styles.playerMeta}>{player.position} · {player.topSkill}</ThemedText>
        </View>
        <View style={styles.playerStats}>
          <ThemedText style={styles.statValue}>
            {player.weeklyMinutes}<ThemedText style={styles.statUnit}>m</ThemedText>
          </ThemedText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Feather name="zap" size={10} color={Colors.dark.accent} />
            <ThemedText style={styles.statStreak}>{player.streak}d</ThemedText>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function PlayerProfileModal({ player, onClose }: { player: LeaderboardPlayer | null; onClose: () => void }) {
  if (!player) return null;
  const statItems: { label: string; value: string | number; icon: FeatherIconName }[] = [
    { label: "Sessions", value: player.totalSessions, icon: "edit-3" },
    { label: "Total Mins", value: player.totalMinutes, icon: "clock" },
    { label: "Streak", value: `${player.streak}d`, icon: "zap" },
    { label: "Top Skill", value: player.topSkill, icon: "target" },
    { label: "Badges", value: player.achievementCount, icon: "award" },
    { label: "Level", value: player.level, icon: "trending-up" },
  ];
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.profileSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <View style={{ alignItems: "center", marginBottom: Spacing["2xl"] }}>
            <AvatarBubble initials={player.initials} color={player.avatarColor} size={72} isPro={player.isPro} />
            <ThemedText style={styles.profileName}>{player.name}</ThemedText>
            <ThemedText style={styles.profileUsername}>@{player.username}</ThemedText>
            <View style={styles.positionTag}>
              <ThemedText style={{ fontSize: 12, color: Colors.dark.primary, fontWeight: "600" }}>{player.position}</ThemedText>
            </View>
          </View>
          <View style={styles.statsGrid}>
            {statItems.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Feather name={stat.icon} size={16} color={Colors.dark.primary} />
                <ThemedText style={styles.statCardValue}>{stat.value}</ThemedText>
                <ThemedText style={styles.statCardLabel}>{stat.label}</ThemedText>
              </View>
            ))}
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <ThemedText style={{ color: Colors.dark.buttonText, fontWeight: "700", fontSize: 15 }}>Close</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AddFriendModal({ visible, friends, onClose, onAddFriend }: {
  visible: boolean;
  friends: Friend[];
  onClose: () => void;
  onAddFriend: (f: Friend) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!visible) setQuery("");
  }, [visible]);
  const friendIds = new Set(friends.map((f) => f.id));
  const results = SEARCH_POOL.filter(
    (p) =>
      !friendIds.has(p.id) &&
      (query.length === 0 ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.username.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.profileSheet, { maxHeight: "80%" }]}>
          <View style={styles.sheetHandle} />
          <ThemedText style={[styles.profileName, { marginBottom: Spacing.lg }]}>Find Players</ThemedText>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color={Colors.dark.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or username..."
              placeholderTextColor={Colors.dark.textSecondary}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery("")}>
                <Feather name="x" size={16} color={Colors.dark.textSecondary} />
              </Pressable>
            ) : null}
          </View>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            style={{ marginTop: Spacing.md }}
            renderItem={({ item }) => (
              <View style={styles.searchResultRow}>
                <AvatarBubble initials={item.initials} color={item.avatarColor} size={40} isPro={item.isPro} />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <ThemedText style={{ fontWeight: "700", color: Colors.dark.text }}>{item.name}</ThemedText>
                  <ThemedText style={{ fontSize: 12, color: Colors.dark.textSecondary }}>@{item.username} · {item.position}</ThemedText>
                </View>
                <Pressable
                  style={styles.addBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onAddFriend(item);
                  }}
                >
                  <Feather name="user-plus" size={14} color={Colors.dark.buttonText} />
                </Pressable>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: Spacing["3xl"] }}>
                <Feather name="users" size={32} color={Colors.dark.textSecondary} />
                <ThemedText style={{ color: Colors.dark.textSecondary, marginTop: Spacing.md }}>No players found</ThemedText>
              </View>
            }
          />
          <Pressable style={[styles.closeBtn, { marginTop: Spacing.md }]} onPress={onClose}>
            <ThemedText style={{ color: Colors.dark.buttonText, fontWeight: "700", fontSize: 15 }}>Done</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function SocialScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { entries, stats } = useDiary();
  const { user } = useAuth();
  const { isPremium } = usePremium();

  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardPlayer | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);

  const friendsKey = user ? `${FRIENDS_STORAGE_BASE_KEY}_${user.id}` : null;

  useEffect(() => {
    if (!friendsKey) return;
    AsyncStorage.getItem(friendsKey).then((data) => {
      if (!data) return;
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) setFriends(parsed as Friend[]);
      } catch {
        AsyncStorage.removeItem(friendsKey);
      }
    });
  }, [friendsKey]);

  const saveFriends = useCallback(async (list: Friend[]) => {
    if (!friendsKey) return;
    try {
      await AsyncStorage.setItem(friendsKey, JSON.stringify(list));
    } catch {
      // Storage write failed silently
    }
    setFriends(list);
  }, [friendsKey]);

  const handleAddFriend = useCallback(
    (friend: Friend) => {
      saveFriends([...friends, friend]);
    },
    [friends, saveFriends]
  );

  const weeklyMins = getWeeklyMinutes(entries);
  const weekSessions = getWeekSessionCount(entries);
  const challengeProgress = Math.min(weekSessions / WEEKLY_CHALLENGE.target, 1);
  const topSkill = getTopSkill(entries);
  const userLevel = getUserLevel(stats.totalEntries);
  const userAchievementCount = ACHIEVEMENTS.filter((a) => a.isEarned(entries, stats)).length;

  const myPlayer: LeaderboardPlayer = {
    id: "me",
    name: user?.name ?? "You",
    username: user?.email?.split("@")[0] ?? "you",
    position: user?.position ?? "Midfielder",
    weeklyMinutes: weeklyMins,
    totalMinutes: stats.totalMinutes,
    streak: stats.currentStreak,
    totalSessions: stats.totalEntries,
    achievementCount: userAchievementCount,
    topSkill,
    level: userLevel,
    isPro: isPremium,
    avatarColor: Colors.dark.primary,
    initials: getInitials(user?.name ?? "Me"),
    isMe: true,
  };

  const globalWithMe = [...GLOBAL_PLAYERS];
  const insertRank = globalWithMe.findIndex((p) => p.weeklyMinutes < weeklyMins);
  const myRankGlobal = insertRank === -1 ? globalWithMe.length + 1 : insertRank + 1;
  if (insertRank !== -1) {
    globalWithMe.splice(insertRank, 0, myPlayer);
  } else {
    globalWithMe.push(myPlayer);
  }

  const friendsAsLeaderboard: LeaderboardPlayer[] = friends.map((f) => ({
    ...f,
    level: getUserLevel(f.totalSessions),
    isMe: false,
  }));

  const friendsWithMe = [myPlayer, ...friendsAsLeaderboard]
    .sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);

  return (
    <View style={[styles.container, { paddingTop: headerHeight }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly Challenge Card */}
        <Animated.View entering={FadeIn.delay(50)} style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <View style={styles.challengeIconWrap}>
              <Feather name={WEEKLY_CHALLENGE.icon} size={20} color={Colors.dark.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <ThemedText style={styles.challengeTitle}>{WEEKLY_CHALLENGE.title}</ThemedText>
              <ThemedText style={styles.challengeDesc}>{WEEKLY_CHALLENGE.description}</ThemedText>
            </View>
            <View style={styles.daysLeft}>
              <ThemedText style={{ fontSize: 12, color: Colors.dark.accent, fontWeight: "700" }}>{WEEKLY_CHALLENGE.daysLeft}d</ThemedText>
              <ThemedText style={{ fontSize: 9, color: Colors.dark.textSecondary }}>left</ThemedText>
            </View>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${challengeProgress * 100}%` }]} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: Spacing.sm }}>
            <ThemedText style={styles.progressLabel}>
              {weekSessions}/{WEEKLY_CHALLENGE.target} sessions this week
            </ThemedText>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="users" size={11} color={Colors.dark.textSecondary} />
              <ThemedText style={styles.progressLabel}>{WEEKLY_CHALLENGE.participants.toLocaleString()} playing</ThemedText>
            </View>
          </View>
          {challengeProgress >= 1 ? (
            <View style={styles.challengeComplete}>
              <Feather name="check-circle" size={14} color={Colors.dark.primary} />
              <ThemedText style={{ color: Colors.dark.primary, fontWeight: "700", fontSize: 12, marginLeft: 6 }}>
                Challenge Complete! {WEEKLY_CHALLENGE.reward} earned
              </ThemedText>
            </View>
          ) : null}
        </Animated.View>

        {/* Tab Switcher */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.tabRow}>
          <Pressable
            style={[styles.tabBtn, activeTab === "global" && styles.tabBtnActive]}
            onPress={() => setActiveTab("global")}
          >
            <Feather name="globe" size={14} color={activeTab === "global" ? Colors.dark.primary : Colors.dark.textSecondary} />
            <ThemedText style={[styles.tabLabel, activeTab === "global" && styles.tabLabelActive]}>Global</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === "friends" && styles.tabBtnActive]}
            onPress={() => setActiveTab("friends")}
          >
            <Feather name="users" size={14} color={activeTab === "friends" ? Colors.dark.primary : Colors.dark.textSecondary} />
            <ThemedText style={[styles.tabLabel, activeTab === "friends" && styles.tabLabelActive]}>
              {`Friends${friends.length > 0 ? ` (${friends.length})` : ""}`}
            </ThemedText>
          </Pressable>
          {activeTab === "friends" ? (
            <Pressable style={styles.addFriendBtn} onPress={() => setShowAddFriend(true)}>
              <Feather name="user-plus" size={14} color={Colors.dark.primary} />
            </Pressable>
          ) : null}
        </Animated.View>

        {/* My Rank Summary (Global only) */}
        {activeTab === "global" ? (
          <Animated.View entering={FadeIn.delay(150)} style={styles.myRankCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
              <Feather name="award" size={18} color={Colors.dark.accent} />
              <View>
                <ThemedText style={{ color: Colors.dark.textSecondary, fontSize: 12 }}>Your Global Rank</ThemedText>
                <ThemedText style={{ color: Colors.dark.text, fontWeight: "800", fontSize: 18 }}>
                  #{myRankGlobal}{" "}
                  <ThemedText style={{ fontSize: 13, fontWeight: "400", color: Colors.dark.textSecondary }}>
                    of {globalWithMe.length.toLocaleString()}+
                  </ThemedText>
                </ThemedText>
              </View>
              <View style={{ flex: 1 }} />
              <View style={{ alignItems: "flex-end" }}>
                <ThemedText style={{ color: Colors.dark.textSecondary, fontSize: 11 }}>This week</ThemedText>
                <ThemedText style={{ color: Colors.dark.primary, fontWeight: "700", fontSize: 16 }}>{weeklyMins}m</ThemedText>
              </View>
            </View>
          </Animated.View>
        ) : null}

        {/* Leaderboard List */}
        <View style={styles.leaderboard}>
          {activeTab === "global" ? (
            globalWithMe.slice(0, 15).map((player, idx) => (
              <PlayerRow
                key={player.id}
                player={player}
                rank={idx + 1}
                onPress={() => setSelectedPlayer(player)}
              />
            ))
          ) : friends.length === 0 ? (
            <Animated.View entering={FadeIn} style={styles.emptyFriends}>
              <Feather name="users" size={40} color={Colors.dark.textSecondary} />
              <ThemedText style={styles.emptyTitle}>No friends yet</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Search for players and add them to see how you compare!
              </ThemedText>
              <Pressable style={styles.addFriendCta} onPress={() => setShowAddFriend(true)}>
                <Feather name="user-plus" size={16} color={Colors.dark.buttonText} />
                <ThemedText style={{ color: Colors.dark.buttonText, fontWeight: "700", marginLeft: 8 }}>Find Players</ThemedText>
              </Pressable>
            </Animated.View>
          ) : (
            friendsWithMe.map((player, idx) => (
              <PlayerRow
                key={player.id}
                player={player}
                rank={idx + 1}
                onPress={() => setSelectedPlayer(player)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {selectedPlayer !== null ? (
        <PlayerProfileModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      ) : null}
      <AddFriendModal
        visible={showAddFriend}
        friends={friends}
        onClose={() => setShowAddFriend(false)}
        onAddFriend={handleAddFriend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  challengeCard: {
    margin: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.accent + "33",
  },
  challengeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  challengeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.accent + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  challengeDesc: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  daysLeft: {
    alignItems: "center",
    backgroundColor: Colors.dark.accent + "22",
    borderRadius: BorderRadius.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.dark.accent,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  challengeComplete: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    backgroundColor: Colors.dark.primary + "15",
    borderRadius: BorderRadius.xs,
    padding: Spacing.sm,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  tabBtnActive: {
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
  },
  tabLabelActive: {
    color: Colors.dark.primary,
  },
  addFriendBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  myRankCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "33",
  },
  leaderboard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.backgroundSecondary,
  },
  playerRowMe: {
    backgroundColor: Colors.dark.primary + "0D",
  },
  rankBadge: {
    minWidth: 36,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  proBadgeDot: {
    position: "absolute",
    backgroundColor: Colors.dark.accent,
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundDefault,
  },
  playerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
  },
  playerName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  playerMeta: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 1,
  },
  meTag: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  playerStats: {
    alignItems: "flex-end",
    gap: 3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  statUnit: {
    fontSize: 10,
    fontWeight: "400",
    color: Colors.dark.textSecondary,
  },
  statStreak: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  emptyFriends: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
    paddingHorizontal: Spacing["2xl"],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  addFriendCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  profileSheet: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    padding: Spacing["2xl"],
    paddingBottom: Platform.OS === "ios" ? 40 : Spacing["2xl"],
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.xl,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.dark.text,
    marginTop: Spacing.md,
  },
  profileUsername: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  positionTag: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.dark.primary + "22",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: "47%",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    alignItems: "center",
    gap: 4,
  },
  statCardValue: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  statCardLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  closeBtn: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 14,
    paddingVertical: 4,
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.backgroundSecondary,
  },
  addBtn: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.xs,
    padding: Spacing.sm,
  },
});
