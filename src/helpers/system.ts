export const playAlertSound = (level: number) => {
  const audio = new Audio(`/crypto-alert/sound${level}.mp3`);
  audio.play();
};
