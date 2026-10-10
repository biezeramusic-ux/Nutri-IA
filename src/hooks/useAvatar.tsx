import { useCallback, useEffect, useState } from 'react';
import { getAvatarUri, removeAvatar, saveAvatar } from '../services/avatar';
import { useAuth } from './useAuth';

export function useAvatar() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    setUri(userId ? getAvatarUri(userId) : null);
  }, [userId]);

  const set = useCallback(
    async (sourceUri: string) => {
      if (!userId) return false;
      const next = await saveAvatar(userId, sourceUri);
      if (next) setUri(next);
      return next !== null;
    },
    [userId],
  );

  const clear = useCallback(() => {
    if (!userId) return;
    removeAvatar(userId);
    setUri(null);
  }, [userId]);

  return { uri, set, clear };
}
