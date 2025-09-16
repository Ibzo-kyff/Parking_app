import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="listVoiture" />
      <Stack.Screen name="CreateListingScreen" />
    </Stack>
  );
}