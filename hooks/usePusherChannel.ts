// src/hooks/usePusherChannel.ts
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { initializePusher, getPusherInstance } from '../app/utils/pusher';

interface PusherEvent {
  eventName: string;
  handler: (data: any) => void;
}

export const usePusherChannel = (events: PusherEvent[]) => {
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const eventsRef = useRef<PusherEvent[]>(events);

  // Mettre à jour la référence des événements
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;
    const channelName = `private-user-${user.id}`;

    const setupPusher = async () => {
      try {
        // Initialiser Pusher
        await initializePusher(Number(user.id));
        const pusher = getPusherInstance();

        if (!mounted || !pusher) return;

        console.log(`🔌 [usePusherChannel] Abonnement au canal: ${channelName}`);

        // Utilisation du registre central pour éviter les doublons
        const { subscribeToChannel } = require('../app/utils/pusher');
        const channel = subscribeToChannel(channelName);

        if (!mounted || !channel) return;
        channelRef.current = channel;

        // Configuration sécurisée des binds
        channel.unbind('pusher:subscription_succeeded');
        channel.bind('pusher:subscription_succeeded', () => {
          console.log(`✅ [usePusherChannel] Abonné avec succès à ${channelName}`);
        });

        channel.unbind('pusher:subscription_error');
        channel.bind('pusher:subscription_error', (error: any) => {
          console.error(`❌ [usePusherChannel] Erreur abonnement:`, error);
        });

        // Bind events
        eventsRef.current.forEach(({ eventName, handler }) => {
          console.log(`🔗 [usePusherChannel] Binding événement: ${eventName}`);
          channel.unbind(eventName); // Évite les handlers en double
          channel.bind(eventName, handler);
        });

      } catch (error) {
        console.error('❌ [usePusherChannel] Erreur setup:', error);
      }
    };

    setupPusher();

    return () => {
      mounted = false;
      if (channelRef.current) {
        console.log(`🧹 [usePusherChannel] Nettoyage events pour ${channelName}`);

        // Unbind tous les événements actuels
        try {
          eventsRef.current.forEach(({ eventName, handler }) => {
            if (channelRef.current && typeof channelRef.current.unbind === 'function') {
              channelRef.current.unbind(eventName, handler);
            }
          });
        } catch (err) {
          console.warn(`⚠️ [usePusherChannel] Erreur lors du unbind events pour ${channelName}:`, err);
        }

        // Unsubscribe du channel
        try {
          if (channelRef.current && typeof channelRef.current.unsubscribe === 'function') {
            channelRef.current.unsubscribe();
          }
        } catch (err) {
          console.warn(`⚠️ [usePusherChannel] Erreur lors du unsubscribe pour ${channelName}:`, err);
        }

        channelRef.current = null;
      }
    };
  }, [user?.id, events]); // Re-run if user or events change
};