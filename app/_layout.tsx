import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
    <SafeAreaView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false, // Masquer les en-têtes par défaut
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="tabs" />
        <Stack.Screen name="(Parking)" />
        <Stack.Screen name="(Client)" />
      </Stack>
    </SafeAreaView>
    </AuthProvider>
  );
}