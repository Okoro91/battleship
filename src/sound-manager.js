import hit from "./assets/audio/hit.mp3";
import miss from "./assets/audio/miss.mp3";
import sunk from "./assets/audio/sunk.mp3";
import place from "./assets/audio/place.wav";
import invalid from "./assets/audio/invalid.wav";
import rotate from "./assets/audio/rotate.wav";
import gameover from "./assets/audio/gameover.mp3";

export default class SoundManager {
  constructor() {
    this.sounds = {};
    this.muted = false;
  }

  loadSounds() {
    const soundFiles = {
      hit: hit,
      miss: miss,
      sunk: sunk,
      place: place,
      invalid: invalid,
      rotate: rotate,
      gameover: gameover,
    };

    Object.entries(soundFiles).forEach(([name, path]) => {
      this.sounds[name] = new Audio(path);
      this.sounds[name].load();
    });
  }

  play(soundName) {
    if (!this.muted && this.sounds[soundName]) {
      // Clone the audio to allow rapid re-triggering (for multiple hits)
      const soundClone = this.sounds[soundName].cloneNode();
      soundClone.play().catch((e) => console.log("Audio play failed:", e));
    }
  }

  toggleMute() {
    this.muted = !this.muted;
  }
}
