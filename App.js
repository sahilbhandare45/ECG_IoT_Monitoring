import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./navigation/RootNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";
// Notifications disabled for Expo Go apk-run compatibility
// import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { View, Text, StyleSheet } from "react-native";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("App error caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>Please restart the app.</Text>
          <Text style={styles.errorDetail}>{String(this.state.error)}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  // Notifications disabled for Expo Go compatibility
  useEffect(() => {
    // Basic check for app ownership if notifications were to be added back
    // if (Constants.appOwnership !== 'expo') { ... }
  }, []);

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#111",
  },
  errorTitle: {
    color: "#f66",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
  },
  errorDetail: {
    color: "#ccc",
    fontSize: 12,
    textAlign: "center",
    marginHorizontal: 10,
  },
});