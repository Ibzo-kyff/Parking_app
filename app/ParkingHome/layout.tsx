import { Stack } from 'expo-router';

export default function HomeParking() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Accueil" />
    </Stack>
  );
}