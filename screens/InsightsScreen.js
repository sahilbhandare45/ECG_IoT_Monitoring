import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HeaderBar from "../components/HeaderBar";
import GlassCard from "../components/GlassCard";
import InsightCard from "../components/InsightCard";
import { theme } from "../theme/theme";
import { subscribeToECG } from "../services/firebase";
import { HEALTH_THRESHOLDS } from "../constants/health";

export default function InsightsScreen() {
  const [bpm, setBpm] = useState(0);
  const [status, setStatus] = useState("IDLE");
  const [pqrst, setPqrst] = useState(null);

  useEffect(() => {
    subscribeToECG((data) => {
      if (data) {
        setBpm(data.bpm || 0);
        setStatus(data.status || "IDLE");
        setPqrst(data.pqrst || null);
      }
    });
  }, []); 

  const riskLevel = bpm > HEALTH_THRESHOLDS.HIGH ? "HIGH" : bpm < HEALTH_THRESHOLDS.LOW ? "MODERATE" : "LOW";
  const cardioStress = bpm > HEALTH_THRESHOLDS.HIGH ? 68 : bpm < HEALTH_THRESHOLDS.LOW ? 35 : 12;
  const confidenceScore = bpm > HEALTH_THRESHOLDS.CRITICAL_HIGH || bpm < HEALTH_THRESHOLDS.CRITICAL_LOW ? 72 : 98;
  const trendPercent = Math.round(((bpm - 72) / 72) * 100);
  const heroMessage = bpm === 0
    ? "Waiting for sensor data. Start a reading to see insights."
    : bpm > HEALTH_THRESHOLDS.HIGH
    ? "Elevated heart rate detected. Please take precautions."
    : bpm < HEALTH_THRESHOLDS.LOW
    ? "Low heart rate detected. Please rest and monitor."
    : "Heart health is optimal based on the last 24h";
  return (
    <View style={styles.screen}>
      <HeaderBar />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Label */}
        <View style={styles.labelRow}>
          <Ionicons name="sparkles" size={14} color={theme.colors.primary} />
          <Text style={styles.sectionLabel}>NEURAL ANALYSIS</Text>
        </View>

        {/* Hero Headline */}
        <Text style={styles.heroText}>
          {heroMessage}
        </Text>

        {/* Confidence Score */}
        <GlassCard>
          <View style={styles.confRow}>
            <View style={styles.confIcon}>
              <Ionicons name="shield-checkmark" size={20} color={theme.colors.accent} />
            </View>
            <View style={styles.confContent}>
              <Text style={styles.confLabel}>CONFIDENCE SCORE</Text>
              <Text style={styles.confValue}>{confidenceScore}% Accuracy</Text>
            </View>
          </View>
          <View style={styles.confBar}>
            <View style={[styles.confFill, { width: `${confidenceScore}%` }]} />
          </View>
        </GlassCard>

        {/* Condition Summary */}
        <GlassCard>
          <View style={styles.condHeader}>
            <Text style={styles.condTitle}>Rhythm Analysis</Text>
            <View style={styles.stableBadge}>
              <Text style={styles.stableText}>{status}</Text>
            </View>
          </View>
          {/* Chart placeholder bars */}
          <View style={styles.chartBars}>
            {[40, 55, 70, 80, 65, 50, 45].map((h, i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  { height: h, backgroundColor: i === 3 ? theme.colors.primary : theme.colors.textMuted },
                ]}
              />
            ))}
          </View>
          <Text style={styles.condDesc}>
            {status === "NORMAL" 
              ? "Sinus rhythm detected consistently. No instances of bradycardia or PVC clusters observed during active monitoring." 
              : "Anomalous rhythm detected. Please review detailed logs or consult a physician."}
          </Text>
        </GlassCard>

        {/* Two Column Cards */}
        <View style={styles.twoCol}>
          <GlassCard style={styles.colCard}>
            <Text style={styles.colLabel}>Live BPM</Text>
            <View style={styles.colValueRow}>
              <Text style={styles.colValue}>{bpm}</Text>
              <Text style={styles.colUnit}>BPM</Text>
            </View>
            <View style={styles.trendRow}>
              <Ionicons name={trendPercent >= 0 ? "trending-up" : "trending-down"} size={14} color={theme.colors.primary} />
              <Text style={styles.trendText}>{Math.abs(trendPercent)}% from avg</Text>
            </View>
          </GlassCard>

          <GlassCard style={styles.colCard}>
            <Text style={styles.colLabel}>Risk Profile</Text>
            <View style={[styles.riskCircle, riskLevel === "HIGH" && {borderColor: theme.colors.alert}, riskLevel === "MODERATE" && {borderColor: theme.colors.warning}]}>
              <Text style={styles.riskText}>{riskLevel}</Text>
            </View>
            <Text style={styles.riskLabel}>CARDIO STRESS {cardioStress}%</Text>
          </GlassCard>
        </View>

        {/* Precautions */}
        <GlassCard>
          <View style={styles.precautionHeader}>
            <View style={styles.precautionIcon}>
              <Ionicons name="add-circle" size={18} color={theme.colors.accent} />
            </View>
            <Text style={styles.precautionTitle}>Recommended Precautions</Text>
          </View>

          {[
            {
              title: "Maintain hydration levels",
              desc: "Optimal blood viscosity supports easier heart rhythm regulation.",
            },
            {
              title: "Avoid caffeine after 4 PM",
              desc: "Prevent nocturnal spikes that could disrupt deep sleep recovery.",
            },
            {
              title: "Scheduled mobility break",
              desc: "AI detected a 4-hour sedentary block. Stretch for 5 minutes.",
            },
          ].map((item, index) => (
            <View key={index} style={styles.precItem}>
              <View style={styles.precDot} />
              <View style={styles.precContent}>
                <Text style={styles.precItemTitle}>{item.title}</Text>
                <Text style={styles.precItemDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          AI ANALYSIS IS SUPPLEMENTARY AND NOT A MEDICAL DIAGNOSIS.
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },

  // Section Label
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  sectionLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 3,
  },

  // Hero
  heroText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 36,
    marginBottom: theme.spacing.lg,
  },

  // Confidence
  confRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  confIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(79, 255, 176, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  confContent: {
    flex: 1,
  },
  confLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.micro,
    letterSpacing: 2,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: 2,
  },
  confValue: {
    color: theme.colors.accent,
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.bold,
  },
  confBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 3,
    overflow: "hidden",
  },
  confFill: {
    height: 6,
    backgroundColor: theme.colors.accent,
    borderRadius: 3,
  },

  // Condition
  condHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  condTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.bold,
  },
  stableBadge: {
    backgroundColor: "rgba(79, 255, 176, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  stableText: {
    color: theme.colors.accent,
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1.5,
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 90,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  bar: {
    flex: 1,
    borderRadius: 4,
    opacity: 0.4,
  },
  condDesc: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },

  // Two Column
  twoCol: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  colCard: {
    flex: 1,
  },
  colLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.md,
  },
  colValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  colValue: {
    color: theme.colors.textPrimary,
    fontSize: 36,
    fontWeight: theme.fontWeight.bold,
  },
  colUnit: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: theme.spacing.sm,
  },
  trendText: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.semibold,
  },

  // Risk
  riskCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: theme.colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: theme.spacing.sm,
  },
  riskText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
  },
  riskLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.micro,
    letterSpacing: 2,
    textAlign: "center",
    fontWeight: theme.fontWeight.semibold,
  },

  // Precautions
  precautionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: theme.spacing.lg,
  },
  precautionIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    backgroundColor: "rgba(79, 255, 176, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  precautionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.bold,
  },
  precItem: {
    flexDirection: "row",
    gap: 14,
    marginBottom: theme.spacing.lg,
  },
  precDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: 6,
  },
  precContent: {
    flex: 1,
  },
  precItemTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 4,
  },
  precItemDesc: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    lineHeight: 20,
  },

  // Disclaimer
  disclaimer: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    letterSpacing: 2,
    textAlign: "center",
    marginTop: theme.spacing.lg,
    lineHeight: 16,
  },
});