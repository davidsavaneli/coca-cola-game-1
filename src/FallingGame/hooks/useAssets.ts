import { useEffect, useState } from "react";
import type { GameConfig } from "../types";
import { audioManager } from "../audio/AudioManager";
import { sendPostMessage } from "../helpers.ts";

import logoSrc from "../assets/images/logo.svg";
import playIconSrc from "../assets/images/play-btn-icon.svg";
import playAgainIconSrc from "../assets/images/play-again-icon.svg";

import gameOverSoundUrl from "../assets/sounds/game_over.mp3";
import gameThemeSoundUrl from "../assets/sounds/game_theme_sound.mp3";
import catchSoundUrl from "../assets/sounds/catch_sound.mp3";

const CONFIG_URL = import.meta.env.VITE_GAME_CONFIG_URL;

type ApiResponse = {
  isError: boolean;
  errorMessage: string | null;
  response: GameConfig;
};

const sanitizeConfig = (raw: GameConfig): GameConfig => ({
  ...raw,
  basket: { ...raw.basket },
  item: {
    ...raw.item,
    items: raw.item.items.map((it) => ({
      ...it,
      deduct: (it as any).deduct == null ? undefined : it.deduct,
    })),
  },
  gameSpeed: { ...raw.gameSpeed },
});

const preloadImages = (urls: string[]) =>
  Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        })
    )
  ).then(() => void 0);

export function useAssets() {
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [config, setConfig] = useState<GameConfig | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      let effectiveConfig: GameConfig | null = null;
      try {
        const res = await fetch(`${CONFIG_URL}fallingGame?Id=1`, { cache: "no-store" });
        if (res.ok) {
          const data: ApiResponse = await res.json();
          if (!data.isError && data.response) {
            effectiveConfig = sanitizeConfig(data.response);
            if (!cancelled) setConfig(effectiveConfig);
          }
        }
        if (!res.ok) {
          sendPostMessage("CONFIG_ERROR");
          return;
        }
      } catch {
        // ignore fetch errors
      }

      if (!effectiveConfig) return;

      const urls = new Set<string>([
        logoSrc,
        playIconSrc,
        playAgainIconSrc,
        effectiveConfig.backgroundImage,
        effectiveConfig.basket.basketImage,
      ]);
      effectiveConfig.item.items.forEach((it) => urls.add(it.image));
      await preloadImages([...urls]);

      try {
        const sizes = Array.from(new Set([14, 16, 20, 24, 30, 56])).map((n) => `${n}px`);
        await Promise.all(
          sizes.flatMap((sz) => [
            document.fonts.load(`700 ${sz} 'Agdasima'`),
            document.fonts.load(`900 ${sz} 'Nunito'`),
            document.fonts.load(`600 ${sz} 'Nunito'`),
          ])
        );
        await document.fonts.ready;
      } catch {
        // ignore font load errors
      }

      try {
        if (audioManager.isSupported()) {
          await audioManager.load([
            { name: "catch", url: catchSoundUrl },
            { name: "theme", url: gameThemeSoundUrl },
            { name: "gameover", url: gameOverSoundUrl },
          ]);
        }
      } catch {
        // ignore audio preload errors
      }

      if (!cancelled) setAssetsLoaded(true);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { assetsLoaded, config } as const;
}
