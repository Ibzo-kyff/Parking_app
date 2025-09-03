import { Stack } from 'expo-router';

export default function DetailsCarsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      
      <Stack.Screen name="PourVous" />
 
    </Stack>
  );
}


