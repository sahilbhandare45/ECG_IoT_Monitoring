import { View, StyleSheet } from "react-native";
import { theme } from "../theme/theme";

export default function GlassCard({ children, style, variant = "default" }) {
  const borderColor =
    variant === "highlighted"
      ? theme.colors.borderHighlight
      : variant === "danger"
      ? theme.colors.alert
      : theme.colors.border;

  const backgroundColor =
    variant === "highlighted"
      ? theme.colors.cardHighlight
      : variant === "danger"
      ? theme.colors.cardDanger
      : theme.colors.card;

  const shadowStyle =
    variant === "highlighted"
      ? theme.shadows.glow
      : variant === "danger"
      ? theme.shadows.alertGlow
      : theme.shadows.soft;

  return (
    <View style={[styles.card, { borderColor, backgroundColor }, shadowStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
  },
});