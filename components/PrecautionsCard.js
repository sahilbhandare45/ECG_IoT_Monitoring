import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme/theme";
import GlassCard from "./GlassCard";

import { MEDICAL_ADVICE, HEALTH_THRESHOLDS } from "../constants/health";

export default function PrecautionsCard({ bpm }) {
  let config = MEDICAL_ADVICE.NORMAL;

  if (bpm < HEALTH_THRESHOLDS.LOW) {
    config = MEDICAL_ADVICE.LOW;
  } else if (bpm > HEALTH_THRESHOLDS.HIGH) {
    config = MEDICAL_ADVICE.HIGH;
  }

  const { status, advice, icon, precautions } = config;
  const color = bpm > HEALTH_THRESHOLDS.HIGH ? theme.colors.alert : 
                bpm < HEALTH_THRESHOLDS.LOW ? theme.colors.warning : 
                theme.colors.accent;

  return (
    <GlassCard variant={bpm > HEALTH_THRESHOLDS.HIGH ? "danger" : "default"} style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.statusText, { color }]}>{status}</Text>
      </View>
      <Text style={styles.adviceText}>{advice}</Text>
      
      <View style={styles.detailSection}>
        <Text style={styles.detailTitle}>DAILY PRECAUTIONS:</Text>
        {precautions.map((p, index) => (
          <Text key={index} style={styles.detailItem}>• {p}</Text>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    gap: 12,
  },
  statusText: {
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
  },
  adviceText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  detailSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  detailTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 2,
    marginBottom: theme.spacing.sm,
  },
  detailItem: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    lineHeight: 20,
  },
});
