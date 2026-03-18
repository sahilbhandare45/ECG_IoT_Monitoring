import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

// Replace with actual Firebase Config in production
const firebaseConfig = {
  apiKey: "AIzaSyDummyKey-Demo",
  authDomain: "ecg-iot-demo.firebaseapp.com",
  databaseURL: "https://your-firebase-url.firebaseio.com",
  projectId: "ecg-iot-demo",
  storageBucket: "ecg-iot-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const subscribeToECG = (callback) => {
  const ecgRef = ref(db, 'patient_01/live_stream');
  return onValue(ecgRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
};
