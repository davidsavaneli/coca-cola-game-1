import { useEffect, useRef } from "react";
import { audioManager } from "../audio/AudioManager";

export function useCatchSound(muted: boolean, throttleMs: number = 80) {
  const lastAtRef = useRef(0);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e?.data?.event !== "CATCH_ITEM_SOUND") return;
      if (muted || !audioManager.isSupported()) return;
      const now = performance.now();
      if (now - lastAtRef.current < throttleMs) return;
      lastAtRef.current = now;
      audioManager.play("catch");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [muted, throttleMs]);
}
