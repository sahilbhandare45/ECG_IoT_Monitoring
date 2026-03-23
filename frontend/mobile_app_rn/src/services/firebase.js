import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

// Firebase Config - uses the same database as the backend gateway
const firebaseConfig = {
  apiKey: "AIzaSyDummyKey-Demo",
  authDomain: "ecg-iot-monitoring.firebaseapp.com",
  databaseURL: "https://ecg-iot-monitoring-default-rtdb.firebaseio.com",
  projectId: "ecg-iot-monitoring",
  storageBucket: "ecg-iot-monitoring.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const subscribeToECG = (callback) => {
  // Path matches what the gateway uploads: /ecg_data/patient_01/live_stream
  const ecgRef = ref(db, 'ecg_data/patient_01/live_stream');
  return onValue(ecgRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
};
