import Player from "./player";
import Ship from "./ship";

export default class Game {
  constructor() {
    this.players = [new Player("Human", false), new Player("Computer", true)];
    this.currentPlayerIndex = 0;
    this.gameOver = false;
    this.winner = null;
    this.predeterminedShips = null;
  }

  initializeGame(predeterminedShips = null) {
    this.predeterminedShips = predeterminedShips;

    // Reset game state
    this.gameOver = false;
    this.winner = null;
    this.currentPlayerIndex = 0;

    // Reset players
    this.players.forEach((player) => {
      player.gameboard = new player.gameboard.constructor();
      player.attacksMade = new Set();
      player.availableMoves = player.generateAllCoordinates();
    });

    // Place ships for computer (random)
    this.players[1].placeAllShipsRandomly();

    // Place ships for human
    if (predeterminedShips && predeterminedShips.length > 0) {
      this.placePredeterminedShips();
    } else {
      // Default predetermined ships if none provided
      this.placeDefaultShips();
    }
  }

  placePredeterminedShips() {
    const humanPlayer = this.players[0];

    this.predeterminedShips.forEach((shipConfig) => {
      const ship = new Ship(shipConfig.length);
      humanPlayer.gameboard.placeShip(
        ship,
        shipConfig.x,
        shipConfig.y,
        shipConfig.orientation
      );
    });
  }

  placeDefaultShips() {
    const humanPlayer = this.players[0];
    const defaultShips = [
      { length: 5, x: 0, y: 0, orientation: "horizontal" }, // Carrier
      { length: 4, x: 2, y: 2, orientation: "vertical" }, // Battleship
      { length: 3, x: 4, y: 5, orientation: "horizontal" }, // Cruiser
      { length: 3, x: 6, y: 2, orientation: "vertical" }, // Submarine
      { length: 2, x: 8, y: 6, orientation: "horizontal" }, // Destroyer
    ];

    defaultShips.forEach((shipConfig) => {
      const ship = new Ship(shipConfig.length);
      humanPlayer.gameboard.placeShip(
        ship,
        shipConfig.x,
        shipConfig.y,
        shipConfig.orientation
      );
    });
  }

  switchTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 2;
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  getOpponent() {
    return this.players[(this.currentPlayerIndex + 1) % 2];
  }

  processHumanAttack(x, y) {
    if (this.gameOver) {
      return "game over";
    }

    const humanPlayer = this.players[0];
    const computerPlayer = this.players[1];

    const result = humanPlayer.attack(computerPlayer.gameboard, x, y);

    if (result === "hit" || result === "miss") {
      this.checkGameOver();

      if (!this.gameOver) {
        this.switchTurn();
        // Computer will make its move immediately
        setTimeout(() => this.processComputerAttack(), 500);
      }
    }

    return result;
  }

  processComputerAttack() {
    if (this.gameOver) {
      return "game over";
    }

    const computerPlayer = this.players[1];
    const humanPlayer = this.players[0];

    const result = computerPlayer.attack(humanPlayer.gameboard);

    if (result === "no moves left") {
      this.gameOver = true;
      this.winner = humanPlayer; // Human wins by default
      return result;
    }

    if (result === "hit" || result === "miss") {
      this.checkGameOver();

      if (!this.gameOver) {
        this.switchTurn();
      }
    }

    return result;
  }

  checkGameOver() {
    const humanPlayer = this.players[0];
    const computerPlayer = this.players[1];

    if (humanPlayer.hasLost()) {
      this.gameOver = true;
      this.winner = computerPlayer;
      return true;
    }

    if (computerPlayer.hasLost()) {
      this.gameOver = true;
      this.winner = humanPlayer;
      return true;
    }

    return false;
  }

  isGameOver() {
    return this.checkGameOver();
  }

  resetGame() {
    this.initializeGame(this.predeterminedShips);
  }

  getGameState() {
    return {
      currentPlayer: this.getCurrentPlayer().name,
      gameOver: this.gameOver,
      winner: this.winner ? this.winner.name : null,
      humanBoard: this.players[0].gameboard.getBoardState(),
      computerBoard: this.players[1].gameboard.getBoardState(),
    };
  }
}
