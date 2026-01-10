import { useEffect, useRef } from 'react';
import { initializePusher } from '../app/utils/pusher';
import { useAuth } from '../context/AuthContext';

interface EventBinding {
  eventName: string;
  handler: (data: any) => void;
}

/**
 * Hook stabilisé pour Pusher.
 * Écoute le canal "private-user-{id}" avec un tiret pour correspondre au backend.
 */
export const usePusherChannel = (events: EventBinding[]) => {
  const { user } = useAuth();
  const eventsRef = useRef<EventBinding[]>(events);

  // Mise à jour de la référence pour accéder aux derniers handlers sans re-render
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    if (!user || !user.id) return;

    let channel: any;
    let pusher: any;
    const userId = Number(user.id);
    const channelName = `private-user-${userId}`; // IMPORTANT: Tiret (-) pour matcher le backend

    const init = async () => {
      try {
        console.log(`🔌 Pusher: Connexion au canal unique: ${channelName}`);
        pusher = await initializePusher(userId);
        channel = pusher.subscribe(channelName);

        channel.bind('pusher:subscription_succeeded', () => {
          console.log(`✅ [Pusher] Abonnement réussi à ${channelName}`);
        });

        channel.bind('pusher:subscription_error', (status: any) => {
          console.error(`❌ [Pusher] Erreur d'abonnement à ${channelName}:`, status);
        });

        // Binding dynamique via Ref pour éviter les stale closures
        const eventNames = Array.from(new Set(eventsRef.current.map(e => e.eventName)));

        eventNames.forEach(eventName => {
          channel.bind(eventName, (data: any) => {
            console.log(`📡 [Pusher] Événement [${eventName}] reçu sur ${channelName}`);
            eventsRef.current
              .filter(e => e.eventName === eventName)
              .forEach(e => e.handler(data));
          });
        });

      } catch (error) {
        console.error('❌ Pusher error:', error);
      }
    };

    init();

    return () => {
      if (channel) {
        console.log(`🔌 Pusher: Nettoyage (unbind/unsubscribe) de ${channelName}`);
        const eventNames = Array.from(new Set(eventsRef.current.map(e => e.eventName)));
        eventNames.forEach(ename => channel.unbind(ename));
        pusher.unsubscribe(channelName);
      }
    };
  }, [user?.id]); // Ne dépend que de l'ID utilisateur pour la stabilité
};
