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
            // CORRECTION: On applique 'headerShown: false' à tous les onglets ici
            headerShown: false,
            tabBarActiveTintColor: '#FD6A00',
          }}
        >
          {/* Accueil */}
          <Tabs.Screen
            name="accueil"
            options={{
              title: 'Accueil',
              // La ligne 'headerShown: false' est maintenant inutile ici
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
              headerShown: false,
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
              headerShown: false,
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
            // CORRECTION: On applique aussi la correction pour le rôle PARKING
            headerShown: false,
            tabBarActiveTintColor: '#FD6A00',
          }}
        >
          {/* Tableau de bord */}
          <Tabs.Screen
            name="accueil"
            options={{
              title: 'Accueil',
              tabBarIcon: ({ color }) => (
                <FontAwesome size={24} name="home" color={color} />
              ),
            }}
          />
          {/* Réservations */}
          <Tabs.Screen
            name="Reservation"
            options={{
              title: 'Réservation',
              tabBarIcon: ({ color }) => (
                <FontAwesome size={24} name="shopping-cart" color={color} />
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
      console.warn('Rôle non reconnu :', role);
      return null;
  }
}

