import { DOMUtils } from "../utils/dom.js";
import sword from "../../assets/icons/sword.svg";

export class BattlePhase {
  constructor(ui, setupPhase) {
    this.ui = ui;
    this.setupPhase = setupPhase;
    this.isComputerThinking = false;
  }

  render() {
    this.ui.gameContainer.innerHTML = `
      <div class="battle-phase">
        <div class="game-header">
          <h1><span class="icon"><img src="${sword}" alt=""></span> Battleship</h1>
          <div class="game-status" id="game-status">Attack the enemy waters!</div>
        </div>

        <div class="game-boards">
          <div  human-board">
            <h2 class="board-title">Your Fleet</h2>
            <div class="board-grid" id="human-board">
              ${DOMUtils.createBoardHTML("human")}
            </div>
          </div>

          <div  computer-board">
            <h2 class="board-title">Enemy Waters</h2>
            <div class="board-grid" id="computer-board">
              ${DOMUtils.createBoardHTML("computer")}
            </div>
          </div>
        </div>
        <div class="setup-controls">
            <button class="reset-btn control-btn">Restart Game</button>
        </div>
        ${DOMUtils.createGameOverModalHTML()}
      </div>
    `;

    const humanBoard = document.getElementById("human-board");
    this.setupPhase.shipElements.forEach((el) => {
      const clone = el.cloneNode(true);
      humanBoard.appendChild(clone);
    });

    const compBoard = document.getElementById("computer-board");
    compBoard.addEventListener("click", (e) => this.handlePlayerAttack(e));
  }

  async handlePlayerAttack(event) {
    if (this.ui.game.gameOver || this.isComputerThinking) return;

    const cell = event.target.closest(".board-cell");
    if (
      !cell ||
      cell.classList.contains("hit") ||
      cell.classList.contains("miss")
    )
      return;

    const x = parseInt(cell.dataset.row);
    const y = parseInt(cell.dataset.col);

    const humanMove = this.ui.game.processHumanAttack(x, y);

    this.updateCellUI(cell, humanMove.result);

    if (this.ui.game.gameOver) {
      this.showGameOverModal(this.ui.game.winner.name);
      return;
    }

    if (humanMove.nextPlayer === "computer") {
      await this.handleComputerTurn();
    }
  }

  async handleComputerTurn() {
    this.isComputerThinking = true;
    const status = document.getElementById("game-status");
    if (status) status.textContent = "Enemy is aiming...";

    while (
      this.ui.game.getCurrentPlayer().name === "Computer" &&
      !this.ui.game.gameOver
    ) {
      await DOMUtils.delay(3000);

      const compMove = this.ui.game.processComputerAttack();
      const lastAttack = this.ui.game.getLastComputerAttack();

      if (lastAttack) {
        const humanCell = document.querySelector(
          `#human-board .board-cell[data-row="${lastAttack.x}"][data-col="${lastAttack.y}"]`
        );
        this.updateCellUI(humanCell, compMove.result);
      }

      if (this.ui.game.gameOver) {
        this.showGameOverModal(this.ui.game.winner.name);
        break;
      }
    }

    this.isComputerThinking = false;
    if (status && !this.ui.game.gameOver)
      status.textContent = "Your turn - Attack!";
  }

  updateCellUI(cell, result) {
    if (!cell) return;

    if (result === "hit" || result === "sunk") {
      cell.classList.add("hit");
      if (this.ui.soundManager) this.ui.soundManager.play("hit");

      if (result === "sunk") {
        this.revealSunkShip(cell);
      }
    } else if (result === "miss") {
      cell.classList.add("miss");
      if (this.ui.soundManager) this.ui.soundManager.play("miss");
    }
  }

  revealSunkShip(lastHitCell) {
    const x = parseInt(lastHitCell.dataset.row);
    const y = parseInt(lastHitCell.dataset.col);
    const computerBoard = this.ui.game.players[1].gameboard;
    const shipObj = computerBoard.board[x][y];

    if (shipObj && shipObj.isSunk()) {
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

      const shipElement = DOMUtils.createShipElement(
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
}
