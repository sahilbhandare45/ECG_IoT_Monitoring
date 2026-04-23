import { View, Text, StyleSheet } from "react-native";
import { theme } from "../theme/theme";

export default function StatusBadge({ status }) {
  let bgColor = "rgba(79, 255, 176, 0.15)";
  let textColor = theme.colors.accent;

  let displayStatus = status;
  let upperStatus = status ? status.toUpperCase() : "";

  if (upperStatus.includes("IRREGULAR") || upperStatus.includes("AFIB")) {
    displayStatus = "AFIB";
    bgColor = "rgba(255, 176, 32, 0.15)";
    textColor = theme.colors.warning;
  } else if (upperStatus === "EMERGENCY" || upperStatus === "CRITICAL" || upperStatus === "ALERT" || upperStatus === "TACHYCARDIA") {
    bgColor = "rgba(255, 59, 92, 0.25)";
    textColor = theme.colors.alert;
  } else if (upperStatus === "WARNING") {
    bgColor = "rgba(255, 176, 32, 0.15)";
    textColor = theme.colors.warning;
  } else if (upperStatus === "RESTING") {
    bgColor = "rgba(122, 133, 153, 0.15)";
    textColor = theme.colors.textSecondary;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{displayStatus}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});