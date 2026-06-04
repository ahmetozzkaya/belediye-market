import { useState, useEffect } from 'react';
import { unlockAudio, disableAudio, isAudioUnlocked } from '../services/notify';

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(isAudioUnlocked());

  useEffect(() => {
    // Tercih açıksa ilk kullanıcı etkileşiminde AudioContext'i otomatik unlock et
    if (isAudioUnlocked()) {
      const unlock = () => { unlockAudio(); document.removeEventListener('click', unlock); };
      document.addEventListener('click', unlock);
      return () => document.removeEventListener('click', unlock);
    }
  }, []);

  const toggle = () => {
    if (enabled) {
      disableAudio();
      setEnabled(false);
    } else {
      unlockAudio();
      setEnabled(true);
    }
  };

  return (
    <button onClick={toggle}
      className={`text-xs px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
        enabled
          ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
          : 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
      }`}>
      {enabled ? '🔔 Ses açık' : '🔕 Ses kapalı'}
    </button>
  );
}
