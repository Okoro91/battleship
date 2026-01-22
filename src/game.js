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

    this.gameOver = false;
    this.winner = null;
    this.currentPlayerIndex = 0;

    this.players.forEach((player) => {
      if (player.gameboard && player.gameboard.constructor) {
        player.gameboard = new player.gameboard.constructor();
      }

      player.attacksMade = new Set();

      if (typeof player.generateAllCoordinates === "function") {
        player.availableMoves = player.generateAllCoordinates();
      } else {
        player.availableMoves = Array.from({ length: 100 }, (_, index) => [
          Math.floor(index / 10),
          index % 10,
        ]);
      }
    });

    if (this.players[1].placeAllShipsRandomly) {
      this.players[1].placeAllShipsRandomly();
    }

    if (predeterminedShips && predeterminedShips.length > 0) {
      this.placePredeterminedShips();
    } else {
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
      return { result: "game over" };
    }
    if (this.getCurrentPlayer().name !== "Human") {
      return { result: "not your turn" };
    }

    const humanPlayer = this.players[0];
    const computerPlayer = this.players[1];

    const result = humanPlayer.attack(computerPlayer.gameboard, x, y);

    if (result === "hit" || result === "miss" || result === "sunk") {
      this.checkGameOver();
      if (!this.gameOver && result === "miss") {
        this.switchTurn();
        return { result, nextPlayer: "computer" };
      }

      return { result, nextPlayer: "human" };
    }

    return { result };
  }

  processComputerAttack() {
    if (this.gameOver) {
      return { result: "game over" };
    }
    if (this.getCurrentPlayer().name !== "Computer") {
      return { result: "not your turn" };
    }

    const computerPlayer = this.players[1];
    const humanPlayer = this.players[0];

    const result = computerPlayer.attack(humanPlayer.gameboard);

    if (result === "no moves left") {
      this.gameOver = true;
      this.winner = humanPlayer;
      return { result: "no moves left" };
    }

    if (result === "hit" || result === "miss" || result === "sunk") {
      this.checkGameOver();

      if (!this.gameOver) {
        if (result === "miss") {
          this.switchTurn();
          return { result, nextPlayer: "human" };
        }
        return { result, nextPlayer: "computer" };
      }
    }

    return { result };
  }

  getLastComputerAttack() {
    const computerPlayer = this.players[1];
    const attacks = Array.from(computerPlayer.attacksMade);
    if (attacks.length === 0) return null;

    const lastAttack = attacks[attacks.length - 1];
    const [x, y] = lastAttack.split(",").map(Number);
    return { x, y };
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
