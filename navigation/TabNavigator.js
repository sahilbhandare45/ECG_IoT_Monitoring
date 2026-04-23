import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";

import Dashboard from "../screens/DashboardScreen";
import ECG from "../screens/ECGScreen";
import Insights from "../screens/InsightsScreen";
import History from "../screens/HistoryScreen";

import { theme } from "../theme/theme";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarShowLabel: true,

        tabBarStyle: styles.tabBar,

        tabBarLabelStyle: styles.tabLabel,

        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,

        tabBarIcon: ({ focused }) => {
          let iconName;
          if (route.name === "Dashboard") iconName = "grid";
          if (route.name === "ECG") iconName = "heart";
          if (route.name === "Insights") iconName = "analytics";
          if (route.name === "History") iconName = "time";

          return (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons
                name={iconName}
                size={22}
                color={focused ? theme.colors.primary : theme.colors.textMuted}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{ tabBarLabel: "STATUS" }}
      />
      <Tab.Screen
        name="ECG"
        component={ECG}
        options={{ tabBarLabel: "ECG" }}
      />
      <Tab.Screen
        name="Insights"
        component={Insights}
        options={{ tabBarLabel: "TRENDS" }}
      />
      <Tab.Screen
        name="History"
        component={History}
        options={{ tabBarLabel: "LOGS" }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: theme.colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    paddingBottom: 12,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 30,
    borderRadius: 15,
  },
  iconContainerActive: {
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});