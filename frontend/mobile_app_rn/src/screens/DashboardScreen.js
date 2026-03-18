import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ECGWaveform from '../components/ECGWaveform';
import { subscribeToECG } from '../services/firebase';

export default function DashboardScreen() {
  const [ecgData, setEcgData] = useState([]);
  const [bpm, setBpm] = useState('--');
  const [status, setStatus] = useState('CONNECTING...');
  const [sqi, setSqi] = useState('GOOD');

  /* Uncomment once Firebase URL is valid
  useEffect(() => {
    const unsubscribe = subscribeToECG((data) => {
      if (data.ecg_chunk) setEcgData(data.ecg_chunk);
      if (data.bpm) setBpm(data.bpm);
      if (data.status) setStatus(data.status);
      if (data.sqi) setSqi(data.sqi);
    });
    return () => unsubscribe();
  }, []);
  */

  // MOCK DATA GENERATOR for UI testing without backend
  useEffect(() => {
    const interval = setInterval(() => {
        // Generate a rough fake ECG shape batch
        const chunk = [];
        for(let i=0; i<40; i++) {
           // baseline noise
           let val = (Math.random() - 0.5) * 20; 
           // fake QRS
           if (i === 10) val = -50;
           if (i === 12) val = 400;
           if (i === 15) val = -30;
           chunk.push(val);
        }
        setEcgData(chunk);
        setBpm(Math.floor(Math.random() * 5 + 70));
        setStatus('NORMAL');
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const isAlert = status === 'ARRHYTHMIA' || status === 'TACHYCARDIA' || status === 'BRADYCARDIA';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.bedText}>BED 01 - PATIENT_01</Text>
        <Text style={[styles.statusText, isAlert ? styles.alertText : null]}>
          {status}
        </Text>
      </View>

      {/* Main Waveform */}
      <View style={styles.wavePanel}>
         <Text style={styles.leadLabel}>LEAD II - 25mm/s</Text>
         <ECGWaveform latestChunk={ecgData} />
      </View>

      {/* Vitals Panel */}
      <View style={styles.vitalsPanel}>
         <View style={styles.vitalBox}>
            <Text style={styles.vitalLabel}>HEART RATE</Text>
            <View style={styles.bpmrow}>
                <Text style={styles.bpmValue}>{bpm}</Text>
                <Text style={styles.bpmUnit}> BPM</Text>
            </View>
         </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  bedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertText: {
    color: '#ff0000',
  },
  wavePanel: {
    marginTop: 10,
  },
  leadLabel: {
    color: '#00ff00',
    marginLeft: 15,
    marginBottom: 5,
    fontSize: 12,
  },
  vitalsPanel: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'flex-end'
  },
  vitalBox: {
    alignItems: 'flex-end',
  },
  vitalLabel: {
    color: '#00ff00',
    fontSize: 16,
  },
  bpmrow: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  bpmValue: {
    color: '#00ff00',
    fontSize: 64,
    fontWeight: 'bold',
  },
  bpmUnit: {
    color: '#00ff00',
    fontSize: 20,
  }
});
