// Utility helpers for the FallingGame app

export const preloadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });

export const loadFont = async (name: string, weight: string) => {
  await (document as Document & { fonts: FontFaceSet }).fonts.load(
    `${weight} 14px '${name}'`
  );
};
