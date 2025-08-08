// app/tabs/layout.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';


// ✅ Composant d’en-tête (Header)

// ✅ Layout principal
export default function Layout() {
  return (
    <Tabs
      screenOptions={{
  tabBarActiveTintColor: '#FD6A00',
}}
    >
      <Tabs.Screen
        name="accueil"
        options={{
          title: 'Accueil',
           headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservation"
        options={{
          title: 'Réservations',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="shopping-cart" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parking"
        options={{
          title: 'Parking',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="car" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="envelope" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="user" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}


// ✅ StyleSheet pour le design
const styles = StyleSheet.create({
 
});


