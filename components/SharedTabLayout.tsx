// app/components/SharedTabLayout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface SharedTabLayoutProps {
  role: 'CLIENT' | 'PARKING';
}

export default function SharedTabLayout({ role }: SharedTabLayoutProps) {

  switch (role) {
    case 'CLIENT':
      return (
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#FD6A00',
          }}
        >
          {/* Accueil */}
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
          {/* Réservations */}
          <Tabs.Screen
            name="reservation"
            options={{
              title: 'Réservations',
              tabBarIcon: ({ color }) => (
                <FontAwesome size={24} name="shopping-cart" color={color} />
              ),
            }}
          />
          {/* Parkings */}
          <Tabs.Screen
            name="parking"
            options={{
              title: 'Parkings',
              tabBarIcon: ({ color }) => (
                <FontAwesome size={24} name="car" color={color} />
              ),
            }}
          />
          {/* Messages */}
          <Tabs.Screen
            name="messages"
            options={{
              title: 'Messages',
              tabBarIcon: ({ color }) => (
                <FontAwesome size={24} name="envelope" color={color} />
              ),
            }}
          />
          {/* Profil */}
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

    case 'PARKING':
      return (
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#FD6A00',
          }}
        >
          {/* Tableau de bord */}
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
          {/* Statistiques */}
          <Tabs.Screen
            name="statistiques"
            options={{
              title: 'Statistiques',
              tabBarIcon: ({ color }) => (
                <FontAwesome size={24} name="line-chart" color={color} />
              ),
            }}
          />
          {/* Gestion */}
          <Tabs.Screen
            name="gestion"
            options={{
              title: 'Gestion',
              tabBarIcon: ({ color }) => (
                <FontAwesome size={24} name="calendar" color={color} />
              ),
            }}
          />
          {/* Messages */}
          <Tabs.Screen
            name="messages"
            options={{
              title: 'Messages',
              tabBarIcon: ({ color }) => (
                <FontAwesome size={24} name="envelope" color={color} />
              ),
            }}
          />
          {/* Profil */}
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

    default:
      // Fallback si rôle non reconnu (ex. undefined) : affiche un menu vide ou redirige
      console.warn('Rôle non reconnu :', role);
      return null; // Ou affichez un message d'erreur / redirigez vers login
  }
}