import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useSharedValue, withTiming, Easing, useDerivedValue } from 'react-native-reanimated';

// 6 seconds of data at 200 Hz
const MAX_POINTS = 1200;

export default function ECGWaveform({ latestChunk = [] }) {
  const { width } = useWindowDimensions();
  const height = 300;

  // Use Shared Values for live data to avoid "Tried to modify key current" worklet errors
  const buffer = useSharedValue(new Array(MAX_POINTS).fill(0));
  const pointer = useSharedValue(0);
  
  useEffect(() => {
    console.log("[ECGWaveform] Chunk received, length:", latestChunk ? latestChunk.length : "null");
    if (!latestChunk || latestChunk.length === 0) return;
    
    // Copy new chunk into the cyclotronic buffer
    // Reanimated 3 allows modifying shared value arrays/objects directly
    const currentBuffer = [...buffer.value];
    let currentPointer = pointer.value;

    for (let i = 0; i < latestChunk.length; i++) {
        const val = Number(latestChunk[i]);
        currentBuffer[currentPointer] = isNaN(val) ? 0 : val;
        currentPointer = (currentPointer + 1) % MAX_POINTS;
    }
    
    // Update shared values - this triggers re-renders of components listening to them
    buffer.value = currentBuffer;
    pointer.value = currentPointer;
  }, [latestChunk]);

  // Derived Skia Path
  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const currentBuffer = buffer.value;
    const currentPointer = pointer.value;

    if (!currentBuffer) return p;

    // 1. Calculate the dynamic range of the current buffer for auto-scaling
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let i = 0; i < MAX_POINTS; i++) {
        const v = currentBuffer[i];
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
    }

    const range = maxVal - minVal;
    // Determine gain: fill ~60% of vertical height
    const gain = range > 10 ? 180 / range : 0.5;
    const offset = (maxVal + minVal) / 2;

    const canvasWidth = width || 400; 
    const dx = canvasWidth / MAX_POINTS;
    
    for (let i = 0; i < MAX_POINTS; i++) {
      let val = currentBuffer[i];
      if (typeof val !== 'number' || isNaN(val)) val = 0;
      
      const y = height / 2 - ((val - offset) * gain); 
      const x = i * dx;
      
      const dist = (i - currentPointer) % MAX_POINTS;
      const normalizedDist = dist < 0 ? dist + MAX_POINTS : dist;

      if (normalizedDist === 0) {
        p.moveTo(x, y);
      } else if (normalizedDist > 0 && normalizedDist < 15) {
        p.moveTo(x, y); 
      } else {
        p.lineTo(x, y);
      }
    }
    return p;
  }, [buffer, pointer, width, height]);

  return (
    <View style={styles.container}>
      <Canvas style={{ width, height }}>
        <Path
          path={path}
          color="#0000ff"
          style="stroke"
          strokeWidth={2.5}
          strokeJoin="round"
        />
        {/* Test UI Marker: A red line across the middle to verify Skia is rendering */}
        <Path
          path="M 0 150 L 500 150"
          color="#ff0000"
          style="stroke"
          strokeWidth={1}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: '100%',
    backgroundColor: '#e9e1e1ff',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  }
});
