import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useOnline(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
}
