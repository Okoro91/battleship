import { SHIP_IMAGES } from "../constants.js";
import { DOMUtils } from "../utils/dom.js";
import Ship from "../../ship.js";
import shipSteer from "../../assets/icons/ship-steering.svg";
import dice from "../../assets/icons/dice.svg";
import start from "../../assets/icons/start.svg";
import reset from "../../assets/icons/reset.svg";

export class SetupPhase {
  constructor(ui) {
    this.ui = ui;
    this.draggedShip = null;
    this.placedShips = new Set();
    this.playerShipPositions = new Map();
    this.shipElements = new Map();
  }

  render() {
    this.ui.gameContainer.innerHTML = `
      <div class="setup-phase" id="setup-phase">
        <h1><span class="icon"><img src="${shipSteer}" alt=""></span> Deploy Your Fleet</h1>
        <p class="instructions">Drag ships to your board. Tap placed ships to rotate.</p>

        <div class="setup-area">
          <div class="shipyard-container">
            <h2>Your Ships</h2>
            <div class="shipyard">
              ${DOMUtils.createShipyardHTML()}
            </div>
          </div>

          <div class="placement-container">
            <h2>Your Board</h2>
            <div class="placement-board">
              ${DOMUtils.createBoardHTML("placement")}
            </div>
          </div>
        </div>

        <div class="setup-controls">
          <button id="randomize-btn" class="control-btn">
          <span class="icon"><img src="${dice}" alt=""></span> Randomize
          </button>
          <button id="reset-btn" class="control-btn">
          <span class="icon"><img src="${reset}" alt=""></span> Reset
          </button>
          <button id="start-battle-btn" class="start-btn" disabled>
          <span class="icon"><img src="${start}" alt=""></span> Start Battle!
          </button>
        </div>
      </div>
      ${DOMUtils.createGameOverModalHTML()}
    `;

    this.setupEventListeners();
    this.initializeDragAndDrop();
  }

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

    const placed = this.placeShipOnBoard(name, length, row, col, orientation);

    if (placed) {
      if (this.ui.soundManager) this.ui.soundManager.play("place");
      this.checkAllShipsPlaced();
    } else {
      if (this.ui.soundManager) this.ui.soundManager.play("invalid");
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

  placeShipOnBoard(shipName, length, startRow, startCol, orientation) {
    if (!this.isValidPlacement(startRow, startCol, length, orientation)) {
      return false;
    }

    const ship = new Ship(length);
    const placed = this.ui.game.players[0].gameboard.placeShip(
      ship,
      startRow,
      startCol,
      orientation
    );

    if (!placed) return false;

    const shipElement = DOMUtils.createShipElement(
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

    const shipTokenContainer = document.querySelector(
      `.ship-token-container[data-name="${shipName}"]`
    );
    if (shipTokenContainer) {
      shipTokenContainer.classList.add("placed");
      shipTokenContainer.draggable = false;
    }

    this.placedShips.add(shipName);
    this.shipElements.set(shipName, shipElement);

    this.checkAllShipsPlaced();

    return true;
  }

  isValidPlacement(startRow, startCol, length, orientation) {
    if (startRow < 0 || startCol < 0) return false;

    const endRow =
      orientation === "vertical" ? startRow + length - 1 : startRow;
    const endCol =
      orientation === "horizontal" ? startCol + length - 1 : startCol;

    if (endRow >= 10 || endCol >= 10) return false;

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

      if (r >= 10 || c >= 10) return;

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

  rotateShipInShipyard(shipContainer) {
    const currentOrientation = shipContainer.dataset.orientation;
    const newOrientation =
      currentOrientation === "horizontal" ? "vertical" : "horizontal";

    shipContainer.dataset.orientation = newOrientation;

    const shipImage = shipContainer.querySelector(".ship-image");
    const shipName = shipContainer.dataset.name;
    shipImage.src = SHIP_IMAGES[shipName][newOrientation];

    if (newOrientation === "horizontal") {
      shipImage.style.width = "100%";
      shipImage.style.height = "100%";
      shipImage.style.objectFit = "contain";
    } else {
      shipImage.style.width = "100%";
      shipImage.style.height = "100%";
      shipImage.style.objectFit = "contain";
    }

    this.ui.soundManager?.play("rotate");
  }

  resetPlacement() {
    this.shipElements.forEach((el) => el.remove());
    this.shipElements.clear();

    this.playerShipPositions.clear();
    this.placedShips.clear();
    this.draggedShip = null;

    document.querySelectorAll(".ship-token-container").forEach((container) => {
      container.classList.remove("placed");
      container.draggable = true;
    });

    const startBtn = document.getElementById("start-battle-btn");
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.classList.remove("ready");
    }

    if (
      this.ui.game &&
      this.ui.game.players[0] &&
      this.ui.game.players[0].gameboard
    ) {
      if (typeof this.ui.game.players[0].gameboard.reset === "function") {
        this.ui.game.players[0].gameboard.reset();
      } else {
        this.ui.game.players[0].gameboard.ships = [];
        this.ui.game.players[0].gameboard.board = Array(10)
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

    ships.sort(() => Math.random() - 0.5);

    for (const ship of ships) {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 1000) {
        const row = Math.floor(Math.random() * 10);
        const col = Math.floor(Math.random() * 10);
        const orient = Math.random() < 0.5 ? "horizontal" : "vertical";

        if (this.placeShipOnBoard(ship.name, ship.length, row, col, orient)) {
          placed = true;
        }
        attempts++;
      }
    }

    if (this.ui.soundManager) this.ui.soundManager.play("place");
  }

  checkAllShipsPlaced() {
    if (this.placedShips.size === 5) {
      const startBtn = document.getElementById("start-battle-btn");
      startBtn.disabled = false;
      startBtn.classList.add("ready");
    }
  }

  setupEventListeners() {
    const startButton = document.getElementById("start-battle-btn");
    if (startButton) {
      startButton.addEventListener("click", () => this.ui.startBattle(this));
    }
    document.body.addEventListener("click", (e) => {
      if (e.target.classList.contains("reset-btn")) {
        window.location.reload();
      }
    });
  }

  getState() {
    return {
      placedShips: this.placedShips,
      shipElements: this.shipElements,
      playerShipPositions: this.playerShipPositions,
    };
  }
}
