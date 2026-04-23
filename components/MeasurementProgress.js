import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { theme } from "../theme/theme";

export default function MeasurementProgress({ progress, secondsRemaining }) {
  const percentage = Math.round(progress * 100);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MEASURING ECG...</Text>
        <Text style={styles.timer}>00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}</Text>
      </View>
      
      <View style={styles.barContainer}>
        <View style={[styles.progressBar, { width: `${percentage}%` }]} />
      </View>
      
      <Text style={styles.statusText}>
        Please stay still and breathe normally. {percentage}% complete.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 2,
  },
  timer: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.bold,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  barContainer: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    ...theme.shadows.glow,
  },
  statusText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    textAlign: "center",
    lineHeight: 18,
  },
});
