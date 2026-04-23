import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme/theme";

export default function BPMDisplay({ bpm, showLiveIndicator = false, size = "large" }) {
  const isLarge = size === "large";
  const displayValue = bpm != null ? bpm : "--";

  return (
    <View style={styles.container}>
      {showLiveIndicator && (
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE HEART RATE</Text>
        </View>
      )}

      <View style={styles.bpmRow}>
        <Text style={[styles.bpm, !isLarge && styles.bpmSmall]}>{displayValue}</Text>
        <View style={styles.bpmMeta}>
          <Text style={[styles.label, !isLarge && styles.labelSmall]}>BPM</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
    ...theme.shadows.glow,
  },
  liveText: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    letterSpacing: 3,
    fontWeight: theme.fontWeight.semibold,
  },
  bpmRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  bpm: {
    fontSize: 80,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.black,
    letterSpacing: -2,
  },
  bpmSmall: {
    fontSize: 48,
  },
  bpmMeta: {
    marginLeft: 4,
  },
  label: {
    color: theme.colors.primary,
    fontSize: theme.typography.h2,
    fontWeight: theme.fontWeight.medium,
    opacity: 0.7,
  },
  labelSmall: {
    fontSize: theme.typography.body,
  },
});