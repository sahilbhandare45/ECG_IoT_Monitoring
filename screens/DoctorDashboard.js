import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HeaderBar from "../components/HeaderBar";
import GlassCard from "../components/GlassCard";
import StatusBadge from "../components/StatusBadge";
import ECGGraph from "../components/ECGGraph";
import { theme } from "../theme/theme";
import { subscribeToAllPatients, auth, subscribeToDoctorAlerts, pushCallNotification, getDoctorPhone } from "../services/firebase";

const MOCK_PATIENTS = [
  {
    id: "patient_01",
    name: "Sahil",
    patientId: "#VE-9921",
    bpm: 114,
    status: "CRITICAL",
    lastUpdate: "2M AGO",
  },
  {
    id: "patient_02",
    name: "Aditya Khandekar",
    patientId: "#VE-4481",
    bpm: 72,
    status: "NORMAL",
    lastUpdate: "14M AGO",
  },
  {
    id: "patient_03",
    name: "Atharva Jadhav",
    patientId: "#VE-1029",
    bpm: 58,
    status: "RESTING",
    lastUpdate: "1H AGO",
  },
  {
    id: "patient_04",
    name: "Sahil Bhandare",
    patientId: "#VE-1122",
    bpm: 60,
    status: "NORMAL",
    lastUpdate: "10M AGO",
  },
];

export default function DoctorDashboard({ navigation }) {
  const [patients, setPatients] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [selectedAlertToPing, setSelectedAlertToPing] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [doctorPhone, setDoctorPhone] = useState("");

  // Fetch doctor's phone number on mount
  useEffect(() => {
    const fetchPhone = async () => {
      if (auth.currentUser) {
        const phone = await getDoctorPhone(auth.currentUser.uid);
        if (phone) setDoctorPhone(phone);
      }
    };
    fetchPhone();
  }, []);

  useEffect(() => {
    subscribeToAllPatients((data) => {
      if (data) setPatients(data);
    });
  }, []);

  useEffect(() => {
    subscribeToDoctorAlerts((data) => {
      setAlerts(data);
    });
  }, []);

  // Update current time every 10 seconds to refresh alert visibility 
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Merge firebase data with mock names
  const patientList = MOCK_PATIENTS.map((mock, index) => {
    const fbData = patients[mock.id];
    // Backend writes to live_stream sub-node
    const liveData = fbData?.live_stream || fbData;
    
    let name = mock.name;
    // Map index 0 to whatever the Active Patient is
    if (index === 0 && alerts.length > 0 && alerts[0].patientName) {
      name = alerts[0].patientName;
    }

    let bpm = liveData?.bpm || mock.bpm;
    let status = liveData?.status || mock.status;

    // Remove AFIB and rely solely on BPM
    if (bpm > 100) status = "TACHYCARDIA";
    else if (bpm > 0 && bpm < 60) status = "BRADYCARDIA";
    else if (bpm >= 60 && bpm <= 100) status = "NORMAL";

    return {
      ...mock,
      name,
      bpm,
      status,
    };
  });

  return (
    <View style={styles.screen}>
      <HeaderBar />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.sectionLabel}>CLINICAL OVERSIGHT</Text>
        <Text style={styles.title}>Patient Portal</Text>
        <Text style={styles.activePatientText}>
          Active Patient: {alerts.length > 0 ? alerts[0].patientName : "Waiting for scans..."}
        </Text>

        {/* Alerts Section (Only shows alerts from the last 1 minute) */}
        {alerts
          .filter(alert => currentTime - alert.timestamp <= 60000)
          .slice(0, 2)
          .map((alert) => {
          const isNormal = alert.alertType === "NORMAL";
          return (
            <TouchableOpacity
              key={alert.id}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedAlertToPing(alert);
              }}
            >
              <GlassCard 
                variant={isNormal ? "default" : "highlighted"} 
                style={[styles.alertCard, isNormal && styles.normalAlertCard]}
              >
                <View style={styles.alertContent}>
                  <Ionicons 
                    name={isNormal ? "information-circle" : "warning"} 
                    size={24} 
                    color={isNormal ? theme.colors.accent : theme.colors.alert} 
                  />
                  <View style={styles.alertTextContainer}>
                    <Text style={[styles.alertTitle, isNormal && { color: theme.colors.accent }]}>
                      {isNormal ? "NEW SCAN LOGGED" : `${alert.alertType} BPM ALERT`}
                    </Text>
                    <Text style={styles.alertSubtitle}>
                      Patient: {alert.patientName || "Unknown"} • BPM: {alert.avgBpm}
                    </Text>
                  </View>
                  <Text style={styles.alertTime}>
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}

        {/* Active Monitors */}
        <View style={styles.monitorsBadge}>
          <View style={styles.monitorDot} />
          <Text style={styles.monitorsText}>24 ACTIVE MONITORS</Text>
        </View>

        {/* Patient Cards */}
        {patientList.map((patient) => {
          const isCritical = patient.status === "TACHYCARDIA" || patient.status === "BRADYCARDIA";
          return (
            <GlassCard
              key={patient.id}
              variant={isCritical ? "highlighted" : "default"}
            >
              {/* Header Row */}
              <View style={styles.patientHeader}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={20} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientSub}>ID:{patient.patientId}</Text>
                </View>
                <StatusBadge status={patient.status} />
              </View>

              {/* BPM */}
              <View style={styles.bpmRow}>
                <Text
                  style={[
                    styles.bpmValue,
                    isCritical && { color: theme.colors.alert },
                  ]}
                >
                  {patient.bpm}
                </Text>
                <Text style={styles.bpmUnit}>BPM</Text>
                {isCritical && (
                  <Ionicons
                    name="trending-up"
                    size={18}
                    color={theme.colors.alert}
                    style={{ marginLeft: 4 }}
                  />
                )}
                {!isCritical && patient.status === "NORMAL" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={theme.colors.accent}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>

              {/* Mini ECG Line (simplified) */}
              <View style={styles.miniEcg}>
                <ECGGraph
                  height={50}
                  showTitle={false}
                  showMetrics={false}
                />
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.footerLeft}>
                  <Ionicons name="time-outline" size={12} color={theme.colors.textMuted} />
                  <Text style={styles.footerText}>
                    LAST UPDATE: {patient.lastUpdate}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("PatientDetail", {
                      patientId: patient.id,
                    })
                  }
                >
                  <Text style={styles.detailsLink}>Details</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          );
        })}

        {/* Network Status */}
        <GlassCard>
          <Text style={styles.networkTitle}>Hospital Network Status</Text>
          <Text style={styles.networkDesc}>
            System-wide monitoring is operating at peak efficiency. No latent
            latency detected across localized neural gateways.
          </Text>
          <View style={styles.networkStats}>
            <View>
              <Text style={styles.statLabel}>UPTIME</Text>
              <Text style={styles.statValue}>99.9%</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>SYNC SPEED</Text>
              <Text style={[styles.statValue, { color: theme.colors.accent }]}>14ms</Text>
            </View>
          </View>
        </GlassCard>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Premium Doctor Notify Modal */}
      <Modal
        visible={!!selectedAlertToPing || showSuccess}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Icon with pulse ring */}
            <View style={styles.modalIconRing}>
              <View style={styles.modalIconInner}>
                <Ionicons 
                  name={showSuccess ? "checkmark-circle" : "send"} 
                  size={36} 
                  color={showSuccess ? "#4FFFB0" : "#60A5FA"} 
                />
              </View>
            </View>

            {/* Status badge */}
            <View style={[styles.modalBadge, showSuccess && {backgroundColor: "rgba(79,255,176,0.08)"}]}>
              <View style={[styles.modalBadgeDot, showSuccess && {backgroundColor: "#4FFFB0"}]} />
              <Text style={[styles.modalBadgeLabel, showSuccess && {color: "#4FFFB0"}]}>
                {showSuccess ? "SENT SUCCESSFULLY" : "READY TO SEND"}
              </Text>
            </View>

            <Text style={styles.modalTitle}>
              {showSuccess ? "Notification Sent!" : "Notify Patient?"}
            </Text>
            
            <Text style={styles.modalText}>
              {showSuccess 
                ? "Your availability has been securely routed to the patient's dashboard."
                : `Send a notification to ${selectedAlertToPing?.patientName || "the patient"} that you are available for consultation?`
              }
            </Text>
            
            {!showSuccess ? (
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalCancelBtn}
                  activeOpacity={0.7}
                  onPress={() => setSelectedAlertToPing(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalSendBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    const targetAlert = selectedAlertToPing;
                    setSelectedAlertToPing(null);
                    
                    pushCallNotification(
                      "patient_01", 
                      auth.currentUser?.displayName || "Your Doctor",
                      doctorPhone
                    ).then(() => {
                      setShowSuccess(true);
                      setTimeout(() => setShowSuccess(false), 2500); 
                    }).catch(e => {
                      console.log("Error pushing", e);
                    });
                  }}
                >
                  <Ionicons name="paper-plane" size={18} color="#0A0F1C" />
                  <Text style={styles.modalSendText}>Send Notification</Text>
                </TouchableOpacity>
              </View>
            ) : null}
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

  // Title
  sectionLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 3,
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.md,
  },

  // Alert Card
  alertCard: {
    borderColor: theme.colors.alert,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    backgroundColor: "rgba(255, 68, 68, 0.05)",
  },
  normalAlertCard: {
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(79, 255, 176, 0.05)",
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    color: theme.colors.alert,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.typography.body,
    letterSpacing: 1,
  },
  alertSubtitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption,
    marginTop: 2,
  },
  alertTime: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
  },

  // Monitor Badge
  monitorsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(79, 255, 176, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    alignSelf: "flex-start",
    marginBottom: theme.spacing.lg,
  },
  monitorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  monitorsText: {
    color: theme.colors.accent,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
  },

  // Patient Header
  patientHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
  },
  patientSub: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    marginTop: 2,
  },

  // BPM
  bpmRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  bpmValue: {
    color: theme.colors.textPrimary,
    fontSize: 32,
    fontWeight: theme.fontWeight.bold,
  },
  bpmUnit: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.medium,
  },

  // Mini ECG
  miniEcg: {
    height: 50,
    marginBottom: theme.spacing.sm,
    overflow: "hidden",
  },

  // Footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 1,
  },
  detailsLink: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.medium,
  },
  activePatientText: {
    color: theme.colors.primary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.sm,
  },

  // Network
  networkTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.sm,
  },
  networkDesc: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  networkStats: {
    flexDirection: "row",
    gap: theme.spacing.xl,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 2,
    marginBottom: 4,
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: theme.typography.h2,
    fontWeight: theme.fontWeight.bold,
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
    borderColor: "rgba(96, 165, 250, 0.15)",
    shadowColor: "#60A5FA",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  modalIconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(96, 165, 250, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(96, 165, 250, 0.08)",
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
    backgroundColor: "#60A5FA",
  },
  modalBadgeLabel: {
    color: "#60A5FA",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
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
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  modalCancelText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    fontWeight: "600",
  },
  modalSendBtn: {
    flex: 1.5,
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#60A5FA",
    gap: 8,
  },
  modalSendText: {
    color: "#0A0F1C",
    fontSize: 15,
    fontWeight: "800",
  },
});