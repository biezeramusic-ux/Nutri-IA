import { useCallback, useEffect, useState } from 'react';
import { ensureNotificationPermission } from '../services/notifications';

/** Indica se as notificações estão permitidas neste telemóvel (sem pedir permissão). */
export function useNotificationPermission() {
  const [granted, setGranted] = useState(false);
  const refresh = useCallback(async () => setGranted(await ensureNotificationPermission(false)), []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { granted, refresh };
}
