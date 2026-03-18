import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import DashboardScreen from './src/screens/DashboardScreen';

export default function App() {
  return (
    <View style={styles.container}>
      <DashboardScreen />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
