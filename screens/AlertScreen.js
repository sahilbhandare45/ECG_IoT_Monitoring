import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Linking, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAllDoctors } from "../services/firebase";
import HeaderBar from "../components/HeaderBar";
import GlassCard from "../components/GlassCard";
import PrimaryButton from "../components/PrimaryButton";
import { theme } from "../theme/theme";

export default function AlertScreen({ route, navigation }) {
  const { type, bpm: routeBpm } = route.params || { type: "HIGH" };
  const isHigh = type === "HIGH";
  const isLow = type === "LOW";
  const isNormal = type === "NORMAL";

  // Doctor list modal state
  const [showDoctors, setShowDoctors] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const alertColor = isNormal
    ? theme.colors.accent
    : isHigh
    ? theme.colors.alert
    : theme.colors.warning;

  const title = isNormal
    ? "ECG Result:\nNormal"
    : isHigh
    ? "ALERT: High BPM\nDetected"
    : "ALERT: Low BPM\nDetected";

  // Use the real BPM value passed from the caller, fallback to defaults only if missing
  const bpmValue = routeBpm != null ? routeBpm : isHigh ? 145 : isLow ? 42 : 72;

  const description = isNormal
    ? `Your heart rate is ${bpmValue} BPM, which is within your normal calibrated range. Keep up the healthy lifestyle!`
    : isHigh
    ? `Your heart rate is ${bpmValue} BPM, which is significantly above your calibrated normal range.`
    : `Your heart rate is ${bpmValue} BPM, which is significantly below your calibrated normal range.`;

  const precautions = isNormal
    ? [
        { icon: "checkmark-circle-outline", text: "Your heart rhythm appears healthy" },
        { icon: "fitness-outline", text: "Continue regular exercise and hydration" },
        { icon: "happy-outline", text: "No immediate action needed" },
      ]
    : isHigh
    ? [
        { icon: "bed-outline", text: "Sit down and rest immediately" },
        { icon: "cloud-outline", text: "Focus on breathing slowly and deeply" },
        { icon: "alert-circle-outline", text: "Seek help if you feel dizzy or short of breath" },
      ]
    : [
        { icon: "bed-outline", text: "Sit down immediately" },
        { icon: "alert-circle-outline", text: "Avoid sudden movement" },
        { icon: "medkit-outline", text: "Seek medical advice" },
      ];

  const handleCallDoctor = async () => {
    setShowDoctors(true);
    setLoadingDoctors(true);
    try {
      const allDoctors = await getAllDoctors();
      // Only show doctors who are actually available (have a phone number)
      setDoctors(allDoctors.filter((doc) => doc.available && doc.phone));
    } catch (e) {
      console.error("Failed to fetch doctors:", e);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
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
        {/* Alert Icon */}
        <View style={styles.iconSection}>
          <View style={[styles.iconCircle, { borderColor: alertColor }]}>
            <View style={[styles.iconInner, { backgroundColor: "rgba(255,59,92,0.1)" }]}>
              <Ionicons name="heart" size={32} color={alertColor} />
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.alertTitle}>{title}</Text>

        {/* BPM Card */}
        <GlassCard variant="danger">
          <View style={styles.bpmSection}>
            <View style={styles.bpmRow}>
              <Text style={[styles.bpmValue, { color: alertColor }]}>{bpmValue}</Text>
              <View style={styles.bpmMeta}>
                <Ionicons name="warning" size={24} color={theme.colors.textMuted} />
                <Text style={styles.bpmUnit}>BPM</Text>
              </View>
            </View>
            <Text style={styles.bpmDesc}>{description}</Text>
          </View>
        </GlassCard>

        {/* Safety Precautions */}
        <GlassCard>
          <Text style={styles.precautionLabel}>SAFETY PRECAUTIONS</Text>
          {precautions.map((item, index) => (
            <View key={index} style={styles.precItem}>
              <View style={styles.precIcon}>
                <Ionicons name={item.icon} size={18} color={theme.colors.accent} />
              </View>
              <Text style={styles.precText}>{item.text}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Actions */}
        <PrimaryButton
          title="Call Doctor"
          icon="call"
          variant="danger"
          onPress={handleCallDoctor}
        />
        <View style={{ height: theme.spacing.md }} />

        <View style={styles.bottomRow}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title="View Live ECG"
              icon="pulse"
              variant="outline"
              size="small"
              onPress={() => navigation.navigate("ECG", { startReading: true })}
            />
          </View>
          <View style={{ width: theme.spacing.md }} />
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title="Dismiss"
              icon="close"
              variant="outline"
              size="small"
              onPress={() => navigation.goBack()}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Doctor List Modal */}
      <Modal visible={showDoctors} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconRing}>
                <Ionicons name="medkit" size={28} color={theme.colors.accent} />
              </View>
              <Text style={styles.modalTitle}>Available Doctors</Text>
              <Text style={styles.modalSubtitle}>
                Select a doctor to call
              </Text>
            </View>

            {/* Doctor List */}
            {loadingDoctors ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Finding doctors...</Text>
              </View>
            ) : doctors.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="person-outline" size={40} color={theme.colors.textMuted} />
                <Text style={styles.emptyText}>No doctors available right now</Text>
                <Text style={styles.emptySubtext}>Please try again later or call emergency services</Text>
              </View>
            ) : (
              <ScrollView style={styles.doctorList} showsVerticalScrollIndicator={false}>
                {doctors.map((doc) => (
                  <View key={doc.id} style={styles.doctorCard}>
                    <View style={styles.doctorAvatar}>
                      <Ionicons name="person" size={22} color={theme.colors.secondary} />
                    </View>
                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorName}>Dr. {doc.name}</Text>
                      <View style={styles.doctorPhoneRow}>
                        <Ionicons name="call-outline" size={13} color={theme.colors.textMuted} />
                        <Text style={styles.doctorPhone}>
                          {doc.phone || "No phone listed"}
                        </Text>
                      </View>
                      {doc.available && (
                        <View style={styles.availableBadge}>
                          <View style={styles.availableDot} />
                          <Text style={styles.availableText}>Available</Text>
                        </View>
                      )}
                    </View>
                    {doc.phone ? (
                      <TouchableOpacity
                        style={styles.callBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                          setShowDoctors(false);
                          Linking.openURL(`tel:${doc.phone}`);
                        }}
                      >
                        <Ionicons name="call" size={18} color="#0A0F1C" />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.callBtnDisabled}>
                        <Ionicons name="call" size={18} color={theme.colors.textMuted} />
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              activeOpacity={0.7}
              onPress={() => setShowDoctors(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
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

  // Icon
  iconSection: {
    alignItems: "center",
    marginVertical: theme.spacing.xl,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    backgroundColor: "rgba(100,100,120,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },

  // Title
  alertTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1,
    fontWeight: theme.fontWeight.bold,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
    lineHeight: 36,
  },

  // BPM
  bpmSection: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  bpmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  bpmValue: {
    fontSize: 64,
    fontWeight: theme.fontWeight.black,
  },
  bpmMeta: {
    alignItems: "center",
    gap: 2,
  },
  bpmUnit: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.medium,
  },
  bpmDesc: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: theme.spacing.md,
  },

  // Precautions
  precautionLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 3,
    marginBottom: theme.spacing.lg,
  },
  precItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: theme.spacing.lg,
  },
  precIcon: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.sm,
    backgroundColor: "rgba(79, 255, 176, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  precText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.medium,
    flex: 1,
  },

  // Bottom
  bottomRow: {
    flexDirection: "row",
  },

  // Doctor Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 8, 18, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(79, 255, 176, 0.12)",
    shadowColor: "#4FFFB0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(79, 255, 176, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(79, 255, 176, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
  },

  // Doctor List
  doctorList: {
    maxHeight: 320,
  },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(123, 97, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
  },
  doctorPhoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  doctorPhone: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
  },
  availableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4FFFB0",
  },
  availableText: {
    color: "#4FFFB0",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#4FFFB0",
    justifyContent: "center",
    alignItems: "center",
  },
  callBtnDisabled: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Loading & Empty
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 14,
  },
  loadingText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  emptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    textAlign: "center",
  },

  // Close Button
  modalCloseBtn: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalCloseText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    fontWeight: "600",
  },
});