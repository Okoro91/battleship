import { SHIP_FLEET, SHIP_IMAGES, BOARD_SIZE } from "../constants.js";

export class DOMUtils {
  static createShipyardHTML() {
    return SHIP_FLEET.map(
      (ship) => `
      <div class="ship-token">
        <div class="ship-info">
          <span class="ship-name">${ship.displayName}</span>
          <span class="ship-status"></span>
        </div>
        <div class="ship-token-container" 
             data-name="${ship.name}"
             data-length="${ship.length}"
             data-orientation="horizontal"
             draggable="true">
          <img src="${SHIP_IMAGES[ship.name].horizontal}" class="ship-image">
        </div>
      </div>
    `
    ).join("");
  }

  static createBoardHTML(boardType) {
    const cells = Array.from({ length: BOARD_SIZE }, (_, row) =>
      Array.from({ length: BOARD_SIZE }, (_, col) => {
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

  static createGameOverModalHTML() {
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

  static createShipElement(shipName, startRow, startCol, length, orientation) {
    const shipElement = document.createElement("div");
    shipElement.className = `ship-element ship-${shipName}`;
    shipElement.dataset.name = shipName;
    shipElement.dataset.row = startRow;
    shipElement.dataset.col = startCol;
    shipElement.dataset.length = length;
    shipElement.dataset.orientation = orientation;

    const rootStyles = getComputedStyle(document.documentElement);
    const cellSize =
      parseInt(rootStyles.getPropertyValue("--cell-size").trim()) || 45;
    const gridGap =
      parseInt(rootStyles.getPropertyValue("--grid-gap").trim()) || 1;

    let width, height;

    if (orientation === "horizontal") {
      width = length * cellSize + (length + 1) * gridGap;
      height = cellSize;
    } else {
      width = cellSize;
      height = length * cellSize + (length + 1) * gridGap;
    }

    const top = startRow * (cellSize + gridGap);
    const left = startCol * (cellSize + gridGap);

    shipElement.style.width = `${width}px`;
    shipElement.style.height = `${height}px`;
    shipElement.style.top = `${top}px`;
    shipElement.style.left = `${left}px`;
    shipElement.style.pointerEvents = "auto";

    const shipImg = document.createElement("img");
    shipImg.src = SHIP_IMAGES[shipName][orientation];
    shipImg.style.width = "100%";
    shipImg.style.height = "100%";
    shipImg.style.display = "block";
    shipImg.draggable = false;
    shipImg.style.objectFit = "contain";

    shipElement.appendChild(shipImg);
    return shipElement;
  }

  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
