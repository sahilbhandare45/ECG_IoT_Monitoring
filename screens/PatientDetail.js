import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlassCard from "../components/GlassCard";
import BPMDisplay from "../components/BPMDisplay";
import StatusBadge from "../components/StatusBadge";
import ECGGraph from "../components/ECGGraph";
import PrimaryButton from "../components/PrimaryButton";
import { theme } from "../theme/theme";
import { subscribeToECG } from "../services/firebase";

export default function PatientDetail({ route, navigation }) {
  const { patientId } = route.params || { patientId: "patient_01" };

  const [bpm, setBpm] = useState(0);
  const [status, setStatus] = useState("IDLE");
  const [ecgChunk, setEcgChunk] = useState(null);
  const [pqrst, setPqrst] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    subscribeToECG((data) => {
      if (data) {
        setBpm(data.bpm || 0);
        setStatus(data.status || "IDLE");
        setEcgChunk(data.ecg_chunk || null);
        setPqrst(data.pqrst || null);
        setIsLive(true);
      }
    }, patientId);
  }, []);

  const isCritical = status === "CRITICAL" || status === "ALERT";

  return (
    <View style={styles.screen}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
        <View>
          <Text style={styles.caseLabel}>CASE #8829</Text>
          <Text style={styles.headerTitle}>Vital Ether</Text>
        </View>
        <View style={styles.liveStreamBadge}>
          <View style={styles.liveStreamDot} />
          <Text style={styles.liveStreamText}>Live Stream</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        {isCritical && (
          <View style={styles.criticalBadge}>
            <View style={styles.criticalDot} />
            <Text style={styles.criticalText}>CRITICAL: TACHYCARDIA ALERT</Text>
          </View>
        )}

        {/* Patient Info */}
        <Text style={styles.patientName}>Elena Rostova</Text>
        <Text style={styles.patientDetails}>
          42 Yrs • Female • Type II Monitoring • Device #ETH-092
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title="Message Patient"
              icon="mail-outline"
              variant="outline"
              size="small"
              onPress={() => {}}
            />
          </View>
          <View style={{ width: theme.spacing.sm }} />
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title="Request New Reading"
              icon="refresh"
              variant="primary"
              size="small"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Real-time Waveform */}
        <GlassCard>
          <View style={styles.waveHeader}>
            <View>
              <Text style={styles.waveTitle}>Real-time Waveform</Text>
              <Text style={styles.waveSub}>Lead II Visualization • V5</Text>
            </View>
          <Text style={styles.prInterval}>
            {pqrst?.pr_interval_ms ? `${(pqrst.pr_interval_ms / 1000).toFixed(2)}s PR Interval` : "-- PR Interval"}
          </Text>
          </View>
          <ECGGraph height={160} showTitle={false} showMetrics={false} liveChunk={ecgChunk} pqrst={pqrst} isReading={isLive} />
          <View style={styles.segmentRow}>
            <View style={styles.segmentItem}>
              <View style={[styles.segmentDot, { backgroundColor: theme.colors.accent }]} />
              <Text style={styles.segmentText}>ST-Segment Stable</Text>
            </View>
            <View style={styles.segmentItem}>
              <View style={[styles.segmentDot, { backgroundColor: theme.colors.alert }]} />
              <Text style={styles.segmentText}>Arrhythmia Detected</Text>
            </View>
          </View>
        </GlassCard>

        {/* Active Heart Rate */}
        <GlassCard style={styles.heartCard}>
          <Text style={styles.heartLabel}>ACTIVE HEART RATE</Text>
          <Text style={[styles.heartBpm, isCritical && { color: theme.colors.alert }]}>
            {bpm}
          </Text>
          <View style={styles.heartMeta}>
            <Text style={styles.heartUnit}>BPM</Text>
            <Ionicons
              name="heart"
              size={18}
              color={isCritical ? theme.colors.alert : theme.colors.primary}
            />
          </View>
          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(bpm / 1.5, 100)}%`,
                  backgroundColor: isCritical
                    ? theme.colors.alert
                    : theme.colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.latencyText}>Device latency: 24ms</Text>
        </GlassCard>

        {/* Neural Insights */}
        <GlassCard>
          <View style={styles.neuralHeader}>
            <Ionicons name="sparkles" size={18} color={theme.colors.primary} />
            <Text style={styles.neuralTitle}>Neural Insights</Text>
          </View>

          <View style={styles.insightBubble}>
            <Text style={styles.insightText}>
              Potential PVC detected in last 5 minutes. Trend suggests circadian
              rhythm mismatch.
            </Text>
            <Text style={styles.insightProb}>Probability: 94.2%</Text>
          </View>

          <View style={styles.recommendBubble}>
            <Text style={styles.recommendText}>
              Recommended: Review electrolyte levels (K+) and adjust titration.
            </Text>
          </View>
        </GlassCard>

        {/* Event Log */}
        <GlassCard>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle}>Event Log</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          {[
            {
              icon: "alert-circle",
              iconColor: theme.colors.alert,
              title: "Tachycardic Event",
              time: "Today, 14:22",
              bpm: 124,
              status: "Critical",
            },
            {
              icon: "checkmark-circle",
              iconColor: theme.colors.accent,
              title: "Manual Reading",
              time: "Yesterday, 09:15",
              bpm: 72,
              status: "Normal",
            },
            {
              icon: "moon",
              iconColor: theme.colors.secondary,
              title: "Resting Phase",
              time: "Oct 24, 02:30",
              bpm: 58,
              status: "Stable",
            },
          ].map((event, index) => (
            <View key={index} style={styles.eventItem}>
              <Ionicons name={event.icon} size={22} color={event.iconColor} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{event.title}</Text>
                <Text style={styles.eventTime}>{event.time}</Text>
              </View>
              <View style={styles.eventRight}>
                <Text style={styles.eventBpm}>{event.bpm} BPM</Text>
                <Text
                  style={[
                    styles.eventStatus,
                    {
                      color:
                        event.status === "Critical"
                          ? theme.colors.alert
                          : theme.colors.accent,
                    },
                  ]}
                >
                  {event.status}
                </Text>
              </View>
            </View>
          ))}
        </GlassCard>

        <View style={{ height: 40 }} />
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 50,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  caseLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    letterSpacing: 2,
    fontWeight: theme.fontWeight.semibold,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
  },
  liveStreamBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveStreamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  liveStreamText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.medium,
  },

  // Critical Badge
  criticalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 59, 92, 0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    alignSelf: "flex-start",
    marginBottom: theme.spacing.md,
  },
  criticalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.alert,
  },
  criticalText: {
    color: theme.colors.alert,
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
  },

  // Patient Info
  patientName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  patientDetails: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },

  // Actions
  actionRow: {
    flexDirection: "row",
    marginBottom: theme.spacing.lg,
  },

  // Waveform
  waveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },
  waveTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 2,
  },
  waveSub: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
  },
  prInterval: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.semibold,
  },
  segmentRow: {
    flexDirection: "row",
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  segmentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  segmentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  segmentText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
  },

  // Heart Rate
  heartCard: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  heartLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.micro,
    letterSpacing: 3,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.sm,
  },
  heartBpm: {
    color: theme.colors.primary,
    fontSize: 72,
    fontWeight: theme.fontWeight.black,
    letterSpacing: -2,
  },
  heartMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  heartUnit: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.medium,
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 2,
    marginBottom: theme.spacing.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  latencyText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    fontStyle: "italic",
  },

  // Neural Insights
  neuralHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  neuralTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.bold,
  },
  insightBubble: {
    backgroundColor: "rgba(123, 97, 255, 0.08)",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  insightText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    lineHeight: 22,
    marginBottom: 6,
  },
  insightProb: {
    color: theme.colors.warning,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.semibold,
  },
  recommendBubble: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  recommendText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    lineHeight: 20,
  },

  // Event Log
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  eventTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.bold,
  },
  viewAll: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: theme.spacing.lg,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: 2,
  },
  eventTime: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
  },
  eventRight: {
    alignItems: "flex-end",
  },
  eventBpm: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 2,
  },
  eventStatus: {
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.semibold,
  },
});