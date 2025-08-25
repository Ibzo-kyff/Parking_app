import { Stack } from 'expo-router';

export default function Rootlayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen name="AjoutParking" />
    </Stack>
  );
}