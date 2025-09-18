import { Stack } from 'expo-router';

export default function DetailsCarsLayout() {
  return (
    <Stack>
      <Stack.Screen name="CarDetailScreenn" />
      <Stack.Screen name="CreateAnnonce" />
      <Stack.Screen name="DetailParkings" />
    </Stack>
  );
}