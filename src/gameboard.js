import Ship from "./ship";

export default class Gameboard {
  constructor(size = 10) {
    this.size = size;
    this.board = this.createEmptyBoard();
    this.ships = [];
    this.missedAttacks = [];
    this.attackedCoordinates = new Set();
  }

  createEmptyBoard() {
    return Array.from({ length: this.size }, () => Array(this.size).fill(null));
  }

  placeShip(ship, x, y, orientation) {
    // Validate inputs
    if (!(ship instanceof Ship) || ship.length < 1) return false;
    if (!["horizontal", "vertical"].includes(orientation)) return false;
    if (!this.isWithinBounds(x, y)) return false;

    // Calculate all coordinates the ship will occupy
    const coordinates = Array.from({ length: ship.length }, (_, i) => {
      if (orientation === "horizontal") {
        return [x, y + i];
      }
      return [x + i, y];
    });

    // Check if all coordinates are valid and not occupied
    const areAllValid = coordinates.every(
      ([newX, newY]) =>
        this.isWithinBounds(newX, newY) && this.board[newX][newY] === null
    );

    if (!areAllValid) return false;

    // Place the ship on the board
    coordinates.forEach(([shipX, shipY]) => {
      this.board[shipX][shipY] = ship;
    });

    this.ships.push(ship);
    return true;
  }

  receiveAttack(x, y) {
    // Validate coordinates
    if (!this.isWithinBounds(x, y)) {
      return "invalid coordinates";
    }

    const coordinateKey = `${x},${y}`;
    if (this.attackedCoordinates.has(coordinateKey)) {
      return "already attacked";
    }

    this.attackedCoordinates.add(coordinateKey);

    const target = this.board[x][y];
    if (target instanceof Ship) {
      target.hit();

      // Check if this hit sunk the ship
      if (target.isSunk()) {
        return "sunk";
      }

      return "hit";
    } else {
      this.missedAttacks.push([x, y]);
      return "miss";
    }
  }

  allShipsSunk() {
    if (this.ships.length === 0) return true;
    return this.ships.every((ship) => ship.isSunk());
  }

  getBoardState() {
    return this.board.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const coordinateKey = `${rowIndex},${colIndex}`;

        if (cell instanceof Ship) {
          return this.attackedCoordinates.has(coordinateKey) ? "hit" : "ship";
        }

        return this.attackedCoordinates.has(coordinateKey) ? "miss" : "empty";
      })
    );
  }

  isWithinBounds(x, y) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }
}
