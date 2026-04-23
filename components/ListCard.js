import React from "react";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlassCard from "./GlassCard";
import StatusBadge from "./StatusBadge";
import { theme } from "../theme/theme";

export default function ListCard({
  title,
  subtitle,
  onPress,
  bpm,
  status,
  time,
  isAnomalous = false,
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <GlassCard variant={isAnomalous ? "highlighted" : "default"}>
        <View style={styles.row}>
          {/* Left: BPM or Title */}
          <View style={styles.left}>
            {bpm != null ? (
              <>
                <View style={styles.bpmRow}>
                  <Text
                    style={[
                      styles.bpmValue,
                      isAnomalous && { color: theme.colors.alert },
                    ]}
                  >
                    {bpm}
                  </Text>
                  <Text style={styles.bpmLabel}>BPM</Text>
                </View>
                {time && <Text style={styles.time}>{time}</Text>}
              </>
            ) : (
              <>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </>
            )}
          </View>

          {/* Right: Badge + Arrow */}
          <View style={styles.right}>
            {status && <StatusBadge status={status} />}
            {onPress && (
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.textMuted}
                style={{ marginTop: status ? 8 : 0 }}
              />
            )}
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: {
    flex: 1,
  },
  bpmRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  bpmValue: {
    color: theme.colors.textPrimary,
    fontSize: 32,
    fontWeight: theme.fontWeight.bold,
  },
  bpmLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.medium,
  },
  time: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    marginTop: 4,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.semibold,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    marginTop: 4,
  },
  right: {
    alignItems: "flex-end",
  },
});