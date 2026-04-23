import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlassCard from "./GlassCard";
import { theme } from "../theme/theme";

export default function InsightCard({ title, description, icon = "sparkles" }) {
  return (
    <GlassCard>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={18} color={theme.colors.secondary} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{description}</Text>
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
    borderRadius: theme.radius.sm,
    backgroundColor: "rgba(123, 97, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    color: theme.colors.primary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 6,
  },
  desc: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    lineHeight: 20,
  },
});