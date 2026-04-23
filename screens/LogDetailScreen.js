import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import HeaderBar from "../components/HeaderBar";
import GlassCard from "../components/GlassCard";
import StatusBadge from "../components/StatusBadge";
import ECGGraph from "../components/ECGGraph";
import PrecautionsCard from "../components/PrecautionsCard";
import { theme } from "../theme/theme";

export default function LogDetailScreen({ route, navigation }) {
  // If no params passed, provide fallback data
  const { item } = route.params || { 
    item: { bpm: 0, avgBpm: 0, status: "IDLE", time: "Unknown Time" } 
  };
  
  const bpm = item.avgBpm || item.bpm || 0;
  const status = item.status || "NORMAL";
  const pqrst = item.pqrst || null;
  const isEmergency = status === "EMERGENCY";
  const isAnomalous = isEmergency || status === "TACHYCARDIA" || status === "BRADYCARDIA" || 
                      status === "ALERT" || status.includes("BLOCK") || status.includes("IRREGULAR");

  const generatePDFReport = async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1a1a2e; }
            .header { text-align: center; border-bottom: 2px solid #e1e4e8; padding-bottom: 20px; margin-bottom: 30px; }
            .hospital-name { font-size: 28px; font-weight: bold; color: #0F172A; letter-spacing: 1px; margin: 0; }
            .report-title { font-size: 18px; color: #64748B; margin-top: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .box { background: #f8fafc; padding: 20px; border-radius: 12px; width: 45%; border: 1px solid #e2e8f0; }
            .label { font-size: 12px; color: #64748B; font-weight: bold; letter-spacing: 1px; }
            .value { font-size: 20px; color: #0F172A; font-weight: bold; margin-top: 5px; }
            .value.alert { color: #E11D48; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            th { background-color: #f8fafc; font-size: 12px; color: #64748B; letter-spacing: 1px; }
            .footer { margin-top: 50px; font-size: 12px; color: #94A3B8; text-align: center; border-top: 1px solid #e1e4e8; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="hospital-name">VitalEther Cardiology</h1>
            <p class="report-title">Official ECG & Cardiac Analysis Report</p>
          </div>

          <div class="row">
            <div class="box">
              <div class="label">PATIENT ID</div>
              <div class="value">${item.patientName || item._dbPatientId || "Unknown Patient"}</div>
            </div>
            <div class="box">
              <div class="label">DATE & TIME</div>
              <div class="value">${item.time || "Unknown Time"}</div>
            </div>
          </div>

          <div class="row">
            <div class="box">
              <div class="label">AVERAGE HEART RATE</div>
              <div class="value ${isAnomalous ? 'alert' : ''}">${bpm} BPM</div>
            </div>
            <div class="box">
              <div class="label">CLINICAL DIAGNOSIS</div>
              <div class="value ${isAnomalous ? 'alert' : ''}">${status}</div>
            </div>
          </div>

          ${pqrst ? `
          <h3 style="margin-top: 40px; color: #0F172A; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">PQRST Interval Analysis</h3>
          <table>
            <tr>
              <th>INTERVAL</th>
              <th>DURATION (ms)</th>
              <th>AMPLITUDE (mV)</th>
            </tr>
            <tr>
              <td>PR Interval</td>
              <td>${pqrst.pr_interval_ms ? Math.round(pqrst.pr_interval_ms) : "—"}</td>
              <td>P-Wave: ${pqrst.p_amplitude ? pqrst.p_amplitude.toFixed(2) : "—"}</td>
            </tr>
            <tr>
              <td>QRS Complex</td>
              <td>${pqrst.qrs_duration_ms ? Math.round(pqrst.qrs_duration_ms) : "—"}</td>
              <td>R-Peak: ${pqrst.r_amplitude ? pqrst.r_amplitude.toFixed(2) : "—"}</td>
            </tr>
            <tr>
              <td>QT Interval</td>
              <td>${pqrst.qt_interval_ms ? Math.round(pqrst.qt_interval_ms) : "—"}</td>
              <td>T-Wave: ${pqrst.t_amplitude ? pqrst.t_amplitude.toFixed(2) : "—"}</td>
            </tr>
            <tr>
              <td>Heart Rate Variability (RR)</td>
              <td>${pqrst.rr_variability_ms ? pqrst.rr_variability_ms.toFixed(1) : "—"}</td>
              <td>—</td>
            </tr>
          </table>
          ` : '<p style="color: #64748B; margin-top: 20px;">No advanced PQRST metrics captured during this read.</p>'}

          <div class="footer">
            <p>Generated digitally via VitalEther Medical Systems.</p>
            <p>Disclaimer: This report is generated by a heuristic IoT sensor platform for screening purposes. A certified physician must verify all findings.</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error("PDF Export error:", error);
      Alert.alert("Export Error", "Could not generate PDF report.");
    }
  };

  return (
    <View style={styles.screen}>
      <HeaderBar />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Navigation */}
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          <Text style={styles.backText}>Back to Logs</Text>
        </TouchableOpacity>

        {/* Log Title */}
        <Text style={styles.title}>Monitoring Session</Text>
        <Text style={styles.subtitle}>{item.time || "Unknown Time"}</Text>

        {/* Session Snapshot Card */}
        <GlassCard variant={isEmergency ? "danger" : (isAnomalous ? "highlighted" : "default")}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.label}>AVG BPM</Text>
              <View style={styles.bpmRow}>
                <Text style={[styles.bpmValue, isAnomalous && { color: theme.colors.alert }]}>
                  {bpm}
                </Text>
                <Text style={styles.bpmUnit}>BPM</Text>
              </View>
            </View>
            <StatusBadge status={status} />
          </View>
        </GlassCard>

        {/* BPM Range Card */}
        {(item.minBpm != null || item.maxBpm != null) && (
          <GlassCard>
            <Text style={styles.sectionLabel}>BPM RANGE</Text>
            <View style={styles.rangeRow}>
              <View style={styles.rangeItem}>
                <Text style={styles.rangeLabel}>MIN</Text>
                <Text style={styles.rangeValue}>{item.minBpm || 0}</Text>
              </View>
              <View style={styles.rangeDivider} />
              <View style={styles.rangeItem}>
                <Text style={styles.rangeLabel}>AVG</Text>
                <Text style={[styles.rangeValue, { color: theme.colors.primary }]}>{bpm}</Text>
              </View>
              <View style={styles.rangeDivider} />
              <View style={styles.rangeItem}>
                <Text style={styles.rangeLabel}>MAX</Text>
                <Text style={styles.rangeValue}>{item.maxBpm || 0}</Text>
              </View>
            </View>
            {item.totalReadings && (
              <Text style={styles.readingCount}>
                Based on {item.totalReadings} readings over {item.duration || 30}s
              </Text>
            )}
          </GlassCard>
        )}

        {/* PQRST Intervals Card */}
        {pqrst && (
          <>
            <Text style={styles.sectionTitle}>PQRST Analysis</Text>
            <GlassCard>
              <View style={styles.pqrstGrid}>
                <View style={styles.pqrstItem}>
                  <Text style={styles.pqrstLabel}>PR INTERVAL</Text>
                  <Text style={styles.pqrstValue}>
                    {pqrst.pr_interval_ms ? `${Math.round(pqrst.pr_interval_ms)}ms` : "—"}
                  </Text>
                </View>
                <View style={styles.pqrstItem}>
                  <Text style={styles.pqrstLabel}>QRS DURATION</Text>
                  <Text style={styles.pqrstValue}>
                    {pqrst.qrs_duration_ms ? `${Math.round(pqrst.qrs_duration_ms)}ms` : "—"}
                  </Text>
                </View>
                <View style={styles.pqrstItem}>
                  <Text style={styles.pqrstLabel}>QT INTERVAL</Text>
                  <Text style={styles.pqrstValue}>
                    {pqrst.qt_interval_ms ? `${Math.round(pqrst.qt_interval_ms)}ms` : "—"}
                  </Text>
                </View>
                <View style={styles.pqrstItem}>
                  <Text style={styles.pqrstLabel}>RR INTERVAL</Text>
                  <Text style={styles.pqrstValue}>
                    {pqrst.rr_interval_ms ? `${Math.round(pqrst.rr_interval_ms)}ms` : "—"}
                  </Text>
                </View>
                <View style={styles.pqrstItem}>
                  <Text style={styles.pqrstLabel}>ST SEGMENT</Text>
                  <Text style={styles.pqrstValue}>
                    {pqrst.st_segment_ms ? `${Math.round(pqrst.st_segment_ms)}ms` : "—"}
                  </Text>
                </View>
                <View style={styles.pqrstItem}>
                  <Text style={styles.pqrstLabel}>RR VARIABILITY</Text>
                  <Text style={styles.pqrstValue}>
                    {pqrst.rr_variability_ms ? `${pqrst.rr_variability_ms}ms` : "—"}
                  </Text>
                </View>
              </View>

              {/* Amp row */}
              {(pqrst.p_amplitude || pqrst.r_amplitude || pqrst.t_amplitude) && (
                <View style={styles.ampSection}>
                  <Text style={styles.ampTitle}>WAVE AMPLITUDES</Text>
                  <View style={styles.ampRow}>
                    {pqrst.p_amplitude != null && (
                      <View style={styles.ampItem}>
                        <Text style={styles.ampLabel}>P</Text>
                        <Text style={styles.ampValue}>{pqrst.p_amplitude.toFixed(1)}</Text>
                      </View>
                    )}
                    {pqrst.r_amplitude != null && (
                      <View style={styles.ampItem}>
                        <Text style={styles.ampLabel}>R</Text>
                        <Text style={styles.ampValue}>{pqrst.r_amplitude.toFixed(1)}</Text>
                      </View>
                    )}
                    {pqrst.t_amplitude != null && (
                      <View style={styles.ampItem}>
                        <Text style={styles.ampLabel}>T</Text>
                        <Text style={styles.ampValue}>{pqrst.t_amplitude.toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </GlassCard>
          </>
        )}

        {/* Waveform Snapshot (Static ECG) */}
        <Text style={styles.sectionTitle}>Waveform Snapshot</Text>
        <GlassCard style={styles.graphCard}>
          <ECGGraph height={220} showTitle={false} showMetrics={false} isReading={false} />
        </GlassCard>

        {/* Medical Context */}
        <Text style={styles.sectionTitle}>Medical Context</Text>
        <PrecautionsCard bpm={bpm} />

        {/* End Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.secondaryBtn} 
            activeOpacity={0.8}
            onPress={generatePDFReport}
          >
            <Ionicons name="share-outline" size={20} color={theme.colors.textPrimary} />
            <Text style={styles.secondaryBtnText}>Export PDF</Text>
          </TouchableOpacity>

          {isAnomalous && (
            <TouchableOpacity 
              style={styles.primaryBtnAction} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate("Alert", { type: isEmergency ? "HIGH" : "WARNING" })}
            >
              <Ionicons name="warning" size={20} color="#0A0F1C" />
              <Text style={styles.primaryBtnText}>View Alert</Text>
            </TouchableOpacity>
          )}
        </View>

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
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  backText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    marginBottom: theme.spacing.xl,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  bpmRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  bpmValue: {
    color: theme.colors.textPrimary,
    fontSize: 48,
    fontWeight: theme.fontWeight.black,
  },
  bpmUnit: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.medium,
  },

  // Section
  sectionLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    letterSpacing: 2,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2,
    fontWeight: theme.fontWeight.bold,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },

  // Range
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: theme.spacing.sm,
  },
  rangeItem: {
    alignItems: "center",
    flex: 1,
  },
  rangeLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    letterSpacing: 1.5,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 4,
  },
  rangeValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1,
    fontWeight: theme.fontWeight.bold,
  },
  rangeDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
  },
  readingCount: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    textAlign: "center",
    letterSpacing: 0.5,
    marginTop: theme.spacing.xs,
  },

  // PQRST
  pqrstGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  pqrstItem: {
    width: "47%",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
  },
  pqrstLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    letterSpacing: 1.5,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 4,
  },
  pqrstValue: {
    color: theme.colors.primary,
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.bold,
  },

  // Amplitudes
  ampSection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  ampTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.micro,
    letterSpacing: 2,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.md,
  },
  ampRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  ampItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
  },
  ampLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: 2,
  },
  ampValue: {
    color: theme.colors.accent,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
  },

  // Graph
  graphCard: {
    padding: 0,
    overflow: "hidden",
  },

  // Actions
  actionRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
  },
  secondaryBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
  },
  primaryBtnAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.warning,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
  },
  primaryBtnText: {
    color: "#0A0F1C",
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
  },
});
