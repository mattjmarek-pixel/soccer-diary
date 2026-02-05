import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet, Dimensions } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Svg, { Line, Circle, Polyline, Rect, Text as SvgText } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { Colors, Spacing, MoodColors, SkillCategories } from "@/constants/theme";
import { useDiary } from "@/contexts/DiaryContext";

const CHART_HEIGHT = 200;
const BAR_CHART_HEIGHT = 180;
const PADDING_LEFT = 30;
const PADDING_RIGHT = 10;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 30;

const formatMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const getLast14Days = () => {
  const days: string[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
};

export default function StatsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { entries, stats } = useDiary();

  const screenWidth = Dimensions.get("window").width - Spacing.lg * 2 - Spacing.lg * 2;
  const chartWidth = screenWidth;

  const last14Days = useMemo(() => getLast14Days(), []);

  const moodData = useMemo(() => {
    const dateMap: Record<string, number[]> = {};
    entries.forEach((entry) => {
      const dateKey = entry.date.split("T")[0];
      if (last14Days.includes(dateKey)) {
        if (!dateMap[dateKey]) dateMap[dateKey] = [];
        dateMap[dateKey].push(entry.mood);
      }
    });

    return last14Days.map((date) => ({
      date,
      mood: dateMap[date]
        ? Math.round(dateMap[date].reduce((a, b) => a + b, 0) / dateMap[date].length)
        : null,
    }));
  }, [entries, last14Days]);

  const durationData = useMemo(() => {
    const dateMap: Record<string, number> = {};
    entries.forEach((entry) => {
      const dateKey = entry.date.split("T")[0];
      if (last14Days.includes(dateKey)) {
        dateMap[dateKey] = (dateMap[dateKey] || 0) + entry.duration;
      }
    });

    return last14Days.map((date) => ({
      date,
      duration: dateMap[date] || 0,
    }));
  }, [entries, last14Days]);

  const maxDuration = useMemo(() => {
    const max = Math.max(...durationData.map((d) => d.duration), 1);
    return max;
  }, [durationData]);

  const skillCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SkillCategories.forEach((cat) => {
      counts[cat] = 0;
    });
    entries.forEach((entry) => {
      entry.skills.forEach((skill) => {
        counts[skill.category] = (counts[skill.category] || 0) + 1;
      });
    });
    return counts;
  }, [entries]);

  const maxSkillCount = useMemo(() => {
    return Math.max(...Object.values(skillCounts), 1);
  }, [skillCounts]);

  const drawableWidth = chartWidth - PADDING_LEFT - PADDING_RIGHT;
  const drawableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const moodPoints = useMemo(() => {
    return moodData
      .map((d, i) => {
        if (d.mood === null) return null;
        const x = PADDING_LEFT + (i / (moodData.length - 1)) * drawableWidth;
        const y = PADDING_TOP + drawableHeight - ((d.mood - 1) / 4) * drawableHeight;
        return { x, y, mood: d.mood };
      });
  }, [moodData, drawableWidth, drawableHeight]);

  const polylinePoints = useMemo(() => {
    return moodPoints
      .filter((p): p is { x: number; y: number; mood: number } => p !== null)
      .map((p) => `${p.x},${p.y}`)
      .join(" ");
  }, [moodPoints]);

  const barDrawableHeight = BAR_CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const barWidth = Math.max((drawableWidth / 14) - 4, 4);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing["2xl"],
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statsRow}>
        <StatCard
          icon="book-open"
          value={stats.totalEntries}
          label="Entries"
          color={Colors.dark.primary}
        />
        <StatCard
          icon="clock"
          value={formatMinutes(stats.totalMinutes)}
          label="Total Time"
          color={Colors.dark.accent}
        />
        <StatCard
          icon="zap"
          value={stats.currentStreak}
          label="Streak"
          color="#FF6B6B"
        />
      </View>

      <Card elevation={2} style={styles.chartCard}>
        <ThemedText type="heading" style={styles.chartTitle}>Mood Trend</ThemedText>
        <Svg width={chartWidth} height={CHART_HEIGHT}>
          {[1, 2, 3, 4, 5].map((level) => {
            const y = PADDING_TOP + drawableHeight - ((level - 1) / 4) * drawableHeight;
            return (
              <React.Fragment key={`grid-${level}`}>
                <Line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={chartWidth - PADDING_RIGHT}
                  y2={y}
                  stroke={Colors.dark.backgroundSecondary}
                  strokeWidth={1}
                />
                <SvgText
                  x={PADDING_LEFT - 8}
                  y={y + 4}
                  fontSize={10}
                  fill={Colors.dark.textSecondary}
                  textAnchor="end"
                >
                  {level}
                </SvgText>
              </React.Fragment>
            );
          })}
          {moodData.map((d, i) => {
            if (i % 3 !== 0) return null;
            const x = PADDING_LEFT + (i / (moodData.length - 1)) * drawableWidth;
            const dateLabel = new Date(d.date).getDate().toString();
            return (
              <SvgText
                key={`xlabel-${i}`}
                x={x}
                y={CHART_HEIGHT - 5}
                fontSize={10}
                fill={Colors.dark.textSecondary}
                textAnchor="middle"
              >
                {dateLabel}
              </SvgText>
            );
          })}
          {polylinePoints.length > 0 ? (
            <Polyline
              points={polylinePoints}
              fill="none"
              stroke={Colors.dark.primary}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}
          {moodPoints.map((p, i) =>
            p !== null ? (
              <Circle
                key={`dot-${i}`}
                cx={p.x}
                cy={p.y}
                r={5}
                fill={MoodColors[p.mood as keyof typeof MoodColors] || Colors.dark.primary}
              />
            ) : null
          )}
        </Svg>
      </Card>

      <Card elevation={2} style={styles.chartCard}>
        <ThemedText type="heading" style={styles.chartTitle}>Training Duration</ThemedText>
        <Svg width={chartWidth} height={BAR_CHART_HEIGHT}>
          {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
            const y = PADDING_TOP + barDrawableHeight - frac * barDrawableHeight;
            return (
              <Line
                key={`bgrid-${idx}`}
                x1={PADDING_LEFT}
                y1={y}
                x2={chartWidth - PADDING_RIGHT}
                y2={y}
                stroke={Colors.dark.backgroundSecondary}
                strokeWidth={1}
              />
            );
          })}
          {durationData.map((d, i) => {
            const barHeight = (d.duration / maxDuration) * barDrawableHeight;
            const x = PADDING_LEFT + (i / 14) * drawableWidth + 2;
            const y = PADDING_TOP + barDrawableHeight - barHeight;
            return (
              <React.Fragment key={`bar-${i}`}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={2}
                  fill={Colors.dark.primary + "99"}
                />
                {d.duration > 0 ? (
                  <SvgText
                    x={x + barWidth / 2}
                    y={y - 4}
                    fontSize={8}
                    fill={Colors.dark.textSecondary}
                    textAnchor="middle"
                  >
                    {d.duration}
                  </SvgText>
                ) : null}
                {i % 3 === 0 ? (
                  <SvgText
                    x={x + barWidth / 2}
                    y={BAR_CHART_HEIGHT - 5}
                    fontSize={10}
                    fill={Colors.dark.textSecondary}
                    textAnchor="middle"
                  >
                    {new Date(d.date).getDate()}
                  </SvgText>
                ) : null}
              </React.Fragment>
            );
          })}
        </Svg>
      </Card>

      <Card elevation={2} style={styles.chartCard}>
        <ThemedText type="heading" style={styles.chartTitle}>Skills Focus</ThemedText>
        {SkillCategories.map((cat) => (
          <View key={cat} style={styles.skillRow}>
            <ThemedText type="small" style={styles.skillLabel}>{cat}</ThemedText>
            <View style={styles.skillBarContainer}>
              <View
                style={[
                  styles.skillBar,
                  {
                    width: `${(skillCounts[cat] / maxSkillCount) * 100}%`,
                    backgroundColor: Colors.dark.primary,
                  },
                ]}
              />
            </View>
            <ThemedText type="small" style={styles.skillCount}>
              {skillCounts[cat]}
            </ThemedText>
          </View>
        ))}
      </Card>

      <Card elevation={2} style={styles.chartCard}>
        <ThemedText type="heading" style={styles.chartTitle}>Activity</ThemedText>
        <CalendarHeatmap entries={entries} weeks={12} />
      </Card>
    </ScrollView>
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
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  chartCard: {
    marginBottom: Spacing.lg,
  },
  chartTitle: {
    marginBottom: Spacing.md,
  },
  skillRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  skillLabel: {
    width: 80,
    color: Colors.dark.textSecondary,
  },
  skillBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: 6,
    marginHorizontal: Spacing.sm,
    overflow: "hidden",
  },
  skillBar: {
    height: 12,
    borderRadius: 6,
  },
  skillCount: {
    width: 30,
    textAlign: "right",
    color: Colors.dark.text,
  },
});
