import Game from "./game";
import UI from "./ui";
import "./styles.css";

// Create game instance
const game = new Game();

// Create UI instance
const ui = new UI();

// Initialize game with predetermined ships
const predeterminedShips = [
  { length: 5, x: 0, y: 0, orientation: "horizontal" }, // Carrier
  { length: 4, x: 2, y: 2, orientation: "vertical" }, // Battleship
  { length: 3, x: 4, y: 5, orientation: "horizontal" }, // Cruiser
  { length: 3, x: 6, y: 2, orientation: "vertical" }, // Submarine
  { length: 2, x: 8, y: 6, orientation: "horizontal" }, // Destroyer
];

game.initializeGame(predeterminedShips);

// Initialize UI
ui.initialize(game);

// For debugging/development
window.game = game;
window.ui = ui;

console.log("Battleship game initialized!");
console.log("Game controls available on window.game");
console.log("UI controls available on window.ui");
