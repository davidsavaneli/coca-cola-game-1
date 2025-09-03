import { useCallback } from "react";
import { audioManager } from "../audio/AudioManager";

type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

export function useToggleMute(setMuted: Setter<boolean>) {
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      audioManager.setMuted(next);
      if (next) {
        audioManager.stopLoop();
      } else {
        audioManager.startLoop("theme");
      }
      return next;
    });
  }, [setMuted]);

  return toggleMute;
}
