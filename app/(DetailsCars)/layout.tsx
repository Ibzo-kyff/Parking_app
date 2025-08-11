import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CarDetailScreenn" />
      <Stack.Screen name="CreateAnnonce" />
    </Stack>
  );
}