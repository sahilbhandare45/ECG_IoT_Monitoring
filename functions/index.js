const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.ecgAlert = functions.database
    .ref("/ecg_data/patient_01/status")
    .onUpdate((change, context) => {
      const status = change.after.val();

      if (status === "ALERT") {
        const payload = {
          notification: {
            title: "⚠ Cardiac Alert",
            body: "Abnormal heart rate detected",
          },
        };

        return admin.messaging().sendToTopic("ecg_alerts", payload);
      }

      return null;
    });
