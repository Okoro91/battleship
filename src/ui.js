import carrierH from "./assets/images/carrier-horizontal.png";
import carrierV from "./assets/images/carrier-vertical.png";
import battleshipH from "./assets/images/battleship-horizontal.png";
import battleshipV from "./assets/images/battleship-vertical.png";
import cruiserH from "./assets/images/cruiser-horizontal.png";
import cruiserV from "./assets/images/cruiser-vertical.png";
import submarineH from "./assets/images/submarine-horizontal.png";
import submarineV from "./assets/images/submarine-vertical.png";
import destroyerH from "./assets/images/destroyer-horizontal.png";
import destroyerV from "./assets/images/destroyer-vertical.png";
import Ship from "./ship";

const shipImages = {
  carrier: { horizontal: carrierH, vertical: carrierV },
  battleship: { horizontal: battleshipH, vertical: battleshipV },
  cruiser: { horizontal: cruiserH, vertical: cruiserV },
  submarine: { horizontal: submarineH, vertical: submarineV },
  destroyer: { horizontal: destroyerH, vertical: destroyerV },
};

const CELL_SIZE = 30; // 30px
const GRID_GAP = 2; // 2px
const BOARD_PADDING = 0;
const BOARD_SIZE = 10;

export default class UI {
  constructor() {
    this.game = null;
    this.gameContainer = null;
    this.isComputerThinking = false;
    this.gameActive = true;
    this.draggedShip = null;
    this.soundManager = null;
    this.placedShips = new Set();
    this.playerShipPositions = new Map();
    this.shipElements = new Map();
  }

  initialize(game) {
    this.game = game;
    this.gameContainer =
      document.getElementById("game-container") || this.createGameContainer();
    this.soundManager = window.soundManager;

    this.renderSetupPhase();
    this.initializeDragAndDrop();
  }

  createGameContainer() {
    const container = document.createElement("div");
    container.id = "game-container";
    document.body.appendChild(container);
    return container;
  }

  // ========== SETUP PHASE ==========

  renderSetupPhase() {
    this.gameContainer.innerHTML = `
      <div class="setup-phase" id="setup-phase">
        <h1>🚢 Deploy Your Fleet</h1>
        <p class="instructions">Drag ships to your board. Tap placed ships to rotate.</p>

        <div class="setup-area">
          <div class="shipyard-container">
            <h2>Your Ships</h2>
            <div class="shipyard">
              ${this.createShipyardHTML()}
            </div>
          </div>

          <div class="placement-container">
            <h2>Your Board</h2>
            <div class="placement-board">
              ${this.createBoardHTML("placement")}
            </div>
          </div>
        </div>

        <div class="setup-controls">
          <button id="randomize-btn" class="control-btn">
            🎲 Randomize
          </button>
          <button id="reset-btn" class="control-btn">
            🔄 Reset
          </button>
          <button id="start-battle-btn" class="start-btn" disabled>
            ⚔️ Start Battle!
          </button>
        </div>
      </div>
      ${this.createGameOverModalHTML()}
    `;

    this.setupEventListeners();
  }

  createShipyardHTML() {
    // ... define fleet array ...
    const fleet = [
      { name: "carrier", length: 5, displayName: "Carrier (5)" },
      { name: "battleship", length: 4, displayName: "Battleship (4)" },
      { name: "cruiser", length: 3, displayName: "Cruiser (3)" },
      { name: "submarine", length: 3, displayName: "Submarine (3)" },
      { name: "destroyer", length: 2, displayName: "Destroyer (2)" },
    ];

    return fleet
      .map(
        (ship) => `
      <div class="ship-token"> <div class="ship-info">
          <span class="ship-name">${ship.displayName}</span>
          <span class="ship-status"></span> </div>
        <div class="ship-token-container" 
             data-name="${ship.name}"
             data-length="${ship.length}"
             data-orientation="horizontal"
             draggable="true">
          <img src="${shipImages[ship.name].horizontal}" class="ship-image">
        </div>
      </div>
    `
      )
      .join("");
  }

  createBoardHTML(boardType) {
    const cells = Array.from({ length: 10 }, (_, row) =>
      Array.from({ length: 10 }, (_, col) => {
        return `
          <div class="board-cell"
               data-row="${row}"
               data-col="${col}"
               data-board="${boardType}">
          </div>
        `;
      }).join("")
    ).join("");

    return `<div class="board-grid" data-board="${boardType}">${cells}</div>`;
  }

  // ========== DRAG AND DROP ==========

  initializeDragAndDrop() {
    const boardGrid = document.querySelector(".placement-board .board-grid");
    if (!boardGrid) return;

    // Board Events
    boardGrid.addEventListener("dragover", (e) => this.handleDragOver(e));
    boardGrid.addEventListener("dragleave", (e) => this.handleDragLeave(e));
    boardGrid.addEventListener("drop", (e) => this.handleDrop(e));

    // Shipyard Events
    document.querySelectorAll(".ship-token-container").forEach((ship) => {
      ship.addEventListener("dragstart", (e) => this.handleDragStart(e));
      ship.addEventListener("dragend", (e) => this.handleDragEnd(e));
    });

    // Shipyard rotation listeners
    document.querySelectorAll(".ship-token-container").forEach((container) => {
      container.addEventListener("click", (e) => {
        e.stopPropagation();
        this.rotateShipInShipyard(container);
      });
    });

    // Buttons
    document
      .getElementById("randomize-btn")
      ?.addEventListener("click", () => this.randomizeFleet());
    document
      .getElementById("reset-btn")
      ?.addEventListener("click", () => this.resetPlacement());
  }

  handleDragStart(event) {
    const shipElement = event.target.closest(".ship-token-container");
    if (!shipElement || shipElement.classList.contains("placed")) {
      event.preventDefault();
      return;
    }

    this.draggedShip = {
      name: shipElement.dataset.name,
      length: parseInt(shipElement.dataset.length),
      orientation: shipElement.dataset.orientation,
    };

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify(this.draggedShip));
    setTimeout(() => shipElement.classList.add("dragging"), 0);
  }

  handleDragOver(event) {
    event.preventDefault(); // Necessary to allow dropping
    event.dataTransfer.dropEffect = "move";

    const cell = event.target.closest(".board-cell");
    if (cell && this.draggedShip) {
      this.clearShipPreview();
      this.showShipPreview(cell);
    }
  }

  handleDragLeave(event) {
    if (!event.relatedTarget || !event.relatedTarget.closest(".board-grid")) {
      this.clearShipPreview();
    }
  }

  handleDrop(event) {
    event.preventDefault();
    this.clearShipPreview();

    const cell = event.target.closest(".board-cell");

    if (!cell || !this.draggedShip) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const { name, length, orientation } = this.draggedShip;

    // Try to place ship
    const placed = this.placeShipOnBoard(name, length, row, col, orientation);

    if (placed) {
      if (this.soundManager) this.soundManager.play("place");
      this.checkAllShipsPlaced();
    } else {
      if (this.soundManager) this.soundManager.play("invalid");
      cell.classList.add("invalid-drop");
      setTimeout(() => cell.classList.remove("invalid-drop"), 500);
    }

    this.draggedShip = null;
  }

  handleDragEnd() {
    document
      .querySelectorAll(".dragging")
      .forEach((el) => el.classList.remove("dragging"));
    this.clearShipPreview();
    this.draggedShip = null;
  }

  // ========== PLACEMENT LOGIC ==========

  placeShipOnBoard(shipName, length, startRow, startCol, orientation) {
    if (!this.isValidPlacement(startRow, startCol, length, orientation)) {
      return false;
    }

    // 1. Update Game Logic
    const ship = new Ship(length);
    const placed = this.game.players[0].gameboard.placeShip(
      ship,
      startRow,
      startCol,
      orientation
    );

    if (!placed) return false;

    // 2. Create and Append Ship Element (Visuals)
    const shipElement = this.createShipElement(
      shipName,
      startRow,
      startCol,
      length,
      orientation
    );

    Array.from({ length }, (_, i) => {
      const r = orientation === "horizontal" ? startRow : startRow + i;
      const c = orientation === "horizontal" ? startCol + i : startCol;
      this.playerShipPositions.set(`${r},${c}`, shipName);
    });

    const boardGrid = document.querySelector(".placement-board .board-grid");
    if (boardGrid) boardGrid.appendChild(shipElement);

    // 3. Update Shipyard Token (THE FIX IS HERE)
    const shipTokenContainer = document.querySelector(
      `.ship-token-container[data-name="${shipName}"]`
    );
    if (shipTokenContainer) {
      shipTokenContainer.classList.add("placed");
      shipTokenContainer.draggable = false;
    }

    this.placedShips.add(shipName);
    this.shipElements.set(shipName, shipElement);

    // 4. Check if game is ready to start
    this.checkAllShipsPlaced();

    return true;
  }

  createShipElement(shipName, startRow, startCol, length, orientation) {
    const shipElement = document.createElement("div");
    shipElement.className = `ship-element ship-${shipName}`;
    shipElement.dataset.name = shipName;
    shipElement.dataset.row = startRow;
    shipElement.dataset.col = startCol;
    shipElement.dataset.length = length;
    shipElement.dataset.orientation = orientation;

    let width, height;

    if (orientation === "horizontal") {
      width = length * CELL_SIZE + (length - 1) * GRID_GAP;
      height = CELL_SIZE;
    } else {
      width = CELL_SIZE;
      height = length * CELL_SIZE + (length - 1) * GRID_GAP;
    }

    // Position: (Index * (Size + Gap))
    const top = startRow * (CELL_SIZE + GRID_GAP);
    const left = startCol * (CELL_SIZE + GRID_GAP);

    shipElement.style.width = `${width}px`;
    shipElement.style.height = `${height}px`;
    shipElement.style.top = `${top}px`;
    shipElement.style.left = `${left}px`;

    shipElement.style.pointerEvents = "auto";

    const shipImg = document.createElement("img");
    shipImg.src = shipImages[shipName][orientation];
    shipImg.style.width = "100%";
    shipImg.style.height = "100%";
    shipImg.style.display = "block";
    shipImg.draggable = false;

    shipElement.appendChild(shipImg);
    return shipElement;
  }

  isValidPlacement(startRow, startCol, length, orientation) {
    if (startRow < 0 || startCol < 0) return false;

    const endRow =
      orientation === "vertical" ? startRow + length - 1 : startRow;
    const endCol =
      orientation === "horizontal" ? startCol + length - 1 : startCol;

    if (endRow >= BOARD_SIZE || endCol >= BOARD_SIZE) return false;

    // Check collisions
    return Array.from({ length }, (_, i) => {
      const r = orientation === "horizontal" ? startRow : startRow + i;
      const c = orientation === "horizontal" ? startCol + i : startCol;
      return `${r},${c}`;
    }).every((position) => !this.playerShipPositions.has(position));
  }

  showShipPreview(cell) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const { length, orientation } = this.draggedShip;
    const isValid = this.isValidPlacement(row, col, length, orientation);

    Array.from({ length }, (_, i) => {
      const r = orientation === "horizontal" ? row : row + i;
      const c = orientation === "horizontal" ? col + i : col;

      if (r >= BOARD_SIZE || c >= BOARD_SIZE) return;

      const previewCell = document.querySelector(
        `.board-cell[data-row="${r}"][data-col="${c}"]`
      );
      if (previewCell) {
        previewCell.classList.add(
          "ship-preview",
          isValid ? "preview-valid" : "preview-invalid"
        );
      }
    });
  }

  clearShipPreview() {
    document.querySelectorAll(".ship-preview").forEach((el) => {
      el.classList.remove("ship-preview", "preview-valid", "preview-invalid");
    });
  }

  // ========== ROTATE SHIPS LOGIC ==========

  rotateShipInShipyard(shipContainer) {
    const currentOrientation = shipContainer.dataset.orientation;
    const newOrientation =
      currentOrientation === "horizontal" ? "vertical" : "horizontal";

    shipContainer.dataset.orientation = newOrientation;

    const shipImage = shipContainer.querySelector(".ship-image");
    const shipName = shipContainer.dataset.name;
    shipImage.src = shipImages[shipName][newOrientation];

    // Update image styling
    if (newOrientation === "horizontal") {
      shipImage.style.width = "100%";
      shipImage.style.height = "100%";
      shipImage.style.objectFit = "contain";
    } else {
      shipImage.style.width = "100%";
      shipImage.style.height = "100%";
      shipImage.style.objectFit = "contain";
    }

    this.soundManager?.play("rotate");
  }

  // ========== RANDOM & RESET  ==========

  resetPlacement() {
    // 1. Clear Ship Elements from Board
    this.shipElements.forEach((el) => el.remove());
    this.shipElements.clear();

    // 2. Clear Internal State
    this.playerShipPositions.clear();
    this.placedShips.clear();
    this.draggedShip = null;

    // 3. Reset Shipyard UI (THE FIX IS HERE)
    document.querySelectorAll(".ship-token-container").forEach((container) => {
      container.classList.remove("placed");
      container.draggable = true;
    });

    // 4. Disable Start Button
    const startBtn = document.getElementById("start-battle-btn");
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.classList.remove("ready");
    }

    // 5. Reset Game Logic Board
    if (this.game && this.game.players[0] && this.game.players[0].gameboard) {
      if (typeof this.game.players[0].gameboard.reset === "function") {
        this.game.players[0].gameboard.reset();
      } else {
        this.game.players[0].gameboard.ships = [];
        this.game.players[0].gameboard.board = Array(10)
          .fill(null)
          .map(() => Array(10).fill(null));
      }
    }
  }

  randomizeFleet() {
    this.resetPlacement();

    const ships = [
      { name: "carrier", length: 5 },
      { name: "battleship", length: 4 },
      { name: "cruiser", length: 3 },
      { name: "submarine", length: 3 },
      { name: "destroyer", length: 2 },
    ];

    // Shuffle for better randomness
    ships.sort(() => Math.random() - 0.5);

    for (const ship of ships) {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 1000) {
        const row = Math.floor(Math.random() * 10);
        const col = Math.floor(Math.random() * 10);
        const orient = Math.random() < 0.5 ? "horizontal" : "vertical";

        // Place on board
        if (this.placeShipOnBoard(ship.name, ship.length, row, col, orient)) {
          placed = true;
        }
        attempts++;
      }
    }

    if (this.soundManager) this.soundManager.play("place");
  }

  checkAllShipsPlaced() {
    if (this.placedShips.size === 5) {
      const startBtn = document.getElementById("start-battle-btn");
      startBtn.disabled = false;
      startBtn.classList.add("ready");
    }
  }

  // ========== BATTLE PHASE ==========

  setupEventListeners() {
    const startButton = document.getElementById("start-battle-btn");
    if (startButton) {
      startButton.addEventListener("click", () => this.startBattle());
    }
    // Re-bind reset for modal
    document.body.addEventListener("click", (e) => {
      if (e.target.classList.contains("reset-btn")) {
        window.location.reload(); // Simplest reset
      }
    });
  }

  startBattle() {
    if (this.placedShips.size !== 5) return;
    const finalShips = Array.from(this.placedShips).map((shipName) => {
      const shipEl = this.shipElements.get(shipName);
      return {
        length: parseInt(shipEl.dataset.length),
        x: parseInt(shipEl.dataset.row),
        y: parseInt(shipEl.dataset.col),
        orientation: shipEl.dataset.orientation,
      };
    });

    // 2. Initialize the game logic with your placements
    this.game.initializeGame(finalShips);

    // 3. UI Transition
    const setupPhase = document.getElementById("setup-phase");
    if (setupPhase) setupPhase.style.display = "none";

    this.renderBattlePhase();

    if (this.soundManager) this.soundManager.play("place");
  }

  renderBattlePhase() {
    this.gameContainer.innerHTML = `
      <div class="battle-phase">
        <div class="game-header">
          <h1>⚔️ Battleship</h1>
          <div class="game-status" id="game-status">Attack the enemy waters!</div>
        </div>

        <div class="game-boards">
          <div class="game-board human-board">
            <h2 class="board-title">Your Fleet</h2>
            <div class="board-grid" id="human-board">
              ${this.createBoardHTML("human")}
            </div>
          </div>

          <div class="game-board computer-board">
            <h2 class="board-title">Enemy Waters</h2>
            <div class="board-grid" id="computer-board">
              ${this.createBoardHTML("computer")}
            </div>
          </div>
        </div>
        <div class="setup-controls">
            <button class="reset-btn control-btn">Restart Game</button>
        </div>
        ${this.createGameOverModalHTML()}
      </div>
    `;

    // Transfer ships to the battle view
    const humanBoard = document.getElementById("human-board");
    this.shipElements.forEach((el) => {
      // Clone is safer to remove event listeners
      const clone = el.cloneNode(true);
      humanBoard.appendChild(clone);
    });

    // Add Attack Listeners
    const compBoard = document.getElementById("computer-board");
    compBoard.addEventListener("click", (e) => this.handlePlayerAttack(e));
  }

  async handlePlayerAttack(event) {
    if (this.game.gameOver || this.isComputerThinking) return;

    const cell = event.target.closest(".board-cell");
    if (
      !cell ||
      cell.classList.contains("hit") ||
      cell.classList.contains("miss")
    )
      return;

    const x = parseInt(cell.dataset.row);
    const y = parseInt(cell.dataset.col);

    // 1. Process Human Attack
    const humanMove = this.game.processHumanAttack(x, y);

    // Update Computer Board UI
    this.updateCellUI(cell, humanMove.result);

    // 2. Check for Game Over
    if (this.game.gameOver) {
      this.showGameOverModal(this.game.winner.name);
      return;
    }

    // 3. If it's now the Computer's turn, trigger it
    if (humanMove.nextPlayer === "computer") {
      await this.handleComputerTurn();
    }
  }

  async handleComputerTurn() {
    this.isComputerThinking = true;
    const status = document.getElementById("game-status");
    if (status) status.textContent = "Enemy is aiming...";

    while (
      this.game.getCurrentPlayer().name === "Computer" &&
      !this.game.gameOver
    ) {
      await this.delay(800);

      const compMove = this.game.processComputerAttack();
      const lastAttack = this.game.getLastComputerAttack();

      if (lastAttack) {
        const humanCell = document.querySelector(
          `#human-board .board-cell[data-row="${lastAttack.x}"][data-col="${lastAttack.y}"]`
        );
        this.updateCellUI(humanCell, compMove.result);
      }

      if (this.game.gameOver) {
        this.showGameOverModal(this.game.winner.name);
        break;
      }
    }

    this.isComputerThinking = false;
    if (status && !this.game.gameOver)
      status.textContent = "Your turn - Attack!";
  }

  // Helper to style cells
  updateCellUI(cell, result) {
    if (!cell) return;

    if (result === "hit" || result === "sunk") {
      cell.classList.add("hit");
      if (this.soundManager) this.soundManager.play("hit");

      if (result === "sunk") {
        this.revealSunkShip(cell);
      }
    } else if (result === "miss") {
      cell.classList.add("miss");
      if (this.soundManager) this.soundManager.play("miss");
    }
  }

  revealSunkShip(lastHitCell) {
    const x = parseInt(lastHitCell.dataset.row);
    const y = parseInt(lastHitCell.dataset.col);
    const computerBoard = this.game.players[1].gameboard;
    const shipObj = computerBoard.board[x][y];

    if (shipObj && shipObj.isSunk()) {
      // 1. Identify ship type
      let name = shipObj.name || shipObj.type;
      if (!name) {
        const lengthToName = {
          5: "carrier",
          4: "battleship",
          3: "cruiser",
          2: "destroyer",
        };
        name = lengthToName[shipObj.length] || "submarine";
      }
      let startRow = x;
      let startCol = y;

      const cells = Array.from({ length: 10 }, (_, r) =>
        Array.from({ length: 10 }, (_, c) => ({ r, c }))
      ).flat();

      const found = cells.find(
        ({ r, c }) => computerBoard.board[r][c] === shipObj
      );

      if (found) {
        startRow = found.r;
        startCol = found.c;
      }

      const orientation =
        startCol + 1 < 10 &&
        computerBoard.board[startRow][startCol + 1] === shipObj
          ? "horizontal"
          : "vertical";

      const shipElement = this.createShipElement(
        name,
        startRow,
        startCol,
        shipObj.length,
        orientation
      );

      if (shipElement) {
        shipElement.classList.add("sunk-reveal");
        const enemyGrid = document.querySelector("#computer-board .board-grid");
        if (enemyGrid) enemyGrid.appendChild(shipElement);
      }
    }
  }

  createGameOverModalHTML() {
    return `
      <div class="game-over-modal" style="display: none;">
        <div class="modal-content">
          <h2 class="modal-title">Game Over</h2>
          <p class="modal-message"></p>
          <button class="reset-btn control-btn">Play Again</button>
        </div>
      </div>
    `;
  }

  showGameOverModal(winner) {
    const modal = document.querySelector(".game-over-modal");
    const modalMessage = document.querySelector(".modal-message");

    if (modal && modalMessage) {
      modalMessage.textContent =
        winner === "Human"
          ? "🎉 Victory! You sunk all enemy ships! 🎉"
          : "💀 Defeat! The enemy sunk your fleet. 💀";
      modal.style.display = "flex";
    }
  }

  // Add this inside your UI class in ui.js
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
