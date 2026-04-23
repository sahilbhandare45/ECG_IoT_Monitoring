import { Platform } from "react-native";
import Constants from "expo-constants";

const config = (() => {
  let ip = "192.168.0.38"; // Corrected Wi-Fi IP
  let port = "8081";

  try {
    // In SDK 50+, Constants.manifest is deprecated, use Constants.expoConfig
    const host = Constants?.expoConfig?.hostUri || Constants?.experienceUrl;
    if (host && host.includes(":")) {
      const parts = host.split(":");
      ip = parts[0];
      port = parts[1] || "8081";
    }
  } catch (e) {
    // ignore
  }

  return { ip, port };
})();

export const NETWORK_IP = config.ip;
export const BASE_URL = `http://${config.ip}:${config.port}`;
