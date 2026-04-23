import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, onChildAdded, push, set, get, query, orderByChild, limitToLast, remove } from "firebase/database";
import {
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ---------- ECG Realtime Database Firebase (existing) ----------
const ecgFirebaseConfig = {
  apiKey: "AIzaSyDz1hXwPcZkUPAalhMhCC4ujNl_JQ_Robs",
  authDomain: "ecg-iot-monitoring.firebaseapp.com",
  databaseURL: "https://ecg-iot-monitoring-default-rtdb.firebaseio.com",
  projectId: "ecg-iot-monitoring",
  storageBucket: "ecg-iot-monitoring.firebasestorage.app",
  messagingSenderId: "608159349464",
  appId: "1:608159349464:web:80662915204f694ef175ad",
  measurementId: "G-1DTJQ7Y156",
};

const ecgApp = initializeApp(ecgFirebaseConfig);
const db = getDatabase(ecgApp);

// ---------- User Auth Firebase (new project) ----------
const authFirebaseConfig = {
  apiKey: "AIzaSyB95x3bmY85QHhxOyIVnhZQau9-6KIdCaQ",
  authDomain: "newproject-9b946.firebaseapp.com",
  projectId: "newproject-9b946",
  storageBucket: "newproject-9b946.firebasestorage.app",
  messagingSenderId: "659968975453",
  appId: "1:659968975453:web:6c41c7498de8fc581163b4",
  measurementId: "G-8KGTX1CL2S",
};

const authApp = initializeApp(authFirebaseConfig, "authApp");
const auth = initializeAuth(authApp, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// ---------- ECG Live Data Subscription ----------
export function subscribeToECG(callback, patientId = "patient_01") {
  const ecgRef = ref(db, `ecg_data/${patientId}/live_stream`);

  // onValue returns an unsubscribe function — callers MUST use it for cleanup
  const unsubscribe = onValue(ecgRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
  return unsubscribe;
}

export function subscribeToAllPatients(callback) {
  const refPath = ref(db, "ecg_data");

  onValue(refPath, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
}

// ---------- 30s Analysis Log Functions ----------
export async function saveAnalysisLog(logData, patientId = "patient_01") {
  const logsRef = ref(db, `ecg_data/${patientId}/analysis_logs`);
  await push(logsRef, logData);
}

export async function deleteAnalysisLog(logId, patientId = "patient_01") {
  const logRef = ref(db, `ecg_data/${patientId}/analysis_logs/${logId}`);
  await remove(logRef);
}

export function subscribeToAnalysisLogs(callback, patientId = "patient_01") {
  const logsRef = query(
    ref(db, `ecg_data/${patientId}/analysis_logs`),
    limitToLast(50)
  );

  onValue(logsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    // Convert Firebase object to sorted array (newest first)
    const logs = Object.entries(data)
      .map(([key, val]) => ({ id: key, ...val }))
      .sort((a, b) => b.timestamp - a.timestamp);
    callback(logs);
  });
}

export function subscribeToAllAnalysisLogs(callback) {
  const ecgDataRef = ref(db, "ecg_data");
  onValue(ecgDataRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    
    let allLogs = [];
    Object.entries(data).forEach(([pId, patientData]) => {
      // Ensure patientData is a valid object and has analysis_logs before spreading
      if (patientData && typeof patientData === "object" && patientData.analysis_logs && typeof patientData.analysis_logs === "object") {
        const logs = Object.entries(patientData.analysis_logs).map(([key, val]) => {
            return {
            id: key,
            _dbPatientId: pId,
            ...(typeof val === "object" ? val : {}) 
            };
        });
        allLogs = [...allLogs, ...logs];
      }
    });
    
    // Sort all newest first and limit
    allLogs.sort((a, b) => b.timestamp - a.timestamp);
    callback(allLogs.slice(0, 100));
  });
}

// ---------- Role Management ----------
export async function saveUserRole(uid, role, extraData = {}) {
  const userRef = ref(db, `users/${uid}`);
  await set(userRef, { role, ...extraData });
}

export async function getDoctorPhone(uid) {
  const phoneRef = ref(db, `users/${uid}/phone`);
  const snapshot = await get(phoneRef);
  return snapshot.val(); // phone number string or null
}

export async function getUserRole(uid) {
  const roleRef = ref(db, `users/${uid}/role`);
  const snapshot = await get(roleRef);
  return snapshot.val(); // "patient" | "doctor" | null
}

export async function setDoctorAvailability(uid, isAvailable) {
  const availRef = ref(db, `users/${uid}/available`);
  await set(availRef, isAvailable);
}

export function subscribeToAvailability(uid, callback) {
  const availRef = ref(db, `users/${uid}/available`);
  const unsubscribe = onValue(availRef, (snapshot) => {
    callback(snapshot.val() ?? false);
  });
  return unsubscribe;
}

export async function getAllDoctors() {
  const usersRef = ref(db, "users");
  const snapshot = await get(usersRef);
  const data = snapshot.val();
  if (!data) return [];
  
  const doctors = [];
  Object.entries(data).forEach(([uid, userData]) => {
    if (userData.role === "doctor") {
      doctors.push({
        id: uid,
        name: userData.displayName || "Doctor",
        phone: userData.phone || "",
        available: userData.available === true && !!userData.phone,
      });
    }
  });
  return doctors;
}

// ---------- Doctor Alert System ----------
export async function pushDoctorAlert(alertData) {
  const alertsRef = ref(db, "doctor_alerts");
  await push(alertsRef, alertData);
}

export function subscribeToDoctorAlerts(callback) {
  const alertsRef = query(
    ref(db, "doctor_alerts"),
    limitToLast(20)
  );

  onValue(alertsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const alerts = Object.entries(data)
      .map(([key, val]) => ({ id: key, ...val }))
      .sort((a, b) => b.timestamp - a.timestamp);
    callback(alerts);
  });
}

// ---------- Doctor to Patient Ping System ----------
export async function pushCallNotification(patientId = "patient_01", doctorName, doctorPhone) {
  const pingRef = ref(db, `patient_pings/${patientId}`);
  await push(pingRef, {
    doctorName,
    doctorPhone: doctorPhone || "N/A",
    timestamp: Date.now(),
  });
}

export function subscribeToPatientPings(callback, patientId = "patient_01") {
  const pingRef = ref(db, `patient_pings/${patientId}`);

  // onChildAdded fires ONCE for each existing child on first load,
  // then ONCE for each NEW child added afterward.
  // We skip existing children by tracking initialization.
  let initialized = false;

  // First, do a one-time read to mark the listener as "caught up"
  get(query(pingRef, limitToLast(1))).then(() => {
    // Small delay to let all existing onChildAdded events fire first
    setTimeout(() => {
      initialized = true;
    }, 1500);
  });

  onChildAdded(pingRef, (snapshot) => {
    if (!initialized) return; // Skip all pre-existing pings

    const data = snapshot.val();
    if (data) {
      callback({ id: snapshot.key, ...data });
    }
  });
}

// ---------- Auth Helpers ----------
export async function registerUser(email, password, fullName) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  // Set displayName on the Firebase user profile
  if (fullName) {
    await updateProfile(userCredential.user, { displayName: fullName });
  }
  return userCredential.user;
}

export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}

export async function signOutUser() {
  await firebaseSignOut(auth);
}

export { auth };