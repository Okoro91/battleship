import Gameboard from "./gameboard";
import Ship from "./ship";

export default class Player {
  constructor(name, isComputer = false) {
    this.name = name;
    this.isComputer = isComputer;
    this.gameboard = new Gameboard();
    this.attacksMade = new Set();
    this.availableMoves = this.generateAllCoordinates();

    this.targetMode = false;
    this.lastHit = null;
    this.targetDirection = null;
    this.targetStack = [];
    this.huntModeMoves = [];
    this.initializedHuntMode = false;

    this.shipHits = [];
    this.shipDirection = null;
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
      throw new Error("Player must provide coordinates");
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

    let x, y;

    if (this.targetMode && this.shipDirection) {
      [x, y] = this.getNextInDirection();
    } else if (this.targetMode && this.targetStack.length > 0) {
      [x, y] = this.getTargetModeMove();
    } else {
      [x, y] = this.getHuntModeMove();
    }

    if (x === undefined || y === undefined) {
      [x, y] = this.getRandomMove();
    }

    this.removeAvailableMove(x, y);
    const result = opponentBoard.receiveAttack(x, y);
    this.attacksMade.add(`${x},${y}`);

    this.updateAIState(x, y, result, opponentBoard);

    this.lastAttack = { x, y, result };

    return result;
  }

  getLastAttack() {
    return this.lastAttack || null;
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

  getHuntModeMove() {
    if (this.huntModeMoves.length === 0) {
      this.huntModeMoves = this.generateCheckerboardPattern();
    }

    for (let i = 0; i < this.huntModeMoves.length; i++) {
      const [x, y] = this.huntModeMoves[i];
      const key = `${x},${y}`;
      if (!this.attacksMade.has(key) && this.isValidCoordinate(x, y)) {
        return this.huntModeMoves.splice(i, 1)[0];
      }
    }

    return this.getRandomMove();
  }

  generateCheckerboardPattern() {
    const pattern = [];
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        if ((x + y) % 2 === 0) {
          pattern.push([x, y]);
        }
      }
    }

    for (let i = pattern.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pattern[i], pattern[j]] = [pattern[j], pattern[i]];
    }

    return pattern;
  }

  getTargetModeMove() {
    while (this.targetStack.length > 0) {
      const [x, y] = this.targetStack.shift();
      const key = `${x},${y}`;

      if (!this.attacksMade.has(key) && this.isValidCoordinate(x, y)) {
        return [x, y];
      }
    }

    this.targetMode = false;
    this.lastHit = null;
    return this.getHuntModeMove();
  }

  getNextInDirection() {
    if (!this.shipDirection || this.shipHits.length === 0) {
      return this.getTargetModeMove();
    }

    const lastHit = this.shipHits[this.shipHits.length - 1];
    const [dx, dy] = this.shipDirection;

    let nextX = lastHit.x + dx;
    let nextY = lastHit.y + dy;

    for (let i = 0; i < 5; i++) {
      if (this.isValidCoordinate(nextX, nextY)) {
        const key = `${nextX},${nextY}`;
        if (!this.attacksMade.has(key)) {
          return [nextX, nextY];
        }
      }
      nextX += dx;
      nextY += dy;
    }

    const firstHit = this.shipHits[0];
    nextX = firstHit.x - dx;
    nextY = firstHit.y - dy;

    for (let i = 0; i < 5; i++) {
      if (this.isValidCoordinate(nextX, nextY)) {
        const key = `${nextX},${nextY}`;
        if (!this.attacksMade.has(key)) {
          return [nextX, nextY];
        }
      }
      nextX -= dx;
      nextY -= dy;
    }
    this.shipDirection = null;
    return this.getTargetModeMove();
  }

  generateAdjacentMoves(x, y) {
    const directions = [
      [0, 1], // right
      [1, 0], // down
      [0, -1], // left
      [-1, 0], // up
    ];

    if (this.shipDirection) {
      const [dx, dy] = this.shipDirection;

      let forwardX = x + dx;
      let forwardY = y + dy;
      if (this.isValidCoordinate(forwardX, forwardY)) {
        this.targetStack.push([forwardX, forwardY]);
      }

      const firstHit = this.shipHits[0];
      if (firstHit) {
        let backwardX = firstHit.x - dx;
        let backwardY = firstHit.y - dy;
        if (this.isValidCoordinate(backwardX, backwardY)) {
          this.targetStack.push([backwardX, backwardY]);
        }
      }

      return;
    }

    directions.forEach(([dx, dy]) => {
      const newX = x + dx;
      const newY = y + dy;

      if (this.isValidCoordinate(newX, newY)) {
        const key = `${newX},${newY}`;
        if (!this.attacksMade.has(key)) {
          this.targetStack.push([newX, newY]);
        }
      }
    });
  }

  updateAIState(x, y, result, opponentBoard) {
    if (!this.isComputer) return;

    const coordinateKey = `${x},${y}`;

    if (result === "hit") {
      this.targetMode = true;

      this.shipHits.push({ x, y });

      if (this.shipHits.length >= 2) {
        const firstHit = this.shipHits[0];
        const secondHit = this.shipHits[1];

        const dx = secondHit.x - firstHit.x;
        const dy = secondHit.y - firstHit.y;

        if (dx !== 0) {
          this.shipDirection = [dx > 0 ? 1 : -1, 0];
        } else if (dy !== 0) {
          this.shipDirection = [0, dy > 0 ? 1 : -1];
        }

        this.generateAdjacentMoves(x, y);
      } else {
        this.generateAdjacentMoves(x, y);
      }

      this.lastHit = { x, y };
    } else if (result === "sunk") {
      this.targetMode = false;
      this.shipHits = [];
      this.shipDirection = null;
      this.targetStack = [];
      this.lastHit = null;
    } else if (result === "miss") {
      if (this.targetMode && this.shipDirection) {
        const [dx, dy] = this.shipDirection;
        this.shipDirection = [-dx, -dy];
      }
    }
  }

  isValidCoordinate(x, y) {
    return x >= 0 && x < 10 && y >= 0 && y < 10;
  }

  getRandomMove() {
    if (this.availableMoves.length === 0) return [null, null];
    const availableMoves = this.availableMoves.filter(([x, y]) => {
      const key = `${x},${y}`;
      return !this.attacksMade.has(key);
    });

    if (availableMoves.length === 0) return [null, null];

    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    const [x, y] = availableMoves[randomIndex];

    this.removeAvailableMove(x, y);

    return [x, y];
  }
}
