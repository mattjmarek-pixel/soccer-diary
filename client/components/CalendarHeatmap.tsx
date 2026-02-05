import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing } from "@/constants/theme";
import { DiaryEntry } from "@/contexts/DiaryContext";

interface CalendarHeatmapProps {
  entries: DiaryEntry[];
  weeks?: number;
}

const SQUARE_SIZE = 14;
const GAP = 2;
const LABEL_WIDTH = 20;

const getIntensityColor = (minutes: number): string => {
  if (minutes === 0) return Colors.dark.backgroundSecondary;
  if (minutes <= 30) return Colors.dark.primary + "33";
  if (minutes <= 60) return Colors.dark.primary + "66";
  if (minutes <= 90) return Colors.dark.primary + "B3";
  return Colors.dark.primary;
};

const DAY_LABELS = ["M", "", "W", "", "F", "", ""];

export function CalendarHeatmap({ entries, weeks = 12 }: CalendarHeatmapProps) {
  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - mondayOffset));

    const totalDays = weeks * 7;
    const startDate = new Date(endOfWeek);
    startDate.setDate(endOfWeek.getDate() - totalDays + 1);

    const durationMap: Record<string, number> = {};
    entries.forEach((entry) => {
      const dateKey = entry.date.split("T")[0];
      durationMap[dateKey] = (durationMap[dateKey] || 0) + entry.duration;
    });

    const columns: { date: Date; minutes: number }[][] = [];
    const months: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;

    for (let col = 0; col < weeks; col++) {
      const week: { date: Date; minutes: number }[] = [];
      for (let row = 0; row < 7; row++) {
        const dayIndex = col * 7 + row;
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + dayIndex);
        const dateKey = date.toISOString().split("T")[0];
        const minutes = durationMap[dateKey] || 0;
        week.push({ date, minutes });

        if (row === 0 && date.getMonth() !== lastMonth) {
          lastMonth = date.getMonth();
          months.push({
            label: date.toLocaleString("default", { month: "short" }),
            colIndex: col,
          });
        }
      }
      columns.push(week);
    }

    return { grid: columns, monthLabels: months };
  }, [entries, weeks]);

  return (
    <View style={styles.container}>
      <View style={styles.monthRow}>
        <View style={{ width: LABEL_WIDTH }} />
        {Array.from({ length: weeks }).map((_, colIdx) => {
          const monthLabel = monthLabels.find((m) => m.colIndex === colIdx);
          return (
            <View
              key={`month-${colIdx}`}
              style={{ width: SQUARE_SIZE + GAP, alignItems: "center" }}
            >
              {monthLabel ? (
                <ThemedText
                  type="small"
                  style={styles.monthLabel}
                >
                  {monthLabel.label}
                </ThemedText>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.gridContainer}>
        <View style={styles.dayLabels}>
          {DAY_LABELS.map((label, idx) => (
            <View
              key={`label-${idx}`}
              style={{ height: SQUARE_SIZE + GAP, justifyContent: "center" }}
            >
              {label ? (
                <ThemedText type="small" style={styles.dayLabel}>
                  {label}
                </ThemedText>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.grid}>
          {grid.map((week, colIdx) => (
            <View key={`col-${colIdx}`} style={styles.column}>
              {week.map((day, rowIdx) => (
                <View
                  key={`cell-${colIdx}-${rowIdx}`}
                  style={[
                    styles.square,
                    {
                      backgroundColor: day.date > new Date()
                        ? "transparent"
                        : getIntensityColor(day.minutes),
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  monthRow: {
    flexDirection: "row",
    marginBottom: Spacing.xs,
    height: 16,
  },
  monthLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
  },
  gridContainer: {
    flexDirection: "row",
  },
  dayLabels: {
    width: LABEL_WIDTH,
    marginRight: GAP,
  },
  dayLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
  },
  grid: {
    flexDirection: "row",
  },
  column: {
    marginRight: GAP,
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    borderRadius: 3,
    marginBottom: GAP,
  },
});
