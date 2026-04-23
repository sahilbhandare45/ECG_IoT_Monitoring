export const theme = {
  colors: {
    background: "#0A0F1C",
    backgroundLight: "#0F1629",
    card: "#141B2D",
    cardHighlight: "#11263A",
    cardDanger: "#2D141C",
    border: "rgba(255,255,255,0.12)",
    borderHighlight: "rgba(0,229,255,0.3)",

    primary: "#00E5FF",
    primaryDark: "#00B8D4",
    secondary: "#7B61FF",
    accent: "#4FFFB0",

    alert: "#FF3B5C",
    alertDark: "#D4234A",
    warning: "#FFB020",

    textPrimary: "#FFFFFF",
    textSecondary: "#7A8599",
    textMuted: "#4A5568",

    success: "#4FFFB0",
    info: "#00E5FF",
  },

  typography: {
    hero: 52,
    h1: 28,
    h2: 22,
    h3: 18,
    body: 14,
    caption: 11,
    micro: 9,
  },

  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    black: "900",
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 30,
    full: 999,
  },

  shadows: {
    glow: {
      shadowColor: "#00E5FF",
      shadowOpacity: 0.3,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 0 },
      elevation: 12,
    },
    soft: {
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    alertGlow: {
      shadowColor: "#FF3B5C",
      shadowOpacity: 0.4,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 0 },
      elevation: 12,
    },
  },
};