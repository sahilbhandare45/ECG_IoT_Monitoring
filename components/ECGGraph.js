import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Polyline, Circle, Line, Defs, LinearGradient, Stop } from "react-native-svg";
import { theme } from "../theme/theme";

const MAX_VISIBLE_POINTS = 200;
const SCREEN_WIDTH = Dimensions.get("window").width;

// ─────────────────────────────────────────────────────────
// Generate a single PQRST beat as an array of Y values
// Mimics Lead II morphology:
//   baseline → P wave → PR seg → Q dip → R spike → S dip → ST seg → T wave → baseline
// ─────────────────────────────────────────────────────────
function generatePQRSTBeat(beatLength = 100) {
  const pts = [];

  for (let i = 0; i < beatLength; i++) {
    const t = i / beatLength; // normalized 0..1 across one beat
    let y = 0; // baseline

    // P wave: gentle upward hump at t ≈ 0.10–0.20
    if (t >= 0.08 && t < 0.20) {
      const p = (t - 0.08) / 0.12; // 0..1 within P wave
      y = 0.15 * Math.sin(p * Math.PI);
    }

    // PR segment: flat baseline at t ≈ 0.20–0.28
    // (y stays 0)

    // Q wave: small downward dip at t ≈ 0.28–0.32
    if (t >= 0.28 && t < 0.32) {
      const q = (t - 0.28) / 0.04;
      y = -0.12 * Math.sin(q * Math.PI);
    }

    // R wave: tall sharp spike upward at t ≈ 0.32–0.40
    if (t >= 0.32 && t < 0.40) {
      const r = (t - 0.32) / 0.08;
      y = 1.0 * Math.sin(r * Math.PI);
    }

    // S wave: sharp dip below baseline at t ≈ 0.40–0.46
    if (t >= 0.40 && t < 0.46) {
      const s = (t - 0.40) / 0.06;
      y = -0.25 * Math.sin(s * Math.PI);
    }

    // ST segment: flat or slightly elevated at t ≈ 0.46–0.55
    if (t >= 0.46 && t < 0.55) {
      y = 0.02; // subtle ST elevation
    }

    // T wave: broad upward hump at t ≈ 0.55–0.72
    if (t >= 0.55 && t < 0.72) {
      const tw = (t - 0.55) / 0.17;
      y = 0.25 * Math.sin(tw * Math.PI);
    }

    // Rest of the beat is baseline (y = 0)

    pts.push(y);
  }

  return pts;
}

// Generate a full repeating PQRST waveform for idle display
function generateIdleWaveform(totalPoints = 200, beatsCount = 3) {
  const beatLen = Math.floor(totalPoints / beatsCount);
  const singleBeat = generatePQRSTBeat(beatLen);
  const waveform = [];
  for (let b = 0; b < beatsCount; b++) {
    waveform.push(...singleBeat);
  }
  // Pad remaining points with baseline
  while (waveform.length < totalPoints) {
    waveform.push(0);
  }
  return waveform;
}

export default function ECGGraph({
  height = 180,
  showTitle = true,
  showMetrics = true,
  liveChunk = null,
  pqrst = null,
  isReading = false,
}) {
  const [points, setPoints] = useState([]);
  const prevChunkRef = useRef(null);

  // Static idle PQRST waveform (no animation to avoid jitter)
  const idleWaveform = useRef(generateIdleWaveform(MAX_VISIBLE_POINTS, 3)).current;

  // Append live sensor chunks
  useEffect(() => {
    if (!isReading || !liveChunk || !Array.isArray(liveChunk) || liveChunk.length === 0) {
      return;
    }

    const chunkStr = liveChunk.join(",");
    if (prevChunkRef.current === chunkStr) return;
    prevChunkRef.current = chunkStr;

    setPoints((prev) => {
      const updated = [...prev, ...liveChunk];
      if (updated.length > MAX_VISIBLE_POINTS) {
        return updated.slice(updated.length - MAX_VISIBLE_POINTS);
      }
      return updated;
    });
  }, [liveChunk, isReading]);

  // Reset when reading stops
  useEffect(() => {
    if (!isReading) {
      setPoints([]);
      prevChunkRef.current = null;
    }
  }, [isReading]);

  // ── Build SVG polyline ──
  const graphWidth = SCREEN_WIDTH - 64;
  const yMid = height * 0.55; // slightly below center for better PQRST aesthetics
  const padding = 15;

  let polylinePoints = "";
  let isShowingLive = false;

  if (isReading && points.length > 1) {
    isShowingLive = true;
    // Stable centering: use the mean as center, and a fixed symmetric range
    const mean = points.reduce((a, b) => a + b, 0) / points.length;
    // Use a stable amplitude: the max absolute deviation from mean, with a floor
    let maxDev = 0;
    for (let i = 0; i < points.length; i++) {
      const dev = Math.abs(points[i] - mean);
      if (dev > maxDev) maxDev = dev;
    }
    maxDev = Math.max(maxDev, 1); // avoid zero

    const xStep = graphWidth / MAX_VISIBLE_POINTS;
    polylinePoints = points
      .map((val, i) => {
        // Center on mean, scale symmetrically
        const normalized = (val - mean) / maxDev; // -1 to +1
        const y = yMid - normalized * (height * 0.4); // use 40% of height each direction
        return `${i * xStep},${y}`;
      })
      .join(" ");
  } else {
    // Show static PQRST waveform (no scrolling)
    const xStep = graphWidth / MAX_VISIBLE_POINTS;
    const amplitude = height * 0.35;

    polylinePoints = idleWaveform
      .slice(0, MAX_VISIBLE_POINTS)
      .map((val, i) => {
        const y = yMid - val * amplitude;
        return `${i * xStep},${y}`;
      })
      .join(" ");
  }

  // Grid dots
  const gridDots = [];
  for (let x = 10; x < graphWidth; x += 20) {
    for (let y = 10; y < height - 10; y += 20) {
      gridDots.push({ x, y });
    }
  }

  // PQRST metrics
  const prInterval = pqrst?.pr_interval_ms ?? 0;
  const qrsDuration = pqrst?.qrs_duration_ms ?? 0;
  const qtInterval = pqrst?.qt_interval_ms ?? 0;

  const lineColor = isReading ? theme.colors.primary : "#4FFFB0";

  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {isReading ? "Live ECG Stream" : "ECG Monitor"}
          </Text>
          <Text style={styles.specs}>
            {isReading ? "Lead II • 25mm/s" : "PQRST • Preview"}
          </Text>
        </View>
      )}

      <View style={[styles.graphContainer, { height }]}>
        <Svg height={height} width="100%">
          <Defs>
            <LinearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={lineColor} stopOpacity="0.25" />
              <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Grid dots */}
          {gridDots.map((dot, i) => (
            <Circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r={1}
              fill="rgba(255,255,255,0.06)"
            />
          ))}

          {/* Horizontal guide lines */}
          {[0.25, 0.5, 0.75].map((frac) => (
            <Line
              key={frac}
              x1="0"
              y1={height * frac}
              x2={graphWidth}
              y2={height * frac}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
              strokeDasharray="4,6"
            />
          ))}

          {/* PQRST labels when idle */}
          {!isReading && (
            <>
              {/* Baseline reference */}
              <Line
                x1="0"
                y1={yMid}
                x2={graphWidth}
                y2={yMid}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
                strokeDasharray="2,4"
              />
            </>
          )}

          {/* Glow shadow line */}
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={lineColor}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.12}
          />

          {/* Main ECG waveform line */}
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={lineColor}
            strokeWidth={isReading ? "2.5" : "2"}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      {showMetrics && (
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>PR INTERVAL</Text>
            <Text style={[styles.metricValue, !isReading && styles.metricIdle]}>
              {isReading && prInterval > 0 ? `${Math.round(prInterval)}ms` : "160ms"}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>QRS DUR</Text>
            <Text style={[styles.metricValue, !isReading && styles.metricIdle]}>
              {isReading && qrsDuration > 0 ? `${Math.round(qrsDuration)}ms` : "90ms"}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>QTC</Text>
            <Text style={[styles.metricValue, !isReading && styles.metricIdle]}>
              {isReading && qtInterval > 0 ? `${Math.round(qtInterval)}ms` : "400ms"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
  },
  specs: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    letterSpacing: 0.5,
  },
  graphContainer: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: theme.radius.md,
    overflow: "hidden",
    justifyContent: "center",
  },
  metricsRow: {
    flexDirection: "row",
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  metricItem: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.micro,
    letterSpacing: 1,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: 4,
  },
  metricValue: {
    color: theme.colors.primary,
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.bold,
  },
  metricIdle: {
    color: theme.colors.textMuted,
  },
});