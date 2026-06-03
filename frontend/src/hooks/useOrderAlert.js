import { useState, useEffect, useRef } from 'react';

// alertState: 'none' | 'banner' | 'mini'
export function useOrderAlert() {
  const [alertState, setAlertState] = useState('none');
  const timerRef = useRef(null);

  const trigger = () => {
    clearTimeout(timerRef.current);
    setAlertState('banner');
    timerRef.current = setTimeout(() => setAlertState('mini'), 10000);
  };

  const dismiss = () => {
    clearTimeout(timerRef.current);
    setAlertState('none');
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { alertState, trigger, dismiss };
}
