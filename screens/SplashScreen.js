import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme/theme";
import { auth, getUserRole } from "../services/firebase";

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Icon entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Navigate after delay + auth check
    const timer = setTimeout(async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const role = await getUserRole(user.uid);
          if (role === "doctor") {
            navigation.replace("DoctorTabs");
          } else {
            navigation.replace("PatientTabs");
          }
        } catch (e) {
          navigation.replace("Login");
        }
      } else {
        navigation.replace("Login");
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      {/* Center Content */}
      <View style={styles.center}>
        {/* Icon Container */}
        <Animated.View
          style={[
            styles.iconOuter,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View style={[styles.iconGlow, { opacity: glowAnim }]} />
          <View style={styles.iconInner}>
            <Ionicons name="heart" size={48} color={theme.colors.primary} />
            {/* Pulse line under heart */}
            <View style={styles.pulseLine}>
              <View style={styles.pulseSegment} />
            </View>
          </View>
        </Animated.View>

        {/* App Name */}
        <Animated.Text style={[styles.appName, { opacity: fadeAnim }]}>
          Vital Ether
        </Animated.Text>
        <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
          NEXT-GEN CLINICAL MONITORING
        </Animated.Text>
      </View>

      {/* Bottom Status */}
      <View style={styles.bottom}>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>System Initializing</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth }]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },

  // Icon
  iconOuter: {
    width: 130,
    height: 130,
    borderRadius: 32,
    backgroundColor: "rgba(0, 229, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xl,
    position: "relative",
  },
  iconGlow: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 32,
    backgroundColor: "rgba(0, 229, 255, 0.08)",
    ...theme.shadows.glow,
  },
  iconInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseLine: {
    width: 50,
    height: 3,
    backgroundColor: "rgba(0, 229, 255, 0.2)",
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  pulseSegment: {
    width: "60%",
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },

  // Text
  appName: {
    fontSize: 36,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  tagline: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    letterSpacing: 4,
    fontWeight: theme.fontWeight.semibold,
  },

  // Bottom
  bottom: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
    width: "100%",
    paddingHorizontal: theme.spacing.xxl,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  statusText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.medium,
  },
  progressTrack: {
    width: 180,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
});
