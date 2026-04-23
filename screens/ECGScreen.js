import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HeaderBar from "../components/HeaderBar";
import GlassCard from "../components/GlassCard";
import ECGGraph from "../components/ECGGraph";
import { theme } from "../theme/theme";
import { subscribeToECG, saveAnalysisLog, pushDoctorAlert, auth } from "../services/firebase";
import PrecautionsCard from "../components/PrecautionsCard";
import MeasurementProgress from "../components/MeasurementProgress";
import { TouchableOpacity, Platform } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { MOCK_PATIENT } from "../constants/health";

const MEASUREMENT_DURATION = 30; // 30 seconds

export default function ECGScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  // Default values = 0 / IDLE until sensor data arrives
  const [bpm, setBpm] = useState(0);
  const [status, setStatus] = useState("IDLE");
  const [ecgChunk, setEcgChunk] = useState(null);
  const [pqrst, setPqrst] = useState(null);

  const [isReading, setIsReading] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(MEASUREMENT_DURATION);
  const [isComplete, setIsComplete] = useState(false);

  // Frozen analysis results — locked when 30s analysis completes
  const [frozenResult, setFrozenResult] = useState(null);
  const [patient, setPatient] = useState({
    ...MOCK_PATIENT,
    name: auth.currentUser?.displayName || "Unknown Patient",
  });

  // 30-second analysis accumulator
  const analysisRef = useRef({
    bpmReadings: [],
    lastPqrst: null,
    lastStatus: "IDLE",
    startTime: null,
  });

  useEffect(() => {
    if (route.params?.startReading) {
      handleStartReading();
    }
  }, [route.params?.startReading]);

  // Countdown timer
  useEffect(() => {
    let interval;
    if (isReading && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isReading && secondsRemaining === 0) {
      handleAnalysisComplete();
    }
    return () => clearInterval(interval);
  }, [isReading, secondsRemaining]);

  // Ref to always have current isReading value inside callbacks (avoids stale closures)
  const isReadingRef = useRef(false);
  useEffect(() => {
    isReadingRef.current = isReading;
  }, [isReading]);

  // Always cache the latest Firebase data so we can instantly show it on Start
  const latestDataRef = useRef({ bpm: 0, status: "IDLE", ecgChunk: null, pqrst: null });

  // Subscribe to Firebase live data ONCE on mount
  useEffect(() => {
    const unsubscribe = subscribeToECG((data) => {
      if (data) {
        const newBpm = data.bpm || 0;
        const newStatus = data.status || "IDLE";
        const newChunk = data.ecg_chunk || null;
        const newPqrst = data.pqrst || null;

        // Always cache latest data for instant start
        latestDataRef.current = { bpm: newBpm, status: newStatus, ecgChunk: newChunk, pqrst: newPqrst };

        // Only update live display values while actively reading
        if (isReadingRef.current) {
          setBpm(newBpm);
          setStatus(newStatus);
          setEcgChunk(newChunk);
          setPqrst(newPqrst);
        }

        // Accumulate data during active reading
        if (isReadingRef.current && newBpm > 0) {
          analysisRef.current.bpmReadings.push(newBpm);
          analysisRef.current.lastPqrst = newPqrst;
          analysisRef.current.lastStatus = newStatus;
        }
      }
    });
    // Cleanup: remove listener when component unmounts
    return () => unsubscribe();
  }, []);

  const handleStartReading = () => {
    // Reset analysis accumulator
    analysisRef.current = {
      bpmReadings: [],
      lastPqrst: null,
      lastStatus: "IDLE",
      startTime: Date.now(),
    };
    setFrozenResult(null);

    // INSTANTLY populate display from cached Firebase data (zero delay)
    const cached = latestDataRef.current;
    setBpm(cached.bpm);
    setStatus(cached.status);
    setEcgChunk(cached.ecgChunk);
    setPqrst(cached.pqrst);

    // Set ref SYNCHRONOUSLY so Firebase callbacks continue updating immediately
    isReadingRef.current = true;
    setIsReading(true);
    setIsComplete(false);
    setSecondsRemaining(MEASUREMENT_DURATION);
  };

  const handleStopReading = () => {
    isReadingRef.current = false;
    setIsReading(false);
    setSecondsRemaining(MEASUREMENT_DURATION);
  };

  const handleAnalysisComplete = async () => {
    // Stop live updates SYNCHRONOUSLY before any state changes
    isReadingRef.current = false;
    setIsReading(false);
    setIsComplete(true);

    const { bpmReadings, lastPqrst, lastStatus, startTime } = analysisRef.current;

    // Calculate analysis summary
    const avgBpm = bpmReadings.length > 0
      ? Math.round(bpmReadings.reduce((a, b) => a + b, 0) / bpmReadings.length)
      : 0;
    const minBpm = bpmReadings.length > 0 ? Math.min(...bpmReadings) : 0;
    const maxBpm = bpmReadings.length > 0 ? Math.max(...bpmReadings) : 0;
    // Last captured BPM for smooth display transition (no sudden jump)
    const lastBpm = bpmReadings.length > 0 ? bpmReadings[bpmReadings.length - 1] : 0;

    // Freeze the analysis results so they don't update from live data
    setFrozenResult({
      avgBpm,
      minBpm,
      maxBpm,
      lastBpm,
      totalReadings: bpmReadings.length,
      status: lastStatus || status,
    });

    const logEntry = {
      timestamp: Date.now(),
      startTime: startTime,
      duration: MEASUREMENT_DURATION,
      avgBpm,
      minBpm,
      maxBpm,
      status: lastStatus || status,
      pqrst: lastPqrst || null,
      totalReadings: bpmReadings.length,
      patientId: patient.id,
      patientName: patient.name,
    };

    // Save to Firebase securely under the patient's actual UID!
    try {
      const targetUid = auth.currentUser?.uid || "patient_01";
      await saveAnalysisLog(logEntry, targetUid);
      console.log("[ANALYSIS] 30s log saved for patient:", targetUid);
      
      // Push every log to the doctor portal feed
      let alertType = "NORMAL";
      const finalStatus = (logEntry.status || "").toUpperCase();

      if (avgBpm >= 100 || finalStatus.includes("TACHYCARDIA")) {
        alertType = "HIGH";
      } else if ((avgBpm > 0 && avgBpm <= 60) || finalStatus.includes("BRADYCARDIA")) {
        alertType = "LOW";
      } else if (finalStatus !== "NORMAL" && finalStatus !== "IDLE" && finalStatus !== "RESTING" && finalStatus !== "STABLE") {
        alertType = "CRITICAL"; // catch-all for AFIB, blocks, etc.
      }
      
      await pushDoctorAlert({
        ...logEntry,
        alertType,
        isRead: false
      });

      // Navigate to Alert screen ONLY after analysis is complete and BPM is abnormal
      if (alertType === "HIGH" || alertType === "LOW") {
        navigation.navigate("Alert", { type: alertType, bpm: avgBpm });
      }
    } catch (error) {
      console.error("[ANALYSIS] Failed to save log:", error);
      Alert.alert("Save Error", "Could not save analysis log. Please check your connection.");
    }
  };

  // Values to display:
  // - During reading: show live sensor data (updates in real-time)
  // - After analysis: show last captured BPM (smooth transition, no sudden jump)
  // - Idle: show 0 / IDLE
  const displayBpm = isReading ? bpm : isComplete && frozenResult ? frozenResult.lastBpm : 0;
  const displayStatus = isReading ? status : isComplete && frozenResult ? frozenResult.status : "IDLE";

  return (
    <View style={styles.screen}>
      <HeaderBar />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Section: LIVE badge + BPM card */}
        <View style={styles.topSection}>
          <View style={styles.topLeft}>
            {/* LIVE Badge */}
            <View style={styles.liveBadge}>
              <View style={[styles.liveDot, isReading && styles.liveDotActive]} />
              <Text style={styles.liveText}>
                {isReading ? "SCANNING" : isComplete ? "COMPLETE" : "IDLE"}
              </Text>
            </View>
            <Text style={styles.cardiacLabel}>CARDIAC RHYTHM</Text>
          </View>

          {/* BPM Card */}
          <GlassCard style={styles.bpmCard}>
            <View style={styles.bpmContent}>
              <View style={styles.bpmRow}>
                <Text style={styles.bpmNumber}>{displayBpm}</Text>
                <Text style={styles.bpmUnit}>BPM</Text>
              </View>
              <View style={styles.stableRow}>
                <Ionicons name="heart" size={14} color={
                  displayStatus === "IDLE" ? theme.colors.textMuted : theme.colors.primary
                } />
                <Text style={[styles.stableText, 
                  displayStatus === "IDLE" && { color: theme.colors.textMuted }
                ]}>
                  {displayStatus}
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Full ECG Graph — real sensor data or flat line */}
        <GlassCard style={styles.ecgCard}>
          <ECGGraph
            height={280}
            showTitle={false}
            showMetrics={false}
            liveChunk={ecgChunk}
            pqrst={pqrst}
            isReading={isReading}
          />
        </GlassCard>

        {/* PQRST Metrics Row */}
        <View style={styles.pqrstRow}>
          <View style={styles.pqrstItem}>
            <Text style={styles.pqrstLabel}>PR</Text>
            <Text style={[styles.pqrstValue, !isReading && styles.pqrstIdle]}>
              {isReading && pqrst?.pr_interval_ms
                ? `${Math.round(pqrst.pr_interval_ms)}ms`
                : "0ms"}
            </Text>
          </View>
          <View style={styles.pqrstItem}>
            <Text style={styles.pqrstLabel}>QRS</Text>
            <Text style={[styles.pqrstValue, !isReading && styles.pqrstIdle]}>
              {isReading && pqrst?.qrs_duration_ms
                ? `${Math.round(pqrst.qrs_duration_ms)}ms`
                : "0ms"}
            </Text>
          </View>
          <View style={styles.pqrstItem}>
            <Text style={styles.pqrstLabel}>QT</Text>
            <Text style={[styles.pqrstValue, !isReading && styles.pqrstIdle]}>
              {isReading && pqrst?.qt_interval_ms
                ? `${Math.round(pqrst.qt_interval_ms)}ms`
                : "0ms"}
            </Text>
          </View>
          <View style={styles.pqrstItem}>
            <Text style={styles.pqrstLabel}>RR</Text>
            <Text style={[styles.pqrstValue, !isReading && styles.pqrstIdle]}>
              {isReading && pqrst?.rr_interval_ms
                ? `${Math.round(pqrst.rr_interval_ms)}ms`
                : "0ms"}
            </Text>
          </View>
        </View>

        {/* Start/Stop Reading Button */}
        {!isComplete && (
          <TouchableOpacity 
            style={[styles.actionButton, isReading && styles.actionButtonActive]}
            onPress={isReading ? handleStopReading : handleStartReading}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isReading ? "stop-circle" : "play-circle"} 
              size={24} 
              color="#0A0F1C" 
            />
            <Text style={styles.actionButtonText}>
              {isReading ? "CANCEL ANALYSIS" : "START 30S ANALYSIS"}
            </Text>
          </TouchableOpacity>
        )}

        {isComplete && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleStartReading}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-circle" size={24} color="#0A0F1C" />
            <Text style={styles.actionButtonText}>RE-ANALYZE ECG</Text>
          </TouchableOpacity>
        )}

        {/* Measuring Progress UI */}
        {isReading && (
          <MeasurementProgress 
            secondsRemaining={secondsRemaining} 
            progress={(MEASUREMENT_DURATION - secondsRemaining) / MEASUREMENT_DURATION} 
          />
        )}

        {/* Analysis Complete Section — uses frozen values */}
        {isComplete && frozenResult && (
          <View style={styles.detailsSection}>
            <View style={styles.resultHeader}>
              <Text style={styles.detailsTitle}>ANALYSIS COMPLETE</Text>
              <Text style={styles.patientInfo}>Patient: {patient.name} • {patient.gender}, {patient.age}y</Text>
            </View>

            {/* Analysis Summary Card — frozen values from analysis period */}
            <GlassCard>
              <Text style={styles.summaryTitle}>30-Second Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>AVG BPM</Text>
                  <Text style={styles.summaryValue}>
                    {frozenResult.avgBpm}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>MIN BPM</Text>
                  <Text style={styles.summaryValue}>
                    {frozenResult.minBpm}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>MAX BPM</Text>
                  <Text style={styles.summaryValue}>
                    {frozenResult.maxBpm}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>READINGS</Text>
                  <Text style={styles.summaryValue}>
                    {frozenResult.totalReadings}
                  </Text>
                </View>
              </View>
            </GlassCard>

            <PrecautionsCard bpm={frozenResult.avgBpm} />
          </View>
        )}

        {/* Tech Specs Row */}
        {!isReading && (
          <View style={styles.specsRow}>
            <View>
              <Text style={styles.specText}>LEAD II • 25MM/S</Text>
              <Text style={styles.specText}>GAIN: 10MM/MV</Text>
            </View>
            <View style={styles.specsRight}>
              <Text style={styles.specText}>SPO2: 98%</Text>
              <Text style={styles.specText}>RESP: 16 BRPM</Text>
            </View>
          </View>
        )}

        {/* Neural Trends Card */}
        <GlassCard>
          <View style={styles.trendRow}>
            <View style={styles.trendIconContainer}>
              <Ionicons name="analytics" size={22} color={theme.colors.secondary} />
            </View>
            <View style={styles.trendContent}>
              <Text style={styles.trendTitle}>Neural Trends</Text>
              <Text style={styles.trendDesc}>
                {isComplete
                  ? "Analysis saved to history logs"
                  : "No anomalies detected in last 4h"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </View>
        </GlassCard>

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

  // Top section
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.lg,
  },
  topLeft: {
    flex: 1,
    paddingTop: theme.spacing.sm,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 255, 176, 0.1)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    alignSelf: "flex-start",
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  liveText: {
    color: theme.colors.accent,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 2,
  },
  cardiacLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 3,
  },

  // BPM Card
  bpmCard: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    marginBottom: 0,
    alignItems: "center",
    minWidth: 140,
  },
  bpmContent: {
    alignItems: "center",
  },
  bpmRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  bpmNumber: {
    fontSize: 52,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
    letterSpacing: -1,
  },
  bpmUnit: {
    fontSize: theme.typography.h3,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    marginLeft: 4,
  },
  stableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: theme.spacing.xs,
  },
  stableText: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 2,
  },

  // ECG Card
  ecgCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: "hidden",
  },

  // PQRST Row
  pqrstRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  pqrstItem: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  pqrstLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.micro,
    letterSpacing: 1,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: 2,
  },
  pqrstValue: {
    color: theme.colors.primary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
  },
  pqrstIdle: {
    color: theme.colors.textMuted,
  },

  // Action Button
  actionButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  actionButtonActive: {
    backgroundColor: theme.colors.alert,
  },
  actionButtonText: {
    color: "#0A0F1C",
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
  },

  // Details Section
  detailsSection: {
    marginBottom: theme.spacing.lg,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    paddingHorizontal: 4,
  },
  detailsTitle: {
    color: theme.colors.accent,
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 2,
  },
  patientInfo: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.semibold,
  },

  // Summary Card
  summaryTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.md,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  summaryItem: {
    flex: 1,
    minWidth: "40%",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    alignItems: "center",
  },
  summaryLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.micro,
    letterSpacing: 1.5,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: 4,
  },
  summaryValue: {
    color: theme.colors.primary,
    fontSize: theme.typography.h2,
    fontWeight: theme.fontWeight.bold,
  },

  liveDotActive: {
    backgroundColor: theme.colors.alert,
  },

  // Tech Specs
  specsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xs,
  },
  specsRight: {
    alignItems: "flex-end",
  },
  specText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 2,
    lineHeight: 18,
  },

  // Neural Trends
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  trendIconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.sm,
    backgroundColor: "rgba(123, 97, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  trendContent: {
    flex: 1,
  },
  trendTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 4,
  },
  trendDesc: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
  },
});