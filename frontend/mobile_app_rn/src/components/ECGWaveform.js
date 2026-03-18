import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useSharedValue, withTiming, Easing, useDerivedValue } from 'react-native-reanimated';

// 6 seconds of data at 200 Hz
const MAX_POINTS = 1200;

export default function ECGWaveform({ latestChunk = [] }) {
  const { width } = useWindowDimensions();
  const height = 300;
  
  // We use a React ref to maintain the long-running buffer
  const bufferRef = React.useRef(new Array(MAX_POINTS).fill(0));
  const pointerRef = React.useRef(0);
  
  // Reanimated shared values to trigger Skia canvas re-renders
  const trigger = useSharedValue(0);

  useEffect(() => {
    if (!latestChunk || latestChunk.length === 0) return;
    
    // Copy new chunk into the cyclotronic buffer
    for (let i = 0; i < latestChunk.length; i++) {
        bufferRef.current[pointerRef.current] = latestChunk[i];
        pointerRef.current = (pointerRef.current + 1) % MAX_POINTS;
    }
    
    // Trigger re-render
    trigger.value = trigger.value + 1;
  }, [latestChunk]);

  // Derived Skia Path
  const path = useDerivedValue(() => {
    // dummy dependency to force update
    const t = trigger.value; 
    
    const p = Skia.Path.Make();
    const buffer = bufferRef.current;
    
    if (!buffer) return p;

    const dx = width / MAX_POINTS;
    
    for (let i = 0; i < MAX_POINTS; i++) {
      const val = buffer[i];
      // Normalize ADC value (typically -512 to 512 after centering)
      // Scale to fit within height (300px)
      const y = height / 2 - (val * 0.2); 
      const x = i * dx;
      
      // The "Erase Bar" effect: don't draw lines connecting the newest point back to the oldest point
      if (i === 0 || i === pointerRef.current + 5) {
        p.moveTo(x, y);
      } else {
        // Create a 10-point gap slightly ahead of the pointer
        const dist = (i - pointerRef.current) % MAX_POINTS;
        const normalizedDist = dist < 0 ? dist + MAX_POINTS : dist;
        
        if (normalizedDist > 0 && normalizedDist < 10) {
            p.moveTo(x, y); // Skip drawing
        } else {
            p.lineTo(x, y);
        }
      }
    }
    return p;
  }, [trigger, width, height]);

  return (
    <View style={styles.container}>
      <Canvas style={{ width, height }}>
        <Path 
          path={path} 
          color="#00ff00" 
          style="stroke" 
          strokeWidth={2.5} 
          strokeJoin="round" 
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: '100%',
    backgroundColor: '#0d0d0d',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  }
});
