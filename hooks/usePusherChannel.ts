import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { initializePusher } from '../app/utils/pusher';
import { Channel } from 'pusher-js';

interface PusherEvent {
  eventName: string;
  handler: (data: any) => void;
}

export const usePusherChannel = (events: PusherEvent[]) => {
  const { user } = useAuth();
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;
    const channelName = `private-user-${user.id}`;

    const setupPusher = async () => {
      try {
        const pusher = await initializePusher(Number(user.id));

        if (!mounted) return;

        console.log(`🔌 [usePusherChannel] Abonnement au canal: ${channelName}`);
        const channel = pusher.subscribe(channelName);
        channelRef.current = channel;

        // Bind events
        events.forEach(({ eventName, handler }) => {
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
        console.log(`🔌 [usePusherChannel] Nettoyage events pour ${channelName}`);
        events.forEach(({ eventName, handler }) => {
          channelRef.current?.unbind(eventName, handler);
        });
      }
    };
  }, [user?.id, events]);
};
