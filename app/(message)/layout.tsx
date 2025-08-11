import { Stack } from 'expo-router';

export default function MessagesChat() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="chatpage" />
      
    </Stack>
  );
}