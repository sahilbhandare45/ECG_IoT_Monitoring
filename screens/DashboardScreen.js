import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Modal, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HeaderBar from "../components/HeaderBar";
import GlassCard from "../components/GlassCard";
import BPMDisplay from "../components/BPMDisplay";
import StatusBadge from "../components/StatusBadge";
import ECGGraph from "../components/ECGGraph";
import PrimaryButton from "../components/PrimaryButton";
import { theme } from "../theme/theme";
import { sendAlertNotification } from "../services/notifications";
import { subscribeToECG, subscribeToPatientPings } from "../services/firebase";

export default function DashboardScreen({ navigation }) {
  const [incomingPing, setIncomingPing] = useState(null);

  // Default values = null / IDLE until sensor data arrives
  const [bpm, setBpm] = useState(null);
  const [status, setStatus] = useState("IDLE");
  const [ecgChunk, setEcgChunk] = useState(null);
  const [pqrst, setPqrst] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToECG((data) => {
      if (data) {
        setBpm(data.bpm != null ? data.bpm : null);
        setStatus(data.status || "IDLE");
        setEcgChunk(data.ecg_chunk || null);
        setPqrst(data.pqrst || null);
        setIsLive(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for doctor pings (onChildAdded only fires for NEW pings)
  useEffect(() => {
    subscribeToPatientPings((ping) => {
      if (!ping) return;
      // Show in-app modal popup
      setTimeout(() => {
        setIncomingPing(ping);
      }, 500);
    });
  }, []);

  // NOTE: Alert screen is now triggered only AFTER the 30-second ECG analysis
  // completes in ECGScreen, not from raw live sensor data.

  return (
    <View style={styles.screen}>
      <HeaderBar />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* LIVE HEART RATE */}
        <GlassCard style={styles.mainCard}>
          <BPMDisplay bpm={bpm} showLiveIndicator={isLive} />
          <View style={styles.badgeCenter}>
            <StatusBadge status={status} />
          </View>
        </GlassCard>

        {/* ACTION BUTTONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            activeOpacity={0.75}
            onPress={() => navigation.navigate("ECG", { startReading: true })}
          >
            <View style={styles.actionIconPrimary}>
              <Ionicons name="play" size={18} color="#0A0F1C" />
            </View>
            <Text style={styles.actionTextPrimary}>Start{"\n"}Reading</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtnOutline} 
            activeOpacity={0.75}
            onPress={() => navigation.navigate("History")}
          >
            <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.actionTextOutline}>View Logs</Text>
          </TouchableOpacity>
        </View>

        {/* ECG PREVIEW - shows real data if live, otherwise flat line */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate("ECG")}>
          <GlassCard>
            <ECGGraph 
              liveChunk={ecgChunk}
              pqrst={pqrst}
              isReading={isLive}
            />
          </GlassCard>
        </TouchableOpacity>

        {/* HEALTH METRICS */}
        <Text style={styles.sectionTitle}>Health Metrics</Text>

        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("Insights")}>
          <GlassCard>
            <View style={styles.metricRow}>
              <View style={[styles.metricIcon, { backgroundColor: "rgba(123, 97, 255, 0.15)" }]}>
                <Ionicons name="heart" size={22} color={theme.colors.secondary} />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>Blood Pressure</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricValue}>118/76</Text>
                  <Text style={styles.metricUnit}>mmHg</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            </View>
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("Insights")}>
          <GlassCard>
            <View style={styles.metricRow}>
              <View style={[styles.metricIcon, { backgroundColor: "rgba(79, 255, 176, 0.15)" }]}>
                <Ionicons name="pulse" size={22} color={theme.colors.accent} />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>Oxygen Saturation</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricValue}>98</Text>
                  <Text style={styles.metricUnit}>% SpO2</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Emergency SOS Button */}
        <TouchableOpacity
          style={styles.testAlertBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Alert", { type: bpm > 100 ? "HIGH" : bpm < 50 ? "LOW" : "NORMAL", bpm: bpm })}
        >
          <Ionicons name="warning" size={18} color="#fff" />
          <Text style={styles.testAlertText}>Emergency SOS</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Premium Doctor Notification Modal */}
      <Modal
        visible={!!incomingPing}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Pulse ring decoration */}
            <View style={styles.pulseRing}>
              <View style={styles.pulseRingInner}>
                <Ionicons name="medkit" size={36} color="#4FFFB0" />
              </View>
            </View>

            {/* Badge */}
            <View style={styles.modalBadge}>
              <View style={styles.modalBadgeDot} />
              <Text style={styles.modalBadgeText}>LIVE CONNECTION</Text>
            </View>

            <Text style={styles.modalTitle}>Doctor Available</Text>
            <Text style={styles.modalSubtitle}>
              Dr. {incomingPing?.doctorName || "Your Doctor"}
            </Text>
            <Text style={styles.modalText}>
              has reviewed your ECG report and is available to assist you right now.
            </Text>
            
            {/* Doctor's phone number display */}
            {incomingPing?.doctorPhone && incomingPing.doctorPhone !== "N/A" && (
              <View style={{flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 8}}>
                <Ionicons name="call-outline" size={16} color="rgba(255,255,255,0.4)" />
                <Text style={{color: "rgba(255,255,255,0.5)", fontSize: 14, letterSpacing: 1}}>
                  {incomingPing.doctorPhone}
                </Text>
              </View>
            )}

            {/* Call Button */}
            <TouchableOpacity 
              style={styles.modalCallBtn} 
              activeOpacity={0.85}
              onPress={() => {
                const phoneNum = incomingPing?.doctorPhone && incomingPing.doctorPhone !== "N/A" 
                  ? incomingPing.doctorPhone 
                  : "0000000000";
                setIncomingPing(null);
                Linking.openURL(`tel:${phoneNum}`);
              }}
            >
              <View style={styles.modalCallIcon}>
                <Ionicons name="call" size={20} color="#0A0F1C" />
              </View>
              <Text style={styles.modalCallText}>Connect Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#0A0F1C" />
            </TouchableOpacity>
            
            {/* Dismiss */}
            <TouchableOpacity 
              style={styles.modalDismissBtn}
              activeOpacity={0.7}
              onPress={() => setIncomingPing(null)}
            >
              <Text style={styles.modalDismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  mainCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
  },
  badgeCenter: {
    marginTop: theme.spacing.md,
    alignItems: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.glow,
  },
  actionIconPrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTextPrimary: {
    color: "#0A0F1C",
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  actionTextOutline: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.semibold,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2,
    fontWeight: theme.fontWeight.bold,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    marginBottom: 4,
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  metricValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2,
    fontWeight: theme.fontWeight.bold,
  },
  metricUnit: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
  },
  testAlertBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: theme.spacing.lg,
    backgroundColor: "rgba(255, 59, 92, 0.15)",
    borderWidth: 1,
    borderColor: theme.colors.alert,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
  },
  testAlertText: {
    color: "#fff",
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 8, 18, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(79, 255, 176, 0.15)",
    shadowColor: "#4FFFB0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  pulseRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(79, 255, 176, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  pulseRingInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(79, 255, 176, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 255, 176, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  modalBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4FFFB0",
  },
  modalBadgeText: {
    color: "#4FFFB0",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4FFFB0",
    marginBottom: 8,
    textAlign: "center",
  },
  modalText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  modalCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#4FFFB0",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  modalCallIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCallText: {
    color: "#0A0F1C",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  modalDismissBtn: {
    marginTop: 16,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  modalDismissText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 15,
    fontWeight: "600",
  },
});