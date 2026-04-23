import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import RoleSelectionScreen from "../screens/RoleSelectionScreen";
import TabNavigator from "./TabNavigator";
import DoctorTabNavigator from "./DoctorTabNavigator";
import AlertScreen from "../screens/AlertScreen";
import PatientDetail from "../screens/PatientDetail";
import LogDetailScreen from "../screens/LogDetailScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >

      {/* Auth Flow */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />

      {/* Patient Flow */}
      <Stack.Screen name="PatientTabs" component={TabNavigator} />

      {/* Doctor Flow */}
      <Stack.Screen name="DoctorTabs" component={DoctorTabNavigator} />

      {/* Shared Screens */}
      <Stack.Screen name="Alert" component={AlertScreen} />
      <Stack.Screen name="PatientDetail" component={PatientDetail} />
      <Stack.Screen name="LogDetail" component={LogDetailScreen} />

    </Stack.Navigator>
  );
}