import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#FFFFFF",
    textSecondary: "#B0B0B0",
    buttonText: "#121212",
    tabIconDefault: "#B0B0B0",
    tabIconSelected: "#00E676",
    link: "#00E676",
    primary: "#00E676",
    accent: "#FFD600",
    error: "#FF5252",
    success: "#00E676",
    backgroundRoot: "#121212",
    backgroundDefault: "#1E1E1E",
    backgroundSecondary: "#2A2A2A",
    backgroundTertiary: "#353535",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#B0B0B0",
    buttonText: "#121212",
    tabIconDefault: "#B0B0B0",
    tabIconSelected: "#00E676",
    link: "#00E676",
    primary: "#00E676",
    accent: "#FFD600",
    error: "#FF5252",
    success: "#00E676",
    backgroundRoot: "#121212",
    backgroundDefault: "#1E1E1E",
    backgroundSecondary: "#2A2A2A",
    backgroundTertiary: "#353535",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  display: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Montserrat_700Bold",
  },
  heading: {
    fontSize: 20,
    fontWeight: "600" as const,
    fontFamily: "Montserrat_600SemiBold",
  },
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    fontFamily: "Montserrat_700Bold",
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Montserrat_700Bold",
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
    fontFamily: "Montserrat_600SemiBold",
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
    fontFamily: "Montserrat_600SemiBold",
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "Montserrat_600SemiBold",
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const MoodColors = {
  1: "#FF5252",
  2: "#FF9800",
  3: "#FFD600",
  4: "#8BC34A",
  5: "#00E676",
};

export const SkillCategories = [
  "Dribbling",
  "Shooting",
  "Passing",
  "First Touch",
  "Fitness",
  "Tactics",
] as const;

export type SkillCategory = (typeof SkillCategories)[number];

export const SkillColors: Record<SkillCategory, string> = {
  Dribbling: "#00E676",
  Shooting: "#FF5252",
  Passing: "#40C4FF",
  "First Touch": "#FF9800",
  Fitness: "#CE93D8",
  Tactics: "#FFD740",
};
