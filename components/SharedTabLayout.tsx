import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface SharedTabLayoutProps {
  role: 'CLIENT' | 'PARKING';
}

export default function SharedTabLayout({ role }: SharedTabLayoutProps) {
  const commonOptions = {
    headerShown: false,
    tabBarShowLabel: true,
    tabBarActiveTintColor: '#FD6A00',
    tabBarInactiveTintColor: '#8e8e93',
    tabBarStyle: {
      ...(styles.tabBar as ViewStyle),
    },
    tabBarLabelStyle: {
      fontSize: 10,
      marginBottom: 5,
      fontWeight: '500' as const, 
    },
  };

  const getIcon = (
    name: keyof typeof Ionicons.glyphMap,
    color: string,
    focused: boolean
  ) => (
    <View style={[styles.iconContainer, focused && styles.activeIcon]}>
      <Ionicons 
        name={name} 
        size={24} 
        color={focused ? '#fff' : color} 
      />
    </View>
  );

  switch (role) {
    case 'CLIENT':
      return (
        <Tabs screenOptions={commonOptions}>
          <Tabs.Screen
            name="accueil"
            options={{
              title: 'Accueil',
              tabBarIcon: ({ color, focused }) =>
                getIcon('home', color, focused),
            }}
          />
          <Tabs.Screen
            name="reservation"
            options={{
              title: 'Réservations',
              tabBarIcon: ({ color, focused }) =>
                getIcon('calendar', color, focused),
            }}
          />
          <Tabs.Screen
            name="parking"
            options={{
              title: 'Parkings',
              tabBarIcon: ({ color, focused }) =>
                getIcon('car', color, focused),
            }}
          />
          <Tabs.Screen
            name="messages"
            options={{
              title: 'Messages',
              tabBarIcon: ({ color, focused }) =>
                getIcon('chatbubbles', color, focused),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profil',
              tabBarIcon: ({ color, focused }) =>
                getIcon('person', color, focused),
            }}
          />
        </Tabs>
      );

    case 'PARKING':
      return (
        <Tabs screenOptions={commonOptions}>
          <Tabs.Screen
            name="accueil"
            options={{
              title: 'Accueil',
              tabBarIcon: ({ color, focused }) =>
                getIcon('home', color, focused),
            }}
          />
          <Tabs.Screen
            name="Reservation"
            options={{
              title: 'Réservation',
              tabBarIcon: ({ color, focused }) =>
                getIcon('clipboard', color, focused),
            }}
          />
          <Tabs.Screen
            name="gestion"
            options={{
              title: 'Gestion',
              tabBarIcon: ({ color, focused }) =>
                getIcon('settings', color, focused),
            }}
          />
          <Tabs.Screen
            name="messages"
            options={{
              title: 'Messages',
              tabBarIcon: ({ color, focused }) =>
                getIcon('chatbubbles', color, focused),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profil',
              tabBarIcon: ({ color, focused }) =>
                getIcon('person', color, focused),
            }}
          />
        </Tabs>
      );

    default:
      console.warn('Rôle non reconnu :', role);
      return null;
  }
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 25,
    height: 60, 
    shadowColor: '#000',
    shadowOpacity: 0.2, 
    shadowOffset: { width: 0, height: 8 }, 
    shadowRadius: 15, 
    elevation: 15, 
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 10,
  },
  iconContainer: {
    backgroundColor: 'transparent',
    padding: 8,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: 39,
    height: 39,
    marginTop: 1, 
  },
  activeIcon: {
    backgroundColor: '#FD6A00',
    shadowColor: '#FD6A00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    transform: [{ translateY: -2 }], 
  },
});