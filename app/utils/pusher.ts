import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, getStoredAccessToken } from '../../components/services/api';

let pusherInstance: any = null;

const loadPusher = () => {
  // Use eval('require') to avoid Metro/webpack statically resolving native-only packages
  const dynamicRequire = (name: string) => {
    try {
      // eslint-disable-next-line no-eval
      return eval("require")(name);
    } catch (e) {
      return null;
    }
  };

  // Detect React Native runtime
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    const rnMod = dynamicRequire('pusher-js/react-native');
    if (rnMod) return rnMod && rnMod.default ? rnMod.default : rnMod;
  }

  // Fallback to browser implementation
  const webMod = dynamicRequire('pusher-js') || dynamicRequire('pusher-js/dist/web/pusher');
  if (webMod) return webMod && webMod.default ? webMod.default : webMod;

  throw new Error('Pusher library not available in this environment');
};

export const initializePusher = async (userId: number) => {
  if (pusherInstance) return pusherInstance;

  // try to read the access token stored by the axios api helper
  const token = (await getStoredAccessToken()) || (await AsyncStorage.getItem('token'));

  const Pusher = loadPusher();

  pusherInstance = new Pusher('mt1', {
    cluster: 'mt1',
  authEndpoint: `${API_URL}auth/pusher`,
    auth: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  // pusher-js/react-native and pusher-js have slightly different APIs for
  // connection lifecycle, but both support subscribe and disconnect.
  try {
    if (pusherInstance.connect) {
      // Some RN builds expose connect as async-friendly
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      pusherInstance.connect();
    }
  } catch (e) {
    // ignore
  }

  // subscribe returns a channel object in browser implementation
  try {
    if (pusherInstance.subscribe) {
      pusherInstance.subscribe(`user_${userId}`);
    }
  } catch (e) {
    // ignore
  }

  return pusherInstance;
};

export const cleanupPusher = () => {
  if (pusherInstance) {
    try {
      if (pusherInstance.disconnect) pusherInstance.disconnect();
    } catch (e) {
      // ignore
    }
    pusherInstance = null;
  }
};