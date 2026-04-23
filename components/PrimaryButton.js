import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme/theme";

export default function PrimaryButton({
  title,
  onPress,
  icon,
  variant = "primary",
  size = "default",
}) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const isOutline = variant === "outline";
  const isSmall = size === "small";

  const buttonStyles = [
    styles.button,
    isSmall && styles.buttonSmall,
    isPrimary && styles.primaryBg,
    isDanger && styles.dangerBg,
    isOutline && styles.outlineBg,
  ];

  const textStyles = [
    styles.text,
    isSmall && styles.textSmall,
    isPrimary && styles.primaryText,
    isDanger && styles.dangerText,
    isOutline && styles.outlineText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={isSmall ? 16 : 20}
          color={isPrimary ? "#0A0F1C" : isDanger ? "#FFF" : theme.colors.textSecondary}
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    padding: 16,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSmall: {
    padding: 12,
    borderRadius: theme.radius.sm,
  },
  primaryBg: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.glow,
  },
  dangerBg: {
    backgroundColor: theme.colors.alert,
    ...theme.shadows.alertGlow,
  },
  outlineBg: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  text: {
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.5,
  },
  textSmall: {
    fontSize: theme.typography.caption,
  },
  primaryText: {
    color: "#0A0F1C",
  },
  dangerText: {
    color: "#FFFFFF",
  },
  outlineText: {
    color: theme.colors.textSecondary,
  },
});