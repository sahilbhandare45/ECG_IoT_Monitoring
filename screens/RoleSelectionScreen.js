import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HeaderBar from "../components/HeaderBar";
import { theme } from "../theme/theme";

export default function RoleSelectionScreen({ navigation }) {
  const handlePatient = () => {
    navigation.replace("PatientTabs");
  };

  const handleDoctor = () => {
    navigation.replace("DoctorTabs");
  };

  return (
    <View style={styles.screen}>
      <HeaderBar />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>
          Choose Your{"\n"}
          <Text style={styles.titleAccent}>Gateway</Text>
        </Text>
        <Text style={styles.subtitle}>
          Securely interface with the vital stream.{"\n"}Select your access
          protocol to begin{"\n"}synchronization.
        </Text>

        {/* Patient Card */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={handlePatient}
          activeOpacity={0.8}
        >
          <View style={styles.roleIconOuter}>
            <View style={styles.roleIconCircle}>
              <Ionicons name="person" size={32} color={theme.colors.primary} />
            </View>
          </View>
          <Text style={styles.roleName}>Patient</Text>
          <Text style={styles.roleDesc}>Monitor your health</Text>
          <View style={styles.roleBtn}>
            <Text style={styles.roleBtnText}>SYNC DEVICE</Text>
          </View>
        </TouchableOpacity>

        {/* Doctor Card */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={handleDoctor}
          activeOpacity={0.8}
        >
          <View style={styles.roleIconOuter}>
            <View style={[styles.roleIconCircle, { borderColor: theme.colors.accent }]}>
              <Ionicons
                name="medkit"
                size={32}
                color={theme.colors.accent}
              />
            </View>
          </View>
          <Text style={styles.roleName}>Doctor</Text>
          <Text style={styles.roleDesc}>View patient data</Text>
          <View style={styles.roleBtn}>
            <Text style={styles.roleBtnText}>ACCESS PORTAL</Text>
          </View>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>ENCRYPTED CONNECTION ACTIVE</Text>
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
            <View style={[styles.dot, { backgroundColor: theme.colors.accent }]} />
            <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 40,
  },

  // Title
  title: {
    fontSize: 34,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    lineHeight: 44,
  },
  titleAccent: {
    color: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },

  // Role Card
  roleCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    ...theme.shadows.soft,
  },
  roleIconOuter: {
    marginBottom: theme.spacing.md,
  },
  roleIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1.5,
    borderColor: "rgba(0, 229, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h2,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  roleDesc: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    marginBottom: theme.spacing.lg,
  },
  roleBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  roleBtnText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 2,
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: theme.spacing.lg,
  },
  footerLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 3,
    marginBottom: theme.spacing.md,
  },
  dotRow: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
