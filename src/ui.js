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
import hitImg from "./assets/images/hit.png";
import missImg from "./assets/images/miss.png";
import sunkImg from "./assets/images/sunk.png";
import Ship from "./ship";

const shipImages = {
  carrier: { horizontal: carrierH, vertical: carrierV },
  battleship: { horizontal: battleshipH, vertical: battleshipV },
  cruiser: { horizontal: cruiserH, vertical: cruiserV },
  submarine: { horizontal: submarineH, vertical: submarineV },
  destroyer: { horizontal: destroyerH, vertical: destroyerV },
};

export default class UI {
  constructor() {
    this.game = null;
    this.gameContainer = null;
    this.isComputerThinking = false;
    this.gameActive = true;
    this.draggedShip = null;
    this.soundManager = null;
    this.placedShips = new Set();
    this.playerShipPositions = new Map(); // Track placed ship positions
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

  // ========== SETUP PHASE (Drag & Drop) ==========

  renderSetupPhase() {
    this.gameContainer.innerHTML = `
      <div class="setup-phase" id="setup-phase">
        <h1>🚢 Deploy Your Fleet</h1>
        <p class="instructions">Drag ships to your board. Click a ship to rotate it.</p>
        
        <div class="setup-area">
          <div class="shipyard-container">
            <h2>Your Ships</h2>
            <div class="shipyard">
              ${this.createShipyardHTML()}
            </div>
          </div>
          
          <div class="placement-container">
            <h2>Your Fleet</h2>
            <div class="placement-board">
              ${this.createBoardHTML("placement", true)}
            </div>
          </div>
        </div>
        
        <div class="setup-controls">
          <button id="randomize-btn" class="control-btn">
            🎲 Randomize Fleet
          </button>
          <button id="reset-btn" class="control-btn">
            🔄 Reset Placement
          </button>
          <button id="start-battle-btn" class="start-btn" disabled>
            ⚔️ Start Battle!
          </button>
        </div>
        
        <div class="setup-help">
          <p>💡 <strong>Tip:</strong> Click ships to rotate, then drag to board</p>
        </div>
      </div>
      
      ${this.createGameOverModalHTML()}
    `;

    this.setupEventListeners();
  }

  createShipyardHTML() {
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
      <div class="ship-token ${this.placedShips.has(ship.name) ? "placed" : ""}" 
           data-name="${ship.name}" 
           data-length="${ship.length}" 
           data-orientation="horizontal"
           draggable="true">
        <div class="ship-info">
          <span class="ship-name">${ship.displayName}</span>
          <span class="ship-status">${this.placedShips.has(ship.name) ? "✓ Placed" : "Ready to place"}</span>
        </div>
        <img src="${shipImages[ship.name].horizontal}" 
             alt="${ship.name}" 
             class="ship-image">
      </div>
    `
      )
      .join("");
  }

  createBoardHTML(boardType, isPlacement = false) {
    let cells = "";
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const cellData = this.getCellData(boardType, row, col);
        cells += `
        <div class="board-cell placement-cell ${cellData.classes}" 
 
               data-row="${row}" 
               data-col="${col}"
               data-board="${boardType}">
            ${cellData.content}
          </div>
        `;
      }
    }

    return `
      <div class="board-grid" data-board="${boardType}">
        ${cells}
      </div>
    `;
  }

  getCellData(boardType, row, col) {
    if (
      boardType === "placement" &&
      this.playerShipPositions.has(`${row},${col}`)
    ) {
      const shipData = this.playerShipPositions.get(`${row},${col}`);
      return {
        classes: "ship placed-ship",
        content: `<img src="${shipImages[shipData.name][shipData.orientation]}" class="ship-cell-image">`,
      };
    }
    return { classes: "", content: "" };
  }

  // ========== DRAG AND DROP IMPROVEMENTS ==========

  initializeDragAndDrop() {
    const boardGrid = document.querySelector(".placement-board .board-grid");
    if (!boardGrid) return;

    // Better drag event handling
    boardGrid.addEventListener("dragover", this.handleDragOver.bind(this));
    boardGrid.addEventListener("dragenter", this.handleDragEnter.bind(this));
    boardGrid.addEventListener("dragleave", this.handleDragLeave.bind(this));
    boardGrid.addEventListener("drop", this.handleDrop.bind(this));

    // Add event listeners to ship tokens
    document.querySelectorAll(".ship-token:not(.placed)").forEach((ship) => {
      ship.addEventListener("dragstart", this.handleDragStart.bind(this));
      ship.addEventListener("dragend", this.handleDragEnd.bind(this));
      ship.addEventListener("click", this.handleShipClick.bind(this));
    });
  }

  handleDragStart(event) {
    const shipEle = event.currentTarget;

    if (!shipEle || shipEle.classList.contains("placed")) {
      event.preventDefault();
      return;
    }

    const shipElement = event.target.closest(".ship-token");
    if (!shipElement) return;

    this.draggedShip = {
      element: shipElement,
      name: shipElement.dataset.name,
      length: parseInt(shipElement.dataset.length),
      orientation: shipElement.dataset.orientation,
    };

    // Set drag image and data
    event.dataTransfer.setData("text/plain", JSON.stringify(this.draggedShip));
    event.dataTransfer.effectAllowed = "copy";

    // Use custom drag image (optional)
    const dragImage = shipElement.querySelector(".ship-image").cloneNode(true);
    dragImage.style.opacity = "0.7";
    dragImage.style.transform = "scale(0.8)";
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 25, 25);

    setTimeout(() => document.body.removeChild(dragImage), 0);

    shipElement.classList.add("dragging");
  }

  handleDragEnter(event) {
    event.preventDefault();
    const cell = event.target.closest(".board-cell");
    if (cell && !cell.classList.contains("has-ship")) {
      cell.classList.add("drop-hover");
    }
  }

  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";

    // Show visual preview of where ship would go
    if (this.draggedShip) {
      const cell = event.target.closest(".board-cell");
      if (cell) {
        this.showShipPreview(cell);
      }
    }
  }

  showShipPreview(cell) {
    // Remove any existing preview
    document.querySelectorAll(".ship-preview").forEach((el) => el.remove());

    if (!this.draggedShip) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const { length, orientation } = this.draggedShip;

    // Check if placement is valid
    const isValid = this.isValidPlacement(row, col, length, orientation);

    // Highlight cells where ship would go
    for (let i = 0; i < length; i++) {
      let previewRow = row;
      let previewCol = col;

      if (orientation === "horizontal") {
        previewCol = col + i;
      } else {
        previewRow = row + i;
      }

      const previewCell = document.querySelector(
        `.board-cell[data-row="${previewRow}"][data-col="${previewCol}"]`
      );

      if (previewCell) {
        previewCell.classList.add("ship-preview");
        previewCell.classList.add(
          isValid ? "preview-valid" : "preview-invalid"
        );
      }
    }
  }

  handleDragLeave(event) {
    const cell = event.target.closest(".board-cell");
    if (cell) {
      cell.classList.remove("drop-hover");
    }
    // Remove preview when leaving the board
    // if (!event.relatedTarget || !event.relatedTarget.closest(".board-grid")) {
    //   document.querySelectorAll(".ship-preview").forEach((el) => {
    //     el.classList.remove("ship-preview", "preview-valid", "preview-invalid");
    //   });
    // }
  }

  async handleDrop(event) {
    event.preventDefault();

    // Clear all previews
    document.querySelectorAll(".ship-preview").forEach((el) => {
      el.classList.remove("ship-preview", "preview-valid", "preview-invalid");
    });

    const cell = event.target.closest(".board-cell");
    if (!cell || !this.draggedShip) return;

    cell.classList.remove("drop-hover");

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const { name, length, orientation } = this.draggedShip;

    // Try to place the ship
    const placed = await this.placeShipOnBoard(
      name,
      length,
      row,
      col,
      orientation
    );

    if (placed) {
      if (this.soundManager) this.soundManager.play("place");
      this.checkAllShipsPlaced();
    } else {
      if (this.soundManager) this.soundManager.play("invalid");
      // Show error feedback
      cell.classList.add("invalid-drop");
      setTimeout(() => cell.classList.remove("invalid-drop"), 800);
    }

    this.draggedShip = null;
  }

  handleDragEnd(event) {
    document
      .querySelectorAll(".dragging")
      .forEach((el) => el.classList.remove("dragging"));
    document.querySelectorAll(".ship-preview").forEach((el) => {
      el.classList.remove("ship-preview", "preview-valid", "preview-invalid");
    });
    this.draggedShip = null;
  }

  handleShipClick(event) {
    const shipElement = event.target.closest(".ship-token");
    if (!shipElement || shipElement.classList.contains("placed")) return;

    this.rotateShip(shipElement);
    if (this.soundManager) this.soundManager.play("rotate");
  }

  rotateShip(shipElement) {
    const currentOrientation = shipElement.dataset.orientation;
    const newOrientation =
      currentOrientation === "horizontal" ? "vertical" : "horizontal";
    shipElement.dataset.orientation = newOrientation;

    const shipImage = shipElement.querySelector(".ship-image");
    const shipName = shipElement.dataset.name;
    shipImage.src = shipImages[shipName][newOrientation];

    // Update image dimensions based on orientation
    if (newOrientation === "horizontal") {
      shipImage.style.width = "100%";
      shipImage.style.height = "auto";
    } else {
      shipImage.style.width = "auto";
      shipImage.style.height = "100%";
    }
  }

  // ========== SHIP PLACEMENT LOGIC ==========

  async placeShipOnBoard(shipName, length, startRow, startCol, orientation) {
    const ship = new Ship(length);
    const placed = this.game.players[0].gameboard.placeShip(
      ship,
      startRow,
      startCol,
      orientation
    );

    if (!placed) return false;

    // Store ship positions for rendering
    for (let i = 0; i < length; i++) {
      let row = startRow;
      let col = startCol;

      if (orientation === "horizontal") {
        col = startCol + i;
      } else {
        row = startRow + i;
      }

      this.playerShipPositions.set(`${row},${col}`, {
        name: shipName,
        orientation: orientation,
        ship: ship,
      });
    }

    // Update ship token in shipyard
    const shipElement = document.querySelector(
      `.ship-token[data-name="${shipName}"]`
    );
    if (shipElement) {
      shipElement.classList.add("placed");
      shipElement.draggable = false;
      shipElement.querySelector(".ship-status").textContent = "✓ Placed";
    }

    this.placedShips.add(shipName);

    // Update the board display
    this.updatePlacementBoard();

    return true;
  }

  isValidPlacement(startRow, startCol, length, orientation) {
    // Check bounds
    if (orientation === "horizontal") {
      if (startCol + length > 10) return false;
    } else {
      if (startRow + length > 10) return false;
    }

    // Check for overlapping ships
    for (let i = 0; i < length; i++) {
      let row = startRow;
      let col = startCol;

      if (orientation === "horizontal") {
        col = startCol + i;
      } else {
        row = startRow + i;
      }

      if (this.playerShipPositions.has(`${row},${col}`)) {
        return false;
      }
    }

    return true;
  }

  updatePlacementBoard() {
    const boardGrid = document.querySelector(".placement-board .board-grid");
    if (!boardGrid) return;

    // Update all cells
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = boardGrid.querySelector(
          `[data-row="${row}"][data-col="${col}"]`
        );
        if (cell) {
          cell.innerHTML = "";
          cell.className = "board-cell";
          cell.classList.add("placement-cell");

          if (this.playerShipPositions.has(`${row},${col}`)) {
            const shipData = this.playerShipPositions.get(`${row},${col}`);
            cell.classList.add("ship", "placed-ship", "has-ship");
            cell.innerHTML = `
              <img src="${shipImages[shipData.name][shipData.orientation]}" 
                   class="ship-cell-image">
            `;
          }
        }
      }
    }
  }

  checkAllShipsPlaced() {
    if (this.placedShips.size === 5) {
      const startButton = document.getElementById("start-battle-btn");
      if (startButton) {
        startButton.disabled = false;
        startButton.classList.add("ready");
      }
    }
  }

  // ========== BATTLE PHASE ==========

  startBattle() {
    if (this.placedShips.size !== 5) return;

    // Hide setup phase
    document.getElementById("setup-phase").style.display = "none";

    // Render battle phase
    this.renderBattlePhase();

    // Computer places ships
    this.game.players[1].placeAllShipsRandomly();

    // Initialize battle
    this.updateGameStatus();
    if (this.soundManager) this.soundManager.play("place");

    console.log("Battle started!");
  }

  renderBattlePhase() {
    this.gameContainer.innerHTML = `
      <div class="battle-phase">
        <div class="game-header">
          <h1>⚔️ Battleship</h1>
          <div class="game-status" id="game-status">Your turn - Attack enemy waters!</div>
        </div>
        
        <div class="game-boards">
          <div class="game-board human-board">
            <h2 class="board-title">Your Fleet</h2>
            <div class="board-grid" id="human-board">
              ${this.createBoardHTML("human", false)}
            </div>
          </div>
          
          <div class="game-board computer-board">
            <h2 class="board-title">Enemy Waters</h2>
            <div class="board-grid" id="computer-board">
              ${this.createBoardHTML("computer", true)}
            </div>
          </div>
        </div>
        
        <div class="game-controls">
          <button class="reset-btn">🔄 Restart Game</button>
        </div>
        
        ${this.createGameOverModalHTML()}
      </div>
    `;

    this.setupBattleEventListeners();
    this.updateBattleBoards();
  }

  updateBattleBoards() {
    if (!this.game) return;

    const gameState = this.game.getGameState();

    // Update human board with ships
    const humanBoard = document.getElementById("human-board");
    if (humanBoard) {
      this.updateBattleBoardCells(humanBoard, gameState.humanBoard, false);
    }

    // Update computer board (hidden ships)
    const computerBoard = document.getElementById("computer-board");
    if (computerBoard) {
      this.updateBattleBoardCells(computerBoard, gameState.computerBoard, true);
    }
  }

  updateBattleBoardCells(boardElement, boardState, hideShips) {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = boardElement.querySelector(
          `[data-row="${row}"][data-col="${col}"]`
        );
        if (!cell) continue;

        const cellState = boardState[row][col];
        cell.className = "board-cell";
        cell.innerHTML = "";

        if (cellState === "ship" && !hideShips) {
          // Show player's ships
          if (this.playerShipPositions.has(`${row},${col}`)) {
            const shipData = this.playerShipPositions.get(`${row},${col}`);
            cell.classList.add("ship");
            cell.innerHTML = `
              <img src="${shipImages[shipData.name][shipData.orientation]}" 
                   class="ship-cell-image">
            `;
          }
        } else if (cellState === "hit") {
          cell.classList.add("hit");
          cell.innerHTML = `<img src="${hitImg}" alt="Hit" class="hit-miss-icon">`;
          if (this.soundManager) this.soundManager.play("hit");
        } else if (cellState === "miss") {
          cell.classList.add("miss");
          cell.innerHTML = `<img src="${missImg}" alt="Miss" class="hit-miss-icon">`;
          if (this.soundManager) this.soundManager.play("miss");
        } else if (cellState === "sunk") {
          cell.classList.add("sunk");
          cell.innerHTML = `
            <img src="${sunkImg}" alt="Sunk" class="sunk-icon">
            <div class="sunk-overlay"></div>
          `;
          if (this.soundManager) this.soundManager.play("sunk");
        }
      }
    }
  }

  // ========== EVENT LISTENERS ==========

  setupEventListeners() {
    // Start Battle button
    const startButton = document.getElementById("start-battle-btn");
    if (startButton) {
      startButton.addEventListener("click", () => this.startBattle());
    }

    // Randomize button
    const randomizeBtn = document.getElementById("randomize-btn");
    if (randomizeBtn) {
      randomizeBtn.addEventListener("click", () => this.randomizeFleet());
    }

    // Reset button
    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetPlacement());
    }
  }

  setupBattleEventListeners() {
    // Computer board attacks
    const computerBoard = document.getElementById("computer-board");
    if (computerBoard) {
      computerBoard.addEventListener("click", async (event) => {
        await this.handlePlayerAttack(event);
      });
    }

    // Restart button
    const resetButton = document.querySelector(".reset-btn");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        this.resetGame();
      });
    }
  }

  async handlePlayerAttack(event) {
    if (!this.game || this.game.gameOver || this.isComputerThinking) return;

    const cell = event.target.closest(".board-cell");
    if (
      !cell ||
      cell.classList.contains("hit") ||
      cell.classList.contains("miss")
    ) {
      return;
    }

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    // Disable board during attack
    this.disableComputerBoard();

    const attackResult = this.game.processHumanAttack(row, col);

    if (
      attackResult.result === "hit" ||
      attackResult.result === "miss" ||
      attackResult.result === "sunk"
    ) {
      this.updateBattleBoards();
      this.updateGameStatus();

      // Play appropriate sound
      if (this.soundManager) {
        if (attackResult.result === "hit" || attackResult.result === "sunk") {
          this.soundManager.play("hit");
        } else {
          this.soundManager.play("miss");
        }
      }

      if (attackResult.nextPlayer === "computer") {
        await this.handleComputerTurn();
      }

      if (this.game.gameOver) {
        const winner = this.game.winner.name;
        setTimeout(() => {
          this.showGameOverModal(winner);
          if (this.soundManager) this.soundManager.play("gameover");
        }, 1000);
      }
    }

    this.enableComputerBoard();
  }

  // ========== HELPER METHODS ==========

  randomizeFleet() {
    // Reset current placement
    this.resetPlacement();

    // Place ships randomly
    const fleet = [
      { name: "carrier", length: 5 },
      { name: "battleship", length: 4 },
      { name: "cruiser", length: 3 },
      { name: "submarine", length: 3 },
      { name: "destroyer", length: 2 },
    ];

    fleet.forEach((ship) => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        const row = Math.floor(Math.random() * 10);
        const col = Math.floor(Math.random() * 10);
        const orientation = Math.random() > 0.5 ? "horizontal" : "vertical";

        if (this.isValidPlacement(row, col, ship.length, orientation)) {
          this.placeShipOnBoard(ship.name, ship.length, row, col, orientation);
          placed = true;
        }
        attempts++;
      }
    });

    if (this.soundManager) this.soundManager.play("place");
  }

  resetPlacement() {
    this.placedShips.clear();
    this.playerShipPositions.clear();
    this.draggedShip = null;

    // Re-render setup phase
    this.renderSetupPhase();
    this.initializeDragAndDrop();
  }

  resetGame() {
    this.game.resetGame();
    this.placedShips.clear();
    this.playerShipPositions.clear();
    this.draggedShip = null;
    this.renderSetupPhase();
    this.initializeDragAndDrop();
  }

  // ========== GAME OVER MODAL ==========

  createGameOverModalHTML() {
    return `
      <div class="game-over-modal" style="display: none;">
        <div class="modal-content">
          <button class="close-modal-btn">×</button>
          <h2 class="modal-title">Game Over</h2>
          <p class="modal-message"></p>
          <button class="play-again-btn">Play Again</button>
        </div>
      </div>
    `;
  }

  showGameOverModal(winner) {
    const modal = document.querySelector(".game-over-modal");
    const modalMessage = document.querySelector(".modal-message");

    if (!modal || !modalMessage) return;

    if (winner === "Human") {
      modalMessage.textContent = "🎉 Victory! You sunk all enemy ships! 🎉";
      modalMessage.style.color = "#2ecc71";
    } else {
      modalMessage.textContent = "💀 Defeat! The enemy sunk your fleet. 💀";
      modalMessage.style.color = "#e74c3c";
    }

    modal.style.display = "flex";

    // Add event listeners to modal buttons
    const closeButton = modal.querySelector(".close-modal-btn");
    const playAgainButton = modal.querySelector(".play-again-btn");

    if (closeButton) {
      closeButton.onclick = () => (modal.style.display = "none");
    }

    if (playAgainButton) {
      playAgainButton.onclick = () => {
        modal.style.display = "none";
        this.resetGame();
      };
    }
  }

  // ========== EXISTING METHODS (kept for compatibility) ==========

  disableComputerBoard() {
    const computerBoard = document.getElementById("computer-board");
    if (computerBoard) {
      computerBoard.style.pointerEvents = "none";
      computerBoard.style.opacity = "0.7";
    }
  }

  enableComputerBoard() {
    if (
      this.game &&
      this.game.getCurrentPlayer().name === "Human" &&
      this.gameActive &&
      !this.game.gameOver
    ) {
      const computerBoard = document.getElementById("computer-board");
      if (computerBoard) {
        computerBoard.style.pointerEvents = "auto";
        computerBoard.style.opacity = "1";
      }
    }
  }

  updateGameStatus() {
    const statusElement = document.getElementById("game-status");
    if (!statusElement || !this.game) return;

    if (this.game.gameOver) {
      const winnerName = this.game.winner ? this.game.winner.name : "Unknown";
      statusElement.textContent = `🏆 Game Over! ${winnerName} wins! 🏆`;
    } else {
      const currentPlayer = this.game.getCurrentPlayer();
      if (currentPlayer.name === "Human") {
        statusElement.textContent = "🎯 Your turn - Click on enemy board!";
      } else {
        statusElement.textContent = "🤖 Computer's turn...";
      }
    }
  }

  async handleComputerTurn() {
    if (!this.gameActive || this.game.gameOver) return;

    this.isComputerThinking = true;
    this.disableComputerBoard();

    let computerTurn = true;
    while (computerTurn && !this.game.gameOver && this.isComputerThinking) {
      await this.delay(800);

      if (!this.gameActive || !this.isComputerThinking) break;

      const attackResult = this.game.processComputerAttack();

      this.updateBattleBoards();
      this.updateGameStatus();

      if (
        attackResult.result === "hit" ||
        attackResult.result === "miss" ||
        attackResult.result === "sunk"
      ) {
        computerTurn = attackResult.nextPlayer === "computer";

        if (attackResult.nextPlayer === "human") {
          this.showMessage("Your turn!");
        }
      }

      if (computerTurn) {
        await this.delay(1000);
      }
    }

    this.isComputerThinking = false;

    if (this.gameActive) {
      if (this.game.gameOver) {
        const winner = this.game.winner.name;
        this.updateGameStatus();
        setTimeout(() => {
          if (this.gameActive) {
            this.showGameOverModal(winner);
            if (this.soundManager) this.soundManager.play("gameover");
          }
        }, 1000);
      } else {
        this.enableComputerBoard();
      }
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  showMessage(message) {
    const statusElement = document.getElementById("game-status");
    if (statusElement) {
      const originalMessage = statusElement.textContent;
      statusElement.textContent = message;

      if (!this.game.gameOver) {
        setTimeout(() => {
          statusElement.textContent = originalMessage;
        }, 2000);
      }
    }
  }
}
