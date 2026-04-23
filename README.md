# 🫀 Vital Ether - Clinical ECG Monitoring Suite

Vital Ether is a comprehensive, AI-driven **Clinical Monitoring Suite** that seamlessly bridges the gap between raw IoT bio-sensor data and actionable medical insights. Combining a robust hardware pipeline, a predictive machine-learning engine, and a premium glassmorphic mobile application, this ecosystem delivers real-time cardiac monitoring and instantaneous patient-doctor communication.

## 🌟 Key Features

- **Real-Time IoT Telemetry:** High-frequency, low-latency streaming of single-lead ECG data via Python-based backend architectures.
- **Advanced DSP & AI Pipeline:** 
  - Dynamic Noise Filtering (Notch, Bandpass, Moving Average) for clean waveform plotting.
  - Real-time PQRST Wave Detection & BPM Calculation.
  - Cardiac anomaly classification (Tachycardia, Bradycardia, Arrhythmia estimations).
- **Role-Based Access Control (RBAC):** Distinct application portals for Doctors and Patients secured by Firebase Authentication.
- **Clinical Dashboard (Doctor Role):** Multi-patient overview, instant neural anomaly alerts, and live network node efficiency monitoring.
- **Patient Dashboard:** Live ECG waveform plotting, 30-second intensive snapshot analysis, AI-driven health history logs, and predictive insights.
- **Instant Medical Hailing:** Doctors can toggle their real-time availability; patients can view active physicians and trigger one-tap emergency native dialing.
- **Premium UI/UX:** A stunning, modern dark-themed glassmorphic design optimized for seamless navigation and immediate clinical readability.

## 🛠️ Technology Stack

1. **Frontend Application:** React Native (Expo)
   - *Routing:* React Navigation
   - *Styling:* Custom Vanilla CSS/StyleSheet focusing on High-Contrast Glassmorphism
   - *Visualization:* Real-time Canvas/SVG Graphing
2. **Backend Engine:** Python
   - *IoT Gateway:* Serial communication reading directly from ECG hardware modules (e.g., AD8232).
   - *Signal Processing:* NumPy & SciPy for Digital Signal Processing (DSP).
3. **Cloud Infrastructure:** Firebase
   - *Realtime Database:* Under-50ms latency for streaming sensor data and alerts.
   - *Authentication:* Secure user handling and role association.

## 🚀 Getting Started

### Prerequisites
- Node.js & npm (or yarn/bun)
- Python 3.10+
- An active Firebase Realtime Database and Authentication configuration.

### 1. Starting the Backend API Array
Ensure your ECG hardware is connected to the appropriate serial port.
```bash
# Navigate to the backend directory
cd backend

# Install dependencies (NumPy, SciPy, pyserial, etc.)
pip install -r requirements.txt

# Start the IoT Gateway Listener
python -m gateway.ecg_gateway
```

### 2. Launching the Mobile App (Expo)
```bash
# Navigate to the frontend directory
cd frontend/ecg-monitor-app

# Install dependencies
npm install

# Start the Expo Development Server
npx expo start
```
Scan the QR code printed in the terminal using the Expo Go app on your physical device, or press `a` to run on an Android emulator.

---

> **Disclaimer:** This application is built as an academic proof-of-concept and should not be used as a primary diagnostic tool in place of certified hospital-grade equipment. Always consult a licensed medical professional for cardiac health concerns.
