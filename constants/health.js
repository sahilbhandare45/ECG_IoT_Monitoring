export const HEALTH_THRESHOLDS = {
  LOW: 60,
  HIGH: 100,
  CRITICAL_LOW: 45,
  CRITICAL_HIGH: 120,
};

export const MEDICAL_ADVICE = {
  NORMAL: {
    status: "NORMAL",
    advice: "Your heart rate is within a healthy range. Keep it up!",
    icon: "checkmark-circle",
    precautions: [
      "Avoid excessive caffeine or stimulants.",
      "Maintain a regular sleep schedule.",
      "Stay hydrated throughout the day.",
    ],
  },
  LOW: {
    status: "LOW (BRADYCARDIA)",
    advice: "Your heart rate is below the normal range. Please rest.",
    icon: "alert-circle",
    precautions: [
      "Avoid sudden movements or standing up quickly.",
      "Consult a doctor if you feel dizzy or lightheaded.",
      "Check your medications for bradycardia side effects.",
    ],
  },
  HIGH: {
    status: "HIGH (TACHYCARDIA)",
    advice: "Your heart rate is elevated. Try to relax and breathe deeply.",
    icon: "warning",
    precautions: [
      "Try the Valsalva maneuver or deep breathing exercises.",
      "Avoid all stimulants, including caffeine and tobacco.",
      "Seek medical attention if you experience chest pain.",
    ],
  },
};

export const MOCK_PATIENT = {
  id: "#ECG-9921",
  name: "John Doe",
  age: 45,
  gender: "Male",
  condition: "Stable",
};
