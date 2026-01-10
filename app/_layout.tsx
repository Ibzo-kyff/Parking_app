import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';

function AppContent() {
  usePushNotifications();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        {/* On retire les noms explicites qui causent des warnings si Expo Router les gère déjà */}
        <Stack.Screen name="tabs" />
      </Stack>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}