import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native';

export default function Layout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false, // Masquer les en-têtes par défaut
        }}
      >

        <Stack.Screen name="(auth)" />

        <Stack.Screen name="index" />

      </Stack>
    </SafeAreaView>
  );
}