import { useEffect, useState } from 'react';
import { initializePusher, cleanupPusher } from '../app/utils/pusher';
import { useAuth } from '../context/AuthContext';

type EventHandler = (data: any) => void;

interface EventBinding {
    eventName: string;
    handler: EventHandler;
}

export const usePusherChannel = (events: EventBinding[] = []) => {
    const { user } = useAuth();
    const [pusher, setPusher] = useState<any>(null);

    useEffect(() => {
        if (!user) return;

        let pusherInstance: any = null;
        let channel: any = null;

        const setupPusher = async () => {
            pusherInstance = await initializePusher(user.id);
            setPusher(pusherInstance);

            // S'abonner au channel privé
            const channelName = `private-user_${user.id}`;
            channel = pusherInstance.subscribe(channelName);

            channel.bind('pusher:subscription_succeeded', () => {
                console.log(`✅ Abonné avec succès au channel : ${channelName}`);
            });

            channel.bind('pusher:subscription_error', (status: any) => {
                console.error(`❌ Erreur abonnement channel ${channelName}:`, status);
            });

            // Binder les événements
            events.forEach(({ eventName, handler }) => {
                channel.bind(eventName, (data: any) => {
                    console.log(`📡 Événement Pusher reçu [${eventName}]:`, data);
                    handler(data);
                });
            });
        };

        setupPusher();

        return () => {
            // Nettoyage
            if (channel) {
                events.forEach(({ eventName, handler }) => {
                    channel.unbind(eventName);
                });
                if (pusherInstance) {
                    const channelName = `private-user_${user.id}`;
                    pusherInstance.unsubscribe(channelName);
                }
            }
            // cleanupPusher(); // Optionnel selon si singleton ou non, mais prudent de garder
        };
    }, [user, events]); // Attention: events doit être stable (useMemo ou défini hors render)

    return pusher;
};
