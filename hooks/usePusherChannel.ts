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

        let channel: any = null;
        let bindings: { eventName: string; handler: (data: any) => void }[] = [];

        const setupPusher = async () => {
            const pusherInstance = await initializePusher(user.id);
            setPusher(pusherInstance);

            const channelName = `user_${user.id}`;
            channel = pusherInstance.subscribe(channelName);

            // Log de succès
            channel.bind('pusher:subscription_succeeded', () => {
                console.log(`✅ Abonné avec succès au channel : ${channelName}`);
            });

            channel.bind('pusher:subscription_error', (status: any) => {
                console.error(`❌ Erreur abonnement channel ${channelName}:`, status);
            });

            // Binder les événements avec des wrappers pour le log et typage
            bindings = events.map(({ eventName, handler }) => {
                const wrapper = (data: any) => {
                    console.log(`📡 Événement Pusher reçu [${eventName}]:`, data);
                    handler(data);
                };
                channel.bind(eventName, wrapper);
                return { eventName, handler: wrapper };
            });
        };

        setupPusher();

        return () => {
            if (channel) {
                // Unbind spécifique pour ne pas casser les autres listeners sur le même channel
                bindings.forEach(({ eventName, handler }) => {
                    channel.unbind(eventName, handler);
                });
                // On ne se désabonne PAS du channel ici car initializePusher renvoie un singleton
                // et d'autres composants peuvent utiliser le même channel.
                // Le désabonnement global se fait ailleurs ou on laisse la connexion active.
            }
        };
    }, [user, events]);

    return pusher;
};
