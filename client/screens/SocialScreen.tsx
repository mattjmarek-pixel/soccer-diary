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
  Share,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Contacts from "expo-contacts";
import * as SMS from "expo-sms";
import * as MailComposer from "expo-mail-composer";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
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
const COUNTRY_STORAGE_KEY = "@soccer_diary_country";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];
type AgeBracket = "All" | "U14" | "U16" | "U18" | "U21" | "Senior";
type ActiveTab = "global" | "national" | "friends";

const AGE_BRACKETS: AgeBracket[] = ["All", "U14", "U16", "U18", "U21", "Senior"];

const COUNTRIES = [
  { code: "USA", label: "United States", flag: "🇺🇸" },
  { code: "ENG", label: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "BRA", label: "Brazil", flag: "🇧🇷" },
  { code: "ESP", label: "Spain", flag: "🇪🇸" },
  { code: "GER", label: "Germany", flag: "🇩🇪" },
  { code: "FRA", label: "France", flag: "🇫🇷" },
  { code: "ARG", label: "Argentina", flag: "🇦🇷" },
  { code: "MEX", label: "Mexico", flag: "🇲🇽" },
  { code: "JPN", label: "Japan", flag: "🇯🇵" },
  { code: "NED", label: "Netherlands", flag: "🇳🇱" },
];

function getAgeBracket(age: number): AgeBracket {
  if (age <= 14) return "U14";
  if (age <= 16) return "U16";
  if (age <= 18) return "U18";
  if (age <= 21) return "U21";
  return "Senior";
}

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
  age: number;
  country: string;
  ageBracket: AgeBracket;
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
  age: number;
  country: string;
  ageBracket: AgeBracket;
}

const GLOBAL_PLAYERS: LeaderboardPlayer[] = [
  { id: "p1", name: "Mateo Rodriguez", username: "mateo_cr7", position: "Forward", weeklyMinutes: 840, totalMinutes: 18400, streak: 45, totalSessions: 312, achievementCount: 9, topSkill: "Shooting", level: 28, isPro: true, avatarColor: "#FF6B6B", initials: "MR", age: 17, country: "ESP", ageBracket: "U18" },
  { id: "p2", name: "Jamie Chen", username: "jchen_gk", position: "Goalkeeper", weeklyMinutes: 780, totalMinutes: 16200, streak: 38, totalSessions: 287, achievementCount: 8, topSkill: "Fitness", level: 25, isPro: true, avatarColor: "#4ECDC4", initials: "JC", age: 19, country: "USA", ageBracket: "U21" },
  { id: "p3", name: "Luca Bianchi", username: "luca_mid10", position: "Midfielder", weeklyMinutes: 720, totalMinutes: 14800, streak: 22, totalSessions: 264, achievementCount: 7, topSkill: "Passing", level: 23, isPro: false, avatarColor: "#45B7D1", initials: "LB", age: 16, country: "GER", ageBracket: "U16" },
  { id: "p4", name: "Sofia Andersen", username: "sofia_a11", position: "Forward", weeklyMinutes: 660, totalMinutes: 13600, streak: 31, totalSessions: 241, achievementCount: 7, topSkill: "Dribbling", level: 21, isPro: true, avatarColor: "#96CEB4", initials: "SA", age: 15, country: "USA", ageBracket: "U16" },
  { id: "p5", name: "Kai Nakamura", username: "kai_mid", position: "Midfielder", weeklyMinutes: 600, totalMinutes: 12200, streak: 17, totalSessions: 218, achievementCount: 6, topSkill: "Tactics", level: 19, isPro: false, avatarColor: "#FFEAA7", initials: "KN", age: 18, country: "JPN", ageBracket: "U18" },
  { id: "p6", name: "Aiden Okafor", username: "aiden_def", position: "Defender", weeklyMinutes: 540, totalMinutes: 11000, streak: 14, totalSessions: 196, achievementCount: 5, topSkill: "Fitness", level: 17, isPro: true, avatarColor: "#DDA0DD", initials: "AO", age: 14, country: "ENG", ageBracket: "U14" },
  { id: "p7", name: "Emma Walsh", username: "emma_gk", position: "Goalkeeper", weeklyMinutes: 480, totalMinutes: 9800, streak: 9, totalSessions: 175, achievementCount: 5, topSkill: "First Touch", level: 15, isPro: false, avatarColor: "#F0E68C", initials: "EW", age: 16, country: "USA", ageBracket: "U16" },
  { id: "p8", name: "Carlos Mendez", username: "c_mendez9", position: "Forward", weeklyMinutes: 420, totalMinutes: 8600, streak: 7, totalSessions: 154, achievementCount: 4, topSkill: "Shooting", level: 13, isPro: false, avatarColor: "#98FB98", initials: "CM", age: 21, country: "MEX", ageBracket: "U21" },
  { id: "p9", name: "Zara Ahmed", username: "zara_mid", position: "Midfielder", weeklyMinutes: 360, totalMinutes: 7200, streak: 5, totalSessions: 132, achievementCount: 3, topSkill: "Passing", level: 11, isPro: true, avatarColor: "#FFB347", initials: "ZA", age: 13, country: "ENG", ageBracket: "U14" },
  { id: "p10", name: "Tyler Brooks", username: "tbrooks_def", position: "Defender", weeklyMinutes: 300, totalMinutes: 6000, streak: 3, totalSessions: 110, achievementCount: 2, topSkill: "Tactics", level: 9, isPro: false, avatarColor: "#87CEEB", initials: "TB", age: 15, country: "USA", ageBracket: "U16" },
  { id: "p11", name: "Isabella Rossi", username: "isa_fwd", position: "Forward", weeklyMinutes: 510, totalMinutes: 10200, streak: 11, totalSessions: 183, achievementCount: 5, topSkill: "Dribbling", level: 16, isPro: true, avatarColor: "#FF9AA2", initials: "IR", age: 17, country: "USA", ageBracket: "U18" },
  { id: "p12", name: "Marcus Webb", username: "m_webb", position: "Defender", weeklyMinutes: 450, totalMinutes: 9100, streak: 8, totalSessions: 162, achievementCount: 4, topSkill: "Fitness", level: 14, isPro: false, avatarColor: "#3CB371", initials: "MW", age: 20, country: "USA", ageBracket: "U21" },
  { id: "p13", name: "Lucas Petit", username: "lucas_p7", position: "Midfielder", weeklyMinutes: 390, totalMinutes: 7800, streak: 6, totalSessions: 140, achievementCount: 3, topSkill: "Passing", level: 12, isPro: false, avatarColor: "#6495ED", initials: "LP", age: 16, country: "FRA", ageBracket: "U16" },
  { id: "p14", name: "Amara Diallo", username: "amara_d", position: "Forward", weeklyMinutes: 330, totalMinutes: 5600, streak: 4, totalSessions: 99, achievementCount: 2, topSkill: "Shooting", level: 8, isPro: false, avatarColor: "#C71585", initials: "AD", age: 14, country: "FRA", ageBracket: "U14" },
  { id: "p15", name: "Diego Silva", username: "diego_s10", position: "Midfielder", weeklyMinutes: 270, totalMinutes: 4800, streak: 2, totalSessions: 87, achievementCount: 1, topSkill: "Tactics", level: 7, isPro: false, avatarColor: "#FFD700", initials: "DS", age: 18, country: "BRA", ageBracket: "U18" },
  { id: "p16", name: "Olivia Hart", username: "olivia_h", position: "Defender", weeklyMinutes: 390, totalMinutes: 7400, streak: 9, totalSessions: 134, achievementCount: 3, topSkill: "First Touch", level: 11, isPro: false, avatarColor: "#FF7043", initials: "OH", age: 15, country: "USA", ageBracket: "U16" },
  { id: "p17", name: "Noah Kim", username: "noah_k_gk", position: "Goalkeeper", weeklyMinutes: 310, totalMinutes: 5200, streak: 3, totalSessions: 94, achievementCount: 2, topSkill: "Fitness", level: 8, isPro: false, avatarColor: "#AB47BC", initials: "NK", age: 13, country: "USA", ageBracket: "U14" },
  { id: "p18", name: "Fatima Hassan", username: "fatima_h", position: "Midfielder", weeklyMinutes: 470, totalMinutes: 8900, streak: 12, totalSessions: 161, achievementCount: 4, topSkill: "Passing", level: 14, isPro: true, avatarColor: "#00BCD4", initials: "FH", age: 19, country: "ENG", ageBracket: "U21" },
  { id: "p19", name: "Ryan Torres", username: "rtorres22", position: "Forward", weeklyMinutes: 350, totalMinutes: 6200, streak: 5, totalSessions: 113, achievementCount: 2, topSkill: "Shooting", level: 10, isPro: false, avatarColor: "#8BC34A", initials: "RT", age: 17, country: "USA", ageBracket: "U18" },
  { id: "p20", name: "Chloe Martin", username: "chloe_m", position: "Defender", weeklyMinutes: 240, totalMinutes: 4200, streak: 1, totalSessions: 76, achievementCount: 1, topSkill: "Tactics", level: 6, isPro: false, avatarColor: "#E91E63", initials: "CM", age: 22, country: "FRA", ageBracket: "Senior" },
];

const SEARCH_POOL: Friend[] = [
  { id: "s1", name: "Alex Torres", username: "alex_t22", position: "Midfielder", weeklyMinutes: 420, totalMinutes: 7800, streak: 8, totalSessions: 143, achievementCount: 4, topSkill: "Dribbling", isPro: false, avatarColor: "#FF8C69", initials: "AT", age: 16, country: "USA", ageBracket: "U16" },
  { id: "s2", name: "Riley Park", username: "riley_fwd", position: "Forward", weeklyMinutes: 360, totalMinutes: 6500, streak: 5, totalSessions: 118, achievementCount: 3, topSkill: "Shooting", isPro: true, avatarColor: "#7B68EE", initials: "RP", age: 17, country: "USA", ageBracket: "U18" },
  { id: "s3", name: "Sam Dubois", username: "sam_d7", position: "Midfielder", weeklyMinutes: 480, totalMinutes: 8900, streak: 12, totalSessions: 161, achievementCount: 5, topSkill: "Passing", isPro: false, avatarColor: "#20B2AA", initials: "SD", age: 15, country: "FRA", ageBracket: "U16" },
  { id: "s4", name: "Jordan Lee", username: "jordan_gk1", position: "Goalkeeper", weeklyMinutes: 300, totalMinutes: 5400, streak: 4, totalSessions: 97, achievementCount: 2, topSkill: "First Touch", isPro: false, avatarColor: "#DA70D6", initials: "JL", age: 18, country: "USA", ageBracket: "U18" },
  { id: "s5", name: "Marcus Webb", username: "m_webb", position: "Defender", weeklyMinutes: 540, totalMinutes: 9600, streak: 16, totalSessions: 177, achievementCount: 6, topSkill: "Fitness", isPro: true, avatarColor: "#3CB371", initials: "MW", age: 20, country: "USA", ageBracket: "U21" },
  { id: "s6", name: "Priya Sharma", username: "priya_s", position: "Forward", weeklyMinutes: 390, totalMinutes: 7100, streak: 6, totalSessions: 129, achievementCount: 3, topSkill: "Dribbling", isPro: false, avatarColor: "#CD853F", initials: "PS", age: 14, country: "ENG", ageBracket: "U14" },
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

function getRankChange(playerId: string): -1 | 0 | 1 {
  const hash = playerId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const v = hash % 3;
  return (v === 0 ? -1 : v === 1 ? 0 : 1) as -1 | 0 | 1;
}

function buildRankedList(
  allPlayers: LeaderboardPlayer[],
  myPlayer: LeaderboardPlayer,
  myWeeklyMins: number
): Array<{ player: LeaderboardPlayer; rank: number }> {
  const withMe = [...allPlayers];
  const insertIdx = withMe.findIndex((p) => p.weeklyMinutes < myWeeklyMins);
  if (insertIdx !== -1) {
    withMe.splice(insertIdx, 0, myPlayer);
  } else {
    withMe.push(myPlayer);
  }
  const ranked = withMe.map((p, idx) => ({ player: p, rank: idx + 1 }));
  const TOP_N = 15;
  const top = ranked.slice(0, TOP_N);
  const userInTop = top.some((r) => r.player.isMe);
  if (!userInTop) {
    const userEntry = ranked.find((r) => r.player.isMe);
    if (userEntry) return [...top.slice(0, TOP_N - 1), userEntry];
  }
  return top;
}

function AvatarBubble({
  initials,
  color,
  size = 40,
  isPro,
}: {
  initials: string;
  color: string;
  size?: number;
  isPro?: boolean;
}) {
  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <View
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color + "33", borderColor: color },
        ]}
      >
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
  const color =
    rank === 1
      ? "#FFD700"
      : rank === 2
      ? "#C0C0C0"
      : rank === 3
      ? "#CD7F32"
      : Colors.dark.textSecondary;
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

const MEDAL_COLORS: Record<1 | 2 | 3, string> = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
};

function PodiumPlayer({
  player,
  rank,
  elevated,
  onPress,
}: {
  player: LeaderboardPlayer;
  rank: 1 | 2 | 3;
  elevated?: boolean;
  onPress: (p: LeaderboardPlayer) => void;
}) {
  const medalColor = MEDAL_COLORS[rank];
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const avatarSize = elevated ? 66 : 52;
  return (
    <Animated.View
      entering={FadeInDown.delay(rank * 60).springify()}
      style={[{ flex: 1, alignItems: "center" }, animStyle]}
    >
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          scale.value = withSpring(0.93, { damping: 15 }, () => { scale.value = withSpring(1); });
          onPress(player);
        }}
        style={{ alignItems: "center", paddingVertical: elevated ? 0 : Spacing.sm, paddingHorizontal: 4 }}
      >
        {rank === 1 ? (
          <Feather name="award" size={18} color={medalColor} style={{ marginBottom: 4 }} />
        ) : (
          <View style={{ height: 22 }} />
        )}
        <View
          style={{
            borderRadius: (avatarSize + 8) / 2,
            borderWidth: 3,
            borderColor: medalColor,
            marginBottom: Spacing.sm,
            shadowColor: medalColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: elevated ? 0.7 : 0.4,
            shadowRadius: elevated ? 12 : 6,
          }}
        >
          <AvatarBubble initials={player.initials} color={player.avatarColor} size={avatarSize} isPro={player.isPro} />
        </View>
        <View
          style={{
            backgroundColor: medalColor + "22",
            borderRadius: BorderRadius.full,
            borderWidth: 1,
            borderColor: medalColor,
            paddingHorizontal: 8,
            paddingVertical: 2,
            marginBottom: Spacing.xs,
          }}
        >
          <ThemedText style={{ fontSize: 10, fontWeight: "800", color: medalColor }}>
            {rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd"}
          </ThemedText>
        </View>
        <ThemedText
          numberOfLines={1}
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: player.isMe ? Colors.dark.primary : Colors.dark.text,
            maxWidth: 80,
            textAlign: "center",
          }}
        >
          {player.isMe ? "You" : player.name.split(" ")[0]}
        </ThemedText>
        <ThemedText style={{ fontSize: 10, color: Colors.dark.textSecondary, marginTop: 1 }}>
          {player.weeklyMinutes}m
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

function TopThreePodium({
  players,
  onPress,
}: {
  players: Array<{ player: LeaderboardPlayer; rank: number }>;
  onPress: (p: LeaderboardPlayer) => void;
}) {
  const p1 = players[0]?.player;
  const p2 = players[1]?.player;
  const p3 = players[2]?.player;
  if (!p1) return null;
  return (
    <Animated.View entering={FadeIn.delay(20)} style={styles.podiumContainer}>
      <View style={styles.podiumRow}>
        {p2 ? <PodiumPlayer player={p2} rank={2} onPress={onPress} /> : <View style={{ flex: 1 }} />}
        <View style={[{ flex: 1, alignItems: "center" }]}>
          {p1 ? <PodiumPlayer player={p1} rank={1} elevated onPress={onPress} /> : null}
        </View>
        {p3 ? <PodiumPlayer player={p3} rank={3} onPress={onPress} /> : <View style={{ flex: 1 }} />}
      </View>
      <View style={styles.podiumBases}>
        <View style={[styles.podiumBase, { height: 28, backgroundColor: "#C0C0C0" + "22", borderColor: "#C0C0C0" + "55" }]}>
          <ThemedText style={{ fontSize: 10, color: "#C0C0C0", fontWeight: "800" }}>2</ThemedText>
        </View>
        <View style={[styles.podiumBase, { height: 44, backgroundColor: "#FFD700" + "22", borderColor: "#FFD700" + "55" }]}>
          <ThemedText style={{ fontSize: 10, color: "#FFD700", fontWeight: "800" }}>1</ThemedText>
        </View>
        <View style={[styles.podiumBase, { height: 20, backgroundColor: "#CD7F32" + "22", borderColor: "#CD7F32" + "55" }]}>
          <ThemedText style={{ fontSize: 10, color: "#CD7F32", fontWeight: "800" }}>3</ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

function PlayerRow({
  player,
  rank,
  onPress,
  topMinutes = 0,
}: {
  player: LeaderboardPlayer;
  rank: number;
  onPress: () => void;
  topMinutes?: number;
}) {
  const scale = useSharedValue(1);
  const progressAnim = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%` as any,
  }));

  useEffect(() => {
    const ratio = topMinutes > 0 ? Math.min(player.weeklyMinutes / topMinutes, 1) : 0;
    progressAnim.value = withTiming(ratio, { duration: 900 });
  }, [player.weeklyMinutes, topMinutes]);

  const rankChange = getRankChange(player.id);

  return (
    <Animated.View entering={FadeInDown.delay(rank * 40).springify()} style={animStyle}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          scale.value = withSpring(0.97, { damping: 15 }, () => {
            scale.value = withSpring(1);
          });
          onPress();
        }}
        style={[styles.playerRow, player.isMe && styles.playerRowMe]}
      >
        <View style={styles.rankChangeCol}>
          {rankChange > 0 ? (
            <Feather name="arrow-up" size={9} color={Colors.dark.primary} />
          ) : rankChange < 0 ? (
            <Feather name="arrow-down" size={9} color={Colors.dark.error} />
          ) : (
            <Feather name="minus" size={9} color={Colors.dark.textSecondary} />
          )}
        </View>
        <RankBadge rank={rank} />
        <View style={{ marginLeft: Spacing.md }}>
          <AvatarBubble initials={player.initials} color={player.avatarColor} size={44} isPro={player.isPro} />
        </View>
        <View style={styles.playerInfo}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <ThemedText
              style={[styles.playerName, player.isMe && { color: Colors.dark.primary }]}
              numberOfLines={1}
            >
              {player.name}
            </ThemedText>
            {player.isMe ? (
              <View style={styles.meTag}>
                <ThemedText style={{ fontSize: 9, color: Colors.dark.buttonText, fontWeight: "800" }}>YOU</ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText style={styles.playerMeta}>
            {player.position} · {player.ageBracket}
          </ThemedText>
          {topMinutes > 0 ? (
            <View style={styles.playerProgressTrack}>
              <Animated.View
                style={[
                  styles.playerProgressFill,
                  { backgroundColor: player.isMe ? Colors.dark.primary : player.avatarColor + "BB" },
                  progressStyle,
                ]}
              />
            </View>
          ) : null}
        </View>
        <View style={styles.playerStats}>
          <ThemedText style={styles.statValue}>
            {player.weeklyMinutes}
            <ThemedText style={styles.statUnit}>m</ThemedText>
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

function PlayerProfileModal({
  player,
  onClose,
}: {
  player: LeaderboardPlayer | null;
  onClose: () => void;
}) {
  if (!player) return null;
  const countryInfo = COUNTRIES.find((c) => c.code === player.country);
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
            <View style={{ flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm }}>
              <View style={styles.positionTag}>
                <ThemedText style={{ fontSize: 12, color: Colors.dark.primary, fontWeight: "600" }}>
                  {player.position}
                </ThemedText>
              </View>
              <View style={styles.positionTag}>
                <ThemedText style={{ fontSize: 12, color: Colors.dark.primary, fontWeight: "600" }}>
                  {player.ageBracket}
                </ThemedText>
              </View>
              {countryInfo ? (
                <View style={styles.positionTag}>
                  <ThemedText style={{ fontSize: 12, color: Colors.dark.primary, fontWeight: "600" }}>
                    {countryInfo.flag} {countryInfo.code}
                  </ThemedText>
                </View>
              ) : null}
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

const INVITE_MESSAGE =
  "Hey! I've been tracking my soccer training on Soccer Diary. It's a great way to level up your game. Join me! https://soccerdiary.app";

type ContactEntry = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  initials: string;
};

function getContactInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

type ContactsPermStatus = "unknown" | "loading" | "granted" | "denied" | "denied-final" | "web";

function InviteTab() {
  const [permStatus, setPermStatus] = useState<ContactsPermStatus>(
    Platform.OS === "web" ? "web" : "loading"
  );
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [query, setQuery] = useState("");

  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        sort: Contacts.SortTypes.FirstName,
      });
      const mapped: ContactEntry[] = data
        .filter((c) => c.name)
        .map((c) => ({
          id: c.id ?? c.name ?? Math.random().toString(),
          name: c.name ?? "",
          phone: c.phoneNumbers?.[0]?.number,
          email: c.emails?.[0]?.email,
          initials: getContactInitials(c.name ?? ""),
        }))
        .filter((c) => c.phone !== undefined || c.email !== undefined);
      setContacts(mapped);
    } catch {
      // Failed to load contacts silently
    } finally {
      setContactsLoading(false);
    }
  }, []);

  // On mount: check existing permission status to avoid prompting unnecessarily
  useEffect(() => {
    if (Platform.OS === "web") return;
    Contacts.getPermissionsAsync().then(({ status, canAskAgain }) => {
      if (status === "granted") {
        setPermStatus("granted");
        loadContacts();
      } else if (status === "denied") {
        setPermStatus(canAskAgain ? "denied" : "denied-final");
      } else {
        setPermStatus("unknown");
      }
    });
  }, [loadContacts]);

  const requestPermission = useCallback(async () => {
    setPermStatus("loading");
    const { status, canAskAgain } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      setPermStatus("granted");
      loadContacts();
    } else {
      // Any denial — show appropriate denied state
      setPermStatus(canAskAgain ? "denied" : "denied-final");
    }
  }, [loadContacts]);

  const handleShareInvite = useCallback(async () => {
    try {
      await Share.share({ message: INVITE_MESSAGE });
    } catch {
      // User cancelled or error
    }
  }, []);

  const handleInviteContact = useCallback(async (contact: ContactEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (contact.phone) {
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([contact.phone], INVITE_MESSAGE);
        return;
      }
    }
    if (contact.email) {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: [contact.email],
          subject: "Join me on Soccer Diary!",
          body: INVITE_MESSAGE,
        });
        return;
      }
    }
  }, []);

  const filteredContacts = contacts.filter(
    (c) =>
      query.length === 0 || c.name.toLowerCase().includes(query.toLowerCase())
  );

  if (Platform.OS === "web") {
    return (
      <View style={styles.inviteWebMsg}>
        <Feather name="smartphone" size={36} color={Colors.dark.textSecondary} />
        <ThemedText style={styles.emptyTitle}>Use the mobile app</ThemedText>
        <ThemedText style={styles.emptySubtitle}>
          Contacts and SMS invites require the Soccer Diary mobile app. Scan the QR code to get it on your phone.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Share via any app */}
      <Pressable style={styles.shareInviteBtn} onPress={handleShareInvite}>
        <View style={styles.shareInviteIcon}>
          <Feather name="share-2" size={18} color={Colors.dark.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.shareInviteTitle}>Share Invite Link</ThemedText>
          <ThemedText style={styles.shareInviteDesc}>
            Send via Facebook, WhatsApp, iMessage, or any app
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={16} color={Colors.dark.textSecondary} />
      </Pressable>

      {/* Contacts section */}
      <View style={styles.contactsHeader}>
        <Feather name="book" size={14} color={Colors.dark.textSecondary} />
        <ThemedText style={styles.contactsHeaderLabel}>From Your Contacts</ThemedText>
      </View>

      {permStatus === "unknown" ? (
        <View style={styles.permissionBox}>
          <Feather name="users" size={32} color={Colors.dark.textSecondary} />
          <ThemedText style={styles.permTitle}>Access Your Contacts</ThemedText>
          <ThemedText style={styles.permDesc}>
            See which friends you can invite. Soccer Diary never stores or uploads your contacts.
          </ThemedText>
          <Pressable style={styles.permBtn} onPress={requestPermission}>
            <ThemedText style={{ color: Colors.dark.buttonText, fontWeight: "700", fontSize: 14 }}>
              Allow Contacts Access
            </ThemedText>
          </Pressable>
        </View>
      ) : permStatus === "loading" ? (
        <View style={styles.permissionBox}>
          <ActivityIndicator color={Colors.dark.primary} />
          <ThemedText style={[styles.permDesc, { marginTop: Spacing.md }]}>Loading contacts...</ThemedText>
        </View>
      ) : permStatus === "denied" ? (
        <View style={styles.permissionBox}>
          <Feather name="lock" size={32} color={Colors.dark.textSecondary} />
          <ThemedText style={styles.permTitle}>Contacts Access Needed</ThemedText>
          <ThemedText style={styles.permDesc}>
            Please allow contacts access so you can invite your friends.
          </ThemedText>
          <Pressable style={styles.permBtn} onPress={requestPermission}>
            <ThemedText style={{ color: Colors.dark.buttonText, fontWeight: "700", fontSize: 14 }}>
              Try Again
            </ThemedText>
          </Pressable>
          {Platform.OS !== "web" ? (
            <Pressable
              style={[styles.permBtn, { backgroundColor: Colors.dark.backgroundSecondary, marginTop: 0 }]}
              onPress={async () => {
                try {
                  await Linking.openSettings();
                } catch {
                  // openSettings not supported
                }
              }}
            >
              <ThemedText style={{ color: Colors.dark.text, fontWeight: "600", fontSize: 14 }}>
                Open Settings
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : permStatus === "denied-final" ? (
        <View style={styles.permissionBox}>
          <Feather name="lock" size={32} color={Colors.dark.textSecondary} />
          <ThemedText style={styles.permTitle}>Contacts Access Denied</ThemedText>
          <ThemedText style={styles.permDesc}>
            Enable contacts access in Settings to invite friends directly.
          </ThemedText>
          {Platform.OS !== "web" ? (
            <Pressable
              style={styles.permBtn}
              onPress={async () => {
                try {
                  await Linking.openSettings();
                } catch {
                  // openSettings not supported
                }
              }}
            >
              <ThemedText style={{ color: Colors.dark.buttonText, fontWeight: "700", fontSize: 14 }}>
                Open Settings
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <>
          <View style={[styles.searchBar, { marginBottom: Spacing.sm }]}>
            <Feather name="search" size={16} color={Colors.dark.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              placeholderTextColor={Colors.dark.textSecondary}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery("")}>
                <Feather name="x" size={16} color={Colors.dark.textSecondary} />
              </Pressable>
            ) : null}
          </View>
          {contactsLoading ? (
            <ActivityIndicator color={Colors.dark.primary} style={{ marginTop: Spacing.xl }} />
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 260 }}
              renderItem={({ item }) => (
                <View style={styles.searchResultRow}>
                  <View style={[styles.contactAvatar, { backgroundColor: Colors.dark.backgroundSecondary }]}>
                    <ThemedText style={{ fontSize: 14, fontWeight: "700", color: Colors.dark.textSecondary }}>
                      {item.initials}
                    </ThemedText>
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <ThemedText style={{ fontWeight: "700", color: Colors.dark.text }}>{item.name}</ThemedText>
                    <ThemedText style={{ fontSize: 11, color: Colors.dark.textSecondary }}>
                      {item.phone ?? item.email ?? ""}
                    </ThemedText>
                  </View>
                  <Pressable
                    style={styles.inviteBtn}
                    onPress={() => handleInviteContact(item)}
                  >
                    <Feather
                      name={item.phone ? "message-circle" : "mail"}
                      size={14}
                      color={Colors.dark.buttonText}
                    />
                    <ThemedText style={{ fontSize: 11, color: Colors.dark.buttonText, fontWeight: "700", marginLeft: 4 }}>
                      Invite
                    </ThemedText>
                  </Pressable>
                </View>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingVertical: Spacing["2xl"] }}>
                  <ThemedText style={{ color: Colors.dark.textSecondary }}>
                    {contacts.length === 0 ? "No contacts with phone or email found" : "No contacts match your search"}
                  </ThemedText>
                </View>
              }
            />
          )}
        </>
      )}
    </View>
  );
}

function AddFriendModal({
  visible,
  friends,
  onClose,
  onAddFriend,
}: {
  visible: boolean;
  friends: Friend[];
  onClose: () => void;
  onAddFriend: (f: Friend) => void;
}) {
  const [activeTab, setActiveTab] = useState<"players" | "invite">("players");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setActiveTab("players");
    }
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
        <View style={[styles.profileSheet, { maxHeight: "88%" }]}>
          <View style={styles.sheetHandle} />
          <ThemedText style={[styles.profileName, { marginBottom: Spacing.md }]}>Add Friends</ThemedText>

          {/* Tab switcher */}
          <View style={[styles.tabRow, { marginHorizontal: 0, marginBottom: Spacing.md }]}>
            <Pressable
              style={[styles.tabBtn, activeTab === "players" && styles.tabBtnActive]}
              onPress={() => setActiveTab("players")}
            >
              <Feather
                name="search"
                size={13}
                color={activeTab === "players" ? Colors.dark.primary : Colors.dark.textSecondary}
              />
              <ThemedText style={[styles.tabLabel, activeTab === "players" && styles.tabLabelActive]}>
                Find Players
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, activeTab === "invite" && styles.tabBtnActive]}
              onPress={() => setActiveTab("invite")}
            >
              <Feather
                name="user-plus"
                size={13}
                color={activeTab === "invite" ? Colors.dark.primary : Colors.dark.textSecondary}
              />
              <ThemedText style={[styles.tabLabel, activeTab === "invite" && styles.tabLabelActive]}>
                Invite Friends
              </ThemedText>
            </Pressable>
          </View>

          {activeTab === "players" ? (
            <>
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
                style={{ marginTop: Spacing.md, maxHeight: 320 }}
                renderItem={({ item }) => (
                  <View style={styles.searchResultRow}>
                    <AvatarBubble initials={item.initials} color={item.avatarColor} size={40} isPro={item.isPro} />
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <ThemedText style={{ fontWeight: "700", color: Colors.dark.text }}>{item.name}</ThemedText>
                      <ThemedText style={{ fontSize: 12, color: Colors.dark.textSecondary }}>
                        @{item.username} · {item.position} · {item.ageBracket}
                      </ThemedText>
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
                    <ThemedText style={{ color: Colors.dark.textSecondary, marginTop: Spacing.md }}>
                      No players found
                    </ThemedText>
                  </View>
                }
              />
            </>
          ) : (
            <InviteTab />
          )}

          <Pressable style={[styles.closeBtn, { marginTop: Spacing.md }]} onPress={onClose}>
            <ThemedText style={{ color: Colors.dark.buttonText, fontWeight: "700", fontSize: 15 }}>Done</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function CountryPickerModal({
  visible,
  current,
  onClose,
  onSelect,
}: {
  visible: boolean;
  current: string;
  onClose: () => void;
  onSelect: (code: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.profileSheet, { maxHeight: "70%" }]}>
          <View style={styles.sheetHandle} />
          <ThemedText style={[styles.profileName, { marginBottom: Spacing.lg }]}>Select Your Country</ThemedText>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.countryRow, item.code === current && styles.countryRowActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(item.code);
                  onClose();
                }}
              >
                <ThemedText style={styles.countryFlag}>{item.flag}</ThemedText>
                <ThemedText style={[styles.countryLabel, item.code === current && { color: Colors.dark.primary }]}>
                  {item.label}
                </ThemedText>
                {item.code === current ? (
                  <Feather name="check" size={16} color={Colors.dark.primary} />
                ) : null}
              </Pressable>
            )}
          />
          <Pressable style={[styles.closeBtn, { marginTop: Spacing.md }]} onPress={onClose}>
            <ThemedText style={{ color: Colors.dark.buttonText, fontWeight: "700", fontSize: 15 }}>Cancel</ThemedText>
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

  const [activeTab, setActiveTab] = useState<ActiveTab>("global");
  const [ageBracket, setAgeBracket] = useState<AgeBracket>("All");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardPlayer | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [userCountry, setUserCountry] = useState("USA");
  const [tabRowWidth, setTabRowWidth] = useState(0);

  const challengeProgressAnim = useSharedValue(0);
  const challengeGlowAnim = useSharedValue(0);
  const tabIndicatorX = useSharedValue(0);

  const friendsKey = user ? `${FRIENDS_STORAGE_BASE_KEY}_${user.id}` : null;
  const countryKey = user ? `${COUNTRY_STORAGE_KEY}_${user.id}` : COUNTRY_STORAGE_KEY;

  useEffect(() => {
    AsyncStorage.getItem(countryKey).then((v) => {
      if (v) setUserCountry(v);
    });
  }, [countryKey]);

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

  const saveFriends = useCallback(
    async (list: Friend[]) => {
      if (!friendsKey) return;
      try {
        await AsyncStorage.setItem(friendsKey, JSON.stringify(list));
      } catch {
        // Storage write failed silently
      }
      setFriends(list);
    },
    [friendsKey]
  );

  const handleSelectCountry = useCallback(
    async (code: string) => {
      setUserCountry(code);
      try {
        await AsyncStorage.setItem(countryKey, code);
      } catch {
        // ignore
      }
    },
    [countryKey]
  );

  const handleAddFriend = useCallback(
    (friend: Friend) => {
      saveFriends([...friends, friend]);
    },
    [friends, saveFriends]
  );

  const weeklyMins = getWeeklyMinutes(entries);
  const weekSessions = getWeekSessionCount(entries);
  const challengeProgress = Math.min(weekSessions / WEEKLY_CHALLENGE.target, 1);

  useEffect(() => {
    challengeProgressAnim.value = withTiming(challengeProgress, { duration: 1000 });
    if (challengeProgress >= 0.8) {
      challengeGlowAnim.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
    }
  }, [challengeProgress]);

  useEffect(() => {
    const tabIndex = activeTab === "global" ? 0 : activeTab === "national" ? 1 : 2;
    const tabWidth = tabRowWidth / 3;
    tabIndicatorX.value = withSpring(tabIndex * tabWidth, { damping: 22, stiffness: 220 });
  }, [activeTab, tabRowWidth]);

  const challengeBarStyle = useAnimatedStyle(() => ({
    width: `${challengeProgressAnim.value * 100}%` as any,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: interpolate(challengeGlowAnim.value, [0, 1], [0, 0.9]),
    shadowRadius: interpolate(challengeGlowAnim.value, [0, 1], [2, 10]),
  }));

  const tabIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorX.value }],
  }));

  const topSkill = getTopSkill(entries);
  const userLevel = getUserLevel(stats.totalEntries);
  const userAchievementCount = ACHIEVEMENTS.filter((a) => a.isEarned(entries, stats)).length;
  const userAge = user?.age ?? 16;
  const userAgeBracket = getAgeBracket(userAge);
  const countryInfo = COUNTRIES.find((c) => c.code === userCountry) ?? COUNTRIES[0];

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
    age: userAge,
    country: userCountry,
    ageBracket: userAgeBracket,
    isMe: true,
  };

  // --- Global leaderboard (all countries, age filtered) ---
  const globalPool = ageBracket === "All"
    ? GLOBAL_PLAYERS
    : GLOBAL_PLAYERS.filter((p) => p.ageBracket === ageBracket);
  const globalDisplayList = buildRankedList(globalPool, myPlayer, weeklyMins);

  // --- National leaderboard (same country, age filtered) ---
  const nationalBase = GLOBAL_PLAYERS.filter((p) => p.country === userCountry);
  const nationalPool = ageBracket === "All"
    ? nationalBase
    : nationalBase.filter((p) => p.ageBracket === ageBracket);
  const nationalDisplayList = buildRankedList(nationalPool, myPlayer, weeklyMins);

  // --- Age bracket leaderboard rank (for summary card) ---
  const ageBracketPool = GLOBAL_PLAYERS.filter((p) => p.ageBracket === userAgeBracket);
  const ageBracketRanked = [...ageBracketPool, myPlayer].sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);
  const myAgeBracketRank = ageBracketRanked.findIndex((p) => p.isMe) + 1;

  // --- Full global rank (no filter) for summary ---
  const myRankGlobal = [...GLOBAL_PLAYERS, myPlayer].sort((a, b) => b.weeklyMinutes - a.weeklyMinutes).findIndex((p) => p.isMe) + 1;
  const totalGlobal = GLOBAL_PLAYERS.length + 1;

  // --- National rank (no filter) for summary ---
  const nationalAllPool = [...nationalBase, myPlayer].sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);
  const myNationalRank = nationalAllPool.findIndex((p) => p.isMe) + 1;
  const totalNational = nationalAllPool.length;

  // --- Friends tab ---
  const friendsAsLeaderboard: LeaderboardPlayer[] = friends.map((f) => ({
    ...f,
    level: getUserLevel(f.totalSessions),
    isMe: false,
  }));
  const friendsWithMe = [myPlayer, ...friendsAsLeaderboard].sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);

  const showAgeBracketFilter = activeTab !== "friends";

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
              <ThemedText style={{ fontSize: 12, color: Colors.dark.accent, fontWeight: "700" }}>
                {WEEKLY_CHALLENGE.daysLeft}d
              </ThemedText>
              <ThemedText style={{ fontSize: 9, color: Colors.dark.textSecondary }}>left</ThemedText>
            </View>
          </View>
          <View style={styles.progressBarTrack}>
            <Animated.View style={[styles.progressBarFill, challengeBarStyle]} />
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

        {/* Rankings Summary Card */}
        <Animated.View entering={FadeIn.delay(80)} style={styles.rankSummaryCard}>
          <ThemedText style={styles.rankSummaryTitle}>Your Rankings This Week</ThemedText>
          <View style={styles.rankPillRow}>
            <View style={styles.rankPill}>
              <Feather name="globe" size={12} color={Colors.dark.textSecondary} />
              <ThemedText style={styles.rankPillLabel}>Global</ThemedText>
              <ThemedText style={styles.rankPillValue}>#{myRankGlobal}</ThemedText>
              <ThemedText style={styles.rankPillSub}>of {totalGlobal}</ThemedText>
            </View>
            <View style={[styles.rankPill, { borderColor: Colors.dark.primary + "44" }]}>
              <ThemedText style={{ fontSize: 12 }}>{countryInfo.flag}</ThemedText>
              <ThemedText style={styles.rankPillLabel}>National</ThemedText>
              <ThemedText style={[styles.rankPillValue, { color: Colors.dark.primary }]}>#{myNationalRank}</ThemedText>
              <ThemedText style={styles.rankPillSub}>of {totalNational}</ThemedText>
            </View>
            <View style={styles.rankPill}>
              <Feather name="users" size={12} color={Colors.dark.textSecondary} />
              <ThemedText style={styles.rankPillLabel}>{userAgeBracket}</ThemedText>
              <ThemedText style={styles.rankPillValue}>#{myAgeBracketRank}</ThemedText>
              <ThemedText style={styles.rankPillSub}>of {ageBracketPool.length + 1}</ThemedText>
            </View>
          </View>
        </Animated.View>

        {/* Tab Switcher */}
        <Animated.View
          entering={FadeIn.delay(100)}
          style={styles.tabRow}
          onLayout={(e) => setTabRowWidth(e.nativeEvent.layout.width - 8)}
        >
          {tabRowWidth > 0 ? (
            <Animated.View
              style={[
                styles.tabIndicatorSlider,
                { width: tabRowWidth / 3 },
                tabIndicatorStyle,
              ]}
            />
          ) : null}
          <Pressable
            style={styles.tabBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab("global");
            }}
          >
            <Feather
              name="globe"
              size={13}
              color={activeTab === "global" ? Colors.dark.primary : Colors.dark.textSecondary}
            />
            <ThemedText style={[styles.tabLabel, activeTab === "global" && styles.tabLabelActive]}>Global</ThemedText>
          </Pressable>
          <Pressable
            style={styles.tabBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab("national");
            }}
          >
            <ThemedText style={{ fontSize: 13 }}>{countryInfo.flag}</ThemedText>
            <ThemedText style={[styles.tabLabel, activeTab === "national" && styles.tabLabelActive]}>
              National
            </ThemedText>
          </Pressable>
          <Pressable
            style={styles.tabBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab("friends");
            }}
          >
            <Feather
              name="users"
              size={13}
              color={activeTab === "friends" ? Colors.dark.primary : Colors.dark.textSecondary}
            />
            <ThemedText style={[styles.tabLabel, activeTab === "friends" && styles.tabLabelActive]}>
              {`Friends${friends.length > 0 ? ` (${friends.length})` : ""}`}
            </ThemedText>
          </Pressable>
        </Animated.View>

        {/* Country selector row (national tab) */}
        {activeTab === "national" ? (
          <Animated.View entering={FadeIn} style={styles.countrySelector}>
            <ThemedText style={styles.countrySelectorLabel}>Showing rankings for:</ThemedText>
            <Pressable style={styles.countrySelectorBtn} onPress={() => setShowCountryPicker(true)}>
              <ThemedText style={{ fontSize: 16 }}>{countryInfo.flag}</ThemedText>
              <ThemedText style={styles.countrySelectorName}>{countryInfo.label}</ThemedText>
              <Feather name="chevron-down" size={14} color={Colors.dark.primary} />
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Add friend button (friends tab) */}
        {activeTab === "friends" ? (
          <Animated.View entering={FadeIn} style={styles.addFriendBar}>
            <Pressable style={styles.addFriendBarBtn} onPress={() => setShowAddFriend(true)}>
              <Feather name="user-plus" size={14} color={Colors.dark.primary} />
              <ThemedText style={{ color: Colors.dark.primary, fontWeight: "700", fontSize: 13, marginLeft: 6 }}>
                Find Players
              </ThemedText>
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Age Bracket Filter Chips */}
        {showAgeBracketFilter ? (
          <Animated.View entering={FadeIn.delay(120)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bracketChips}
            >
              {AGE_BRACKETS.map((bracket) => (
                <Pressable
                  key={bracket}
                  style={[styles.bracketChip, ageBracket === bracket && styles.bracketChipActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setAgeBracket(bracket);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.bracketChipLabel,
                      ageBracket === bracket && styles.bracketChipLabelActive,
                    ]}
                  >
                    {bracket}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        {/* Leaderboard List */}
        <View style={styles.leaderboard}>
          {activeTab === "global" ? (
            <>
              {globalDisplayList.length >= 3 ? (
                <TopThreePodium
                  players={globalDisplayList.slice(0, 3)}
                  onPress={(p) => setSelectedPlayer(p)}
                />
              ) : null}
              {globalDisplayList.slice(globalDisplayList.length >= 3 ? 3 : 0).map(({ player, rank }) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  rank={rank}
                  onPress={() => setSelectedPlayer(player)}
                  topMinutes={globalDisplayList[0]?.player.weeklyMinutes}
                />
              ))}
            </>
          ) : activeTab === "national" ? (
            nationalDisplayList.length === 0 ? (
              <View style={styles.emptyFriends}>
                <Feather name="map" size={40} color={Colors.dark.textSecondary} />
                <ThemedText style={styles.emptyTitle}>No players found</ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  No {ageBracket !== "All" ? ageBracket + " " : ""}players from {countryInfo.label} yet.
                </ThemedText>
              </View>
            ) : (
              <>
                {nationalDisplayList.length >= 3 ? (
                  <TopThreePodium
                    players={nationalDisplayList.slice(0, 3)}
                    onPress={(p) => setSelectedPlayer(p)}
                  />
                ) : null}
                {nationalDisplayList.slice(nationalDisplayList.length >= 3 ? 3 : 0).map(({ player, rank }) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    rank={rank}
                    onPress={() => setSelectedPlayer(player)}
                    topMinutes={nationalDisplayList[0]?.player.weeklyMinutes}
                  />
                ))}
              </>
            )
          ) : (
            <>
              {friendsWithMe.map((player, idx) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  rank={idx + 1}
                  onPress={() => setSelectedPlayer(player)}
                  topMinutes={friendsWithMe[0]?.weeklyMinutes}
                />
              ))}
              {friends.length === 0 ? (
                <Animated.View entering={FadeIn} style={styles.emptyFriends}>
                  <Feather name="users" size={40} color={Colors.dark.textSecondary} />
                  <ThemedText style={styles.emptyTitle}>Add friends to compete!</ThemedText>
                  <ThemedText style={styles.emptySubtitle}>
                    Search for players and add them to see how you stack up.
                  </ThemedText>
                  <Pressable style={styles.addFriendCta} onPress={() => setShowAddFriend(true)}>
                    <Feather name="user-plus" size={16} color={Colors.dark.buttonText} />
                    <ThemedText style={{ color: Colors.dark.buttonText, fontWeight: "700", marginLeft: 8 }}>
                      Find Players
                    </ThemedText>
                  </Pressable>
                </Animated.View>
              ) : null}
            </>
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
      <CountryPickerModal
        visible={showCountryPicker}
        current={userCountry}
        onClose={() => setShowCountryPicker(false)}
        onSelect={handleSelectCountry}
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
  rankSummaryCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "22",
  },
  rankSummaryTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rankPillRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  rankPill: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundSecondary,
  },
  rankPillLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    fontWeight: "600",
  },
  rankPillValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  rankPillSub: {
    fontSize: 9,
    color: Colors.dark.textSecondary,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  tabBtnActive: {
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
  },
  tabLabelActive: {
    color: Colors.dark.primary,
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  countrySelectorLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  countrySelectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "44",
  },
  countrySelectorName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.dark.primary,
  },
  addFriendBar: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    alignItems: "flex-end",
  },
  addFriendBarBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "44",
  },
  bracketChips: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    flexDirection: "row",
  },
  bracketChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundDefault,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundSecondary,
  },
  bracketChipActive: {
    backgroundColor: Colors.dark.primary + "22",
    borderColor: Colors.dark.primary,
  },
  bracketChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
  },
  bracketChipLabelActive: {
    color: Colors.dark.primary,
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
  shareInviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "33",
  },
  shareInviteIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.primary + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  shareInviteTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  shareInviteDesc: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  contactsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  contactsHeaderLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  permissionBox: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  permTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.dark.text,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  permDesc: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
  permBtn: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.primary + "33",
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "66",
  },
  inviteWebMsg: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.backgroundSecondary,
    gap: Spacing.md,
  },
  countryRowActive: {
    backgroundColor: Colors.dark.primary + "11",
  },
  countryFlag: {
    fontSize: 22,
  },
  countryLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  podiumContainer: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.backgroundSecondary,
  },
  podiumRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  podiumBases: {
    flexDirection: "row",
    marginTop: Spacing.sm,
  },
  podiumBase: {
    flex: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  rankChangeCol: {
    width: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
  playerProgressTrack: {
    height: 3,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  playerProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  tabIndicatorSlider: {
    position: "absolute",
    top: 4,
    left: 0,
    bottom: 4,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.dark.backgroundSecondary,
    zIndex: 0,
  },
});
