import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function ProfilLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="infopersonnel" 
          options={{ 
            title: 'Informations Personnelles',
            headerShown: true,
            headerBackTitle: 'Retour',
          }} 
        />
        <Stack.Screen 
          name="parametre" 
          options={{
            title: 'Paramètres',
            headerShown: true,
            headerBackTitle: 'Retour',
          }}
        />
        <Stack.Screen 
          name="aide" 
          options={{
            title: 'Aide & Support',
            headerShown: true,
            headerBackTitle: 'Retour',
          }}
        />
      </Stack>
    </View>
  );
}