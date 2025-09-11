import { useEffect } from "react";

export function useGlobalGameControls(
  handlePauseGame: () => void,
  handleResumeGame: () => void,
  handleSetupCanvas: () => void
) {
  useEffect(() => {
    (window as any).handlePauseGame = handlePauseGame;
    (window as any).handleResumeGame = handleResumeGame;
    (window as any).handleSetupCanvas = handleSetupCanvas;
    return () => {
      try {
        delete (window as any).handlePauseGame;
        delete (window as any).handleResumeGame;
        delete (window as any).handleSetupCanvas;
      } catch {
        /* empty */
      }
    };
  }, [handlePauseGame, handleResumeGame, handleSetupCanvas]);
}
