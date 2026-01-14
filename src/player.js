import Gameboard from "./gameboard";
import Ship from "./ship";

export default class Player {
  constructor(name, isComputer = false) {
    this.name = name;
    this.isComputer = isComputer;
    this.gameboard = new Gameboard();
    this.attacksMade = new Set();
    this.availableMoves = this.generateAllCoordinates();
  }

  generateAllCoordinates() {
    return Array.from({ length: 100 }, (_, index) => [
      Math.floor(index / 10),
      index % 10,
    ]);
  }

  attack(opponentBoard, x = null, y = null) {
    return this.isComputer
      ? this.computerAttack(opponentBoard)
      : this.humanAttack(opponentBoard, x, y);
  }

  humanAttack(opponentBoard, x, y) {
    if (x === null || y === null) {
      throw new Error("Human player must provide coordinates");
    }

    const coordinateKey = `${x},${y}`;

    if (this.attacksMade.has(coordinateKey)) {
      return "already attacked";
    }

    const result = opponentBoard.receiveAttack(x, y);

    if (result !== "invalid coordinates") {
      this.attacksMade.add(coordinateKey);
      this.removeAvailableMove(x, y);
    }

    return result;
  }

  computerAttack(opponentBoard) {
    if (this.availableMoves.length === 0) {
      return "no moves left";
    }

    const randomIndex = Math.floor(Math.random() * this.availableMoves.length);
    const [x, y] = this.availableMoves[randomIndex];

    this.availableMoves.splice(randomIndex, 1);

    const result = opponentBoard.receiveAttack(x, y);
    this.attacksMade.add(`${x},${y}`);

    return result;
  }

  removeAvailableMove(x, y) {
    const index = this.availableMoves.findIndex(
      ([ax, ay]) => ax === x && ay === y
    );
    if (index !== -1) {
      this.availableMoves.splice(index, 1);
    }
  }

  placeShipRandomly(ship, maxAttempts = 1000) {
    const orientations = ["horizontal", "vertical"];

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.floor(Math.random() * 10);
      const y = Math.floor(Math.random() * 10);
      const orientation = orientations[Math.floor(Math.random() * 2)];

      if (this.gameboard.placeShip(ship, x, y, orientation)) {
        return true;
      }
    }

    return false;
  }

  isAllShipsPlaced() {
    const standardShips = [5, 4, 3, 3, 2];
    const placedShips = this.gameboard.ships;

    if (placedShips.length !== standardShips.length) {
      return false;
    }

    const placedLengths = placedShips.map((ship) => ship.length).sort();
    const requiredLengths = [...standardShips].sort();

    return placedLengths.every(
      (length, index) => length === requiredLengths[index]
    );
  }

  getAvailableMoves() {
    return [...this.availableMoves];
  }

  hasLost() {
    return this.gameboard.allShipsSunk();
  }

  placeAllShipsRandomly() {
    const shipLengths = [5, 4, 3, 3, 2];
    return shipLengths.every((length) => {
      const ship = new Ship(length);
      return this.placeShipRandomly(ship);
    });
  }
}
