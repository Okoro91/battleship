import Gameboard from "./gameboard";
import Ship from "./ship";

export default class Player {
  constructor(name, isComputer = false) {
    this.name = name;
    this.isComputer = isComputer;
    this.gameboard = new Gameboard();
    this.attacksMade = new Set();
    this.availableMoves = this.generateAllCoordinates();

    // AI properties for smarter targeting
    this.targetMode = false;
    this.lastHit = null;
    this.targetDirection = null;
    this.targetStack = [];
    this.huntModeMoves = [];
    this.initializedHuntMode = false;
  }

  generateAllCoordinates() {
    // Return all 100 coordinates, not just checkerboard
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

    let x, y;

    // Choose move based on AI state
    if (this.targetMode && this.lastHit) {
      [x, y] = this.getTargetModeMove();
    } else {
      [x, y] = this.getHuntModeMove();
    }

    // If no valid move found, get random move
    if (x === undefined || y === undefined) {
      [x, y] = this.getRandomMove();
    }

    // Remove from available moves if not already removed
    this.removeAvailableMove(x, y);

    const result = opponentBoard.receiveAttack(x, y);
    this.attacksMade.add(`${x},${y}`);

    // Update AI state
    this.updateAIState(x, y, result, opponentBoard);

    // Store last attack coordinates
    this.lastAttack = { x, y, result };

    return result;
  }

  // Add this to the Player class
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

  // AI: Hunt mode - random attacks until first hit
  getHuntModeMove() {
    if (this.huntModeMoves.length === 0) {
      // Initialize hunt mode with a checkerboard pattern for better odds
      this.huntModeMoves = this.generateCheckerboardPattern();
    }

    // Try to find a valid move in hunt mode
    for (let i = 0; i < this.huntModeMoves.length; i++) {
      const [x, y] = this.huntModeMoves[i];
      const key = `${x},${y}`;
      if (!this.attacksMade.has(key) && this.isValidCoordinate(x, y)) {
        return this.huntModeMoves.splice(i, 1)[0];
      }
    }

    // If no hunt mode moves left, fall back to random from availableMoves
    return this.getRandomMove();
  }

  // Generate checkerboard pattern for more efficient hunting
  generateCheckerboardPattern() {
    const pattern = [];
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        // Every other square (like a chessboard) increases hit probability
        if ((x + y) % 2 === 0) {
          pattern.push([x, y]);
        }
      }
    }

    // Shuffle the pattern
    for (let i = pattern.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pattern[i], pattern[j]] = [pattern[j], pattern[i]];
    }

    return pattern;
  }

  // AI: Target mode - when we've hit a ship, try adjacent cells
  getTargetModeMove() {
    if (this.targetStack.length === 0 && this.lastHit) {
      // Generate adjacent moves around the last hit
      this.generateAdjacentMoves(this.lastHit.x, this.lastHit.y);
    }

    // Try moves from target stack
    while (this.targetStack.length > 0) {
      const [x, y] = this.targetStack.shift();
      const key = `${x},${y}`;

      if (!this.attacksMade.has(key) && this.isValidCoordinate(x, y)) {
        return [x, y];
      }
    }

    // If target stack is empty but we're still in target mode,
    // switch back to hunt mode
    this.targetMode = false;
    this.lastHit = null;
    this.targetDirection = null;
    return this.getHuntModeMove();
  }

  // Generate adjacent moves around a hit
  generateAdjacentMoves(x, y) {
    const directions = [
      [0, 1], // right
      [1, 0], // down
      [0, -1], // left
      [-1, 0], // up
    ];

    // If we have a direction, prioritize that direction
    if (this.targetDirection) {
      const [dx, dy] = this.targetDirection;
      const newX = x + dx;
      const newY = y + dy;

      if (this.isValidCoordinate(newX, newY)) {
        this.targetStack.push([newX, newY]);
      }

      // Also try the opposite direction
      const oppositeX = this.lastHit.x - dx;
      const oppositeY = this.lastHit.y - dy;

      if (this.isValidCoordinate(oppositeX, oppositeY)) {
        this.targetStack.push([oppositeX, oppositeY]);
      }

      return;
    }

    // Otherwise, try all four directions
    directions.forEach(([dx, dy]) => {
      const newX = x + dx;
      const newY = y + dy;

      if (this.isValidCoordinate(newX, newY)) {
        this.targetStack.push([newX, newY]);
      }
    });
  }

  // Update AI state based on attack result
  updateAIState(x, y, result, opponentBoard) {
    if (!this.isComputer) return;

    const key = `${x},${y}`;

    if (result === "hit") {
      // Enter or stay in target mode
      this.targetMode = true;

      if (this.lastHit) {
        // We have multiple hits, try to determine direction
        const dx = x - this.lastHit.x;
        const dy = y - this.lastHit.y;

        // If we have a clear direction (not diagonal)
        if (
          (dx === 0 && Math.abs(dy) === 1) ||
          (dy === 0 && Math.abs(dx) === 1)
        ) {
          this.targetDirection = [dx, dy];
        }
      }

      this.lastHit = { x, y };
    } else if (result === "sunk") {
      // Ship sunk, reset target mode
      this.targetMode = false;
      this.lastHit = null;
      this.targetDirection = null;
      this.targetStack = [];
    }
    // For miss, no state change needed
  }

  // Check if coordinate is valid
  isValidCoordinate(x, y) {
    return x >= 0 && x < 10 && y >= 0 && y < 10;
  }

  // Get a random move (fallback)
  getRandomMove() {
    if (this.availableMoves.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * this.availableMoves.length);
    const [x, y] = this.availableMoves[randomIndex];

    // Remove from available moves
    this.availableMoves.splice(randomIndex, 1);

    return [x, y];
  }
}
