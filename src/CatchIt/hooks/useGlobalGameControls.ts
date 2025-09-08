import { useEffect } from "react";

export function useGlobalGameControls(
  handlePauseGame: () => void,
  handleResumeGame: () => void
) {
  useEffect(() => {
    (window as any).handlePauseGame = handlePauseGame;
    (window as any).handleResumeGame = handleResumeGame;
    return () => {
      try {
        delete (window as any).handlePauseGame;
        delete (window as any).handleResumeGame;
      } catch {
        /* empty */
      }
    };
  }, [handlePauseGame, handleResumeGame]);
}
