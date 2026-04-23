import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HeaderBar from "../components/HeaderBar";
import GlassCard from "../components/GlassCard";
import StatusBadge from "../components/StatusBadge";
import { theme } from "../theme/theme";
import { subscribeToAnalysisLogs, deleteAnalysisLog, subscribeToAllAnalysisLogs, auth, getUserRole } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

const FILTERS = ["ALL", "ANOMALIES", "RESTING", "EXERCISE"];

export default function HistoryScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [role, setRole] = useState(null);

  // Authenticate and get role
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRole = await getUserRole(user.uid);
        setRole(userRole);
      } else {
        setRole(null);
      }
    });
    return unsub;
  }, []);

  // Subscribe to real analysis logs based on role
  useEffect(() => {
    if (!role) return;

    if (role === "doctor") {
      subscribeToAllAnalysisLogs((logs) => {
        setHistoryData(logs);
        setIsLoading(false);
      });
    } else {
      // Securely pull logs matched strictly to the patient's ID
      const patientUid = auth.currentUser?.uid || "patient_01";
      subscribeToAnalysisLogs((logs) => {
        setHistoryData(logs);
        setIsLoading(false);
      }, patientUid);
    }
  }, [role]);

  // Format timestamp to readable date
  const formatTime = (timestamp) => {
    if (!timestamp) return "Unknown Time";
    const date = new Date(timestamp);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours();
    const mins = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    return `${month} ${day}, ${h12}:${mins} ${ampm}`;
  };

  const filteredData = historyData.filter((item) => {
    const bpm = item.avgBpm || 0;
    
    let itemStatus = "NORMAL";
    if (bpm > 100) itemStatus = "TACHYCARDIA";
    else if (bpm > 0 && bpm < 60) itemStatus = "BRADYCARDIA";

    if (activeFilter === "ALL") return true;
    if (activeFilter === "ANOMALIES") {
      return itemStatus === "TACHYCARDIA" || itemStatus === "BRADYCARDIA";
    }
    if (activeFilter === "RESTING") return bpm < 65 || itemStatus === "NORMAL";
    if (activeFilter === "EXERCISE") return bpm > 90;
    return true;
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
        <Text style={styles.title}>History Log</Text>
        <Text style={styles.subtitle}>
          Comprehensive record of your cardiac performance
        </Text>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.chip,
                activeFilter === filter && styles.chipActive,
              ]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.chipText,
                  activeFilter === filter && styles.chipTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.emptySection}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.emptyText}>Loading analysis logs...</Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && filteredData.length === 0 && (
          <View style={styles.emptySection}>
            <Ionicons name="document-text-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Logs Yet</Text>
            <Text style={styles.emptyText}>
              {activeFilter === "ALL"
                ? "Start a 30-second ECG analysis to see your history here."
                : `No ${activeFilter.toLowerCase()} readings found.`}
            </Text>
          </View>
        )}

        {/* History Cards */}
        {filteredData.map((item, index) => {
          const bpm = item.avgBpm || 0;
          let itemStatus = "NORMAL";
          if (bpm > 100) itemStatus = "TACHYCARDIA";
          else if (bpm > 0 && bpm < 60) itemStatus = "BRADYCARDIA";

          const isEmergency = itemStatus === "TACHYCARDIA" || itemStatus === "BRADYCARDIA";
          
          return (
            <View key={item.id || index}>
              <GlassCard variant={isEmergency ? "danger" : "default"}>
                <View style={styles.cardRow}>
                  <TouchableOpacity 
                    style={styles.cardLeft}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("LogDetail", { item: {
                      ...item,
                      bpm: bpm,
                      status: itemStatus,
                      time: formatTime(item.timestamp),
                    }})}
                  >
                    <View style={styles.bpmRow}>
                      <Text
                        style={[
                          styles.bpmValue,
                          isEmergency && { color: theme.colors.alert },
                        ]}
                      >
                        {bpm}
                      </Text>
                      <Text style={styles.bpmUnit}>AVG BPM</Text>
                      {isEmergency && (
                         <Ionicons name="warning" size={16} color={theme.colors.alert} style={{marginLeft: 4}} />
                      )}
                    </View>
                    {role === "doctor" && (
                      <Text style={styles.patientNameHistory}>{item.patientName || item._dbPatientId || "Unknown Patient"}</Text>
                    )}
                    <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
                    {/* Show min/max range */}
                    {item.minBpm != null && item.maxBpm != null && (
                      <Text style={styles.rangeText}>
                        Range: {item.minBpm} – {item.maxBpm} BPM
                      </Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.cardRight}>
                    <StatusBadge status={itemStatus} />
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        activeOpacity={0.7}
                        onPress={() => {
                          Alert.alert(
                            "Delete Log",
                            "Delete this analysis log permanently?",
                            [
                              { text: "Cancel", style: "cancel" },
                              { text: "Delete", style: "destructive", onPress: () => {
                                  const targetPatientId = item._dbPatientId || auth.currentUser?.uid || "patient_01";
                                  deleteAnalysisLog(item.id, targetPatientId).catch(err => {
                                    Alert.alert("Network Error", "Could not delete: " + err.message);
                                  });
                                } 
                              },
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trash" size={18} color="#FF9F1C" />
                      </TouchableOpacity>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={theme.colors.textMuted}
                      />
                    </View>
                  </View>
                </View>
              </GlassCard>
            </View>
          );
        })}

        {/* End of Logs */}
        {!isLoading && filteredData.length > 0 && (
          <View style={styles.endSection}>
            <Ionicons name="heart" size={28} color={theme.colors.textMuted} />
            <Text style={styles.endText}>END OF HISTORY LOGS</Text>
          </View>
        )}
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
    paddingBottom: 100,
  },

  // Title
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h1,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    marginBottom: theme.spacing.lg,
  },

  // Filters
  filterRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    paddingRight: theme.spacing.lg,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "transparent",
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
  },
  chipTextActive: {
    color: "#0A0F1C",
  },

  // Empty State
  emptySection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2,
    fontWeight: theme.fontWeight.bold,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    textAlign: "center",
    paddingHorizontal: theme.spacing.xl,
  },

  // Cards
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flex: 1,
  },
  bpmRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  bpmValue: {
    color: theme.colors.textPrimary,
    fontSize: 36,
    fontWeight: theme.fontWeight.bold,
  },
  bpmUnit: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.medium,
  },
  patientNameHistory: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    marginTop: 6,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  time: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    marginTop: 4,
  },
  rangeText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  cardRight: {
    alignItems: "flex-end",
  },
  durationText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1,
    marginTop: 6,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: "rgba(255, 159, 28, 0.15)",
    borderRadius: theme.radius.sm,
  },

  // End
  endSection: {
    alignItems: "center",
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  endText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 3,
  },
});