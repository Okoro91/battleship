import SoundManager from "./sound-manager";
import Game from "./game";
import UI from "./ui/mainUI.js";
import "./styles.css";

const soundManager = new SoundManager();
soundManager.loadSounds();
window.soundManager = soundManager;

const game = new Game();
game.initializeGame();

const ui = new UI();
ui.initialize(game);
window.game = game;
window.ui = ui;

console.log("Battleship game initialized!");
console.log("Game controls available on window.game");
console.log("UI controls available on window.ui");
