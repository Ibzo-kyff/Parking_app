import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="OnboardingScreen" />
      <Stack.Screen name="LoginScreen" />
      <Stack.Screen name="RegisterScreen" />
      <Stack.Screen name="ForgotPasswordScreen" />
      <Stack.Screen name="resetPassword" />
      <Stack.Screen name="VerifyEmailScreen" />
    </Stack>
  );
}