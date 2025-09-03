import CryptoJS from "crypto-js";

export const sendPostMessage = (eventName: string, payload: any = null) => {
  window.postMessage({ event: eventName, payload });
};

export const ENCRYPT_KEY: string = import.meta.env.VITE_ENCRYPT_KEY as string;

export const encryptScore = (score: number): string => {
  return CryptoJS.AES.encrypt(score.toString(), ENCRYPT_KEY).toString();
};
