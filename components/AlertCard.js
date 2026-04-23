import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlassCard from "./GlassCard";
import { theme } from "../theme/theme";

export default function AlertCard({ title, message }) {
  return (
    <GlassCard variant="danger">
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning" size={20} color={theme.colors.alert} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.text}>{message}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 59, 92, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    color: theme.colors.alert,
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 6,
  },
  text: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    lineHeight: 20,
  },
});