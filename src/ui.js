export default class UI {
  constructor() {
    this.game = null;
    this.gameContainer = null;
    this.isComputerThinking = false;
    this.computerTurnPromise = null;
    this.gameActive = true;
  }

  initialize(game) {
    this.game = game;
    this.gameContainer = document.getElementById("game-container");

    if (!this.gameContainer) {
      this.gameContainer = document.createElement("div");
      this.gameContainer.id = "game-container";
      document.body.appendChild(this.gameContainer);
    }

    this.render();
    this.setupEventListeners();
  }

  render() {
    this.gameContainer.innerHTML = "";

    const header = document.createElement("div");
    header.className = "game-header";

    const title = document.createElement("h1");
    title.textContent = "Battleship";
    header.appendChild(title);

    const status = document.createElement("div");
    status.className = "game-status";
    status.textContent = "Game starting...";
    header.appendChild(status);

    this.gameContainer.appendChild(header);

    const boardsContainer = document.createElement("div");
    boardsContainer.className = "game-boards";

    const humanBoard = this.createBoard("human", "Your Fleet");
    boardsContainer.appendChild(humanBoard);

    const computerBoard = this.createBoard("computer", "Enemy Waters");
    boardsContainer.appendChild(computerBoard);

    this.gameContainer.appendChild(boardsContainer);

    const controls = document.createElement("div");
    controls.className = "game-controls";

    const resetButton = document.createElement("button");
    resetButton.className = "reset-btn";
    resetButton.textContent = "New Game";
    controls.appendChild(resetButton);

    this.gameContainer.appendChild(controls);

    this.createGameOverModal();

    this.updateBoards();
    this.updateGameStatus();
  }

  createGameOverModal() {
    const modal = document.createElement("div");
    modal.className = "game-over-modal";
    modal.style.display = "none";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const modalTitle = document.createElement("h2");
    modalTitle.className = "modal-title";
    modalTitle.textContent = "Game Over";

    const modalMessage = document.createElement("p");
    modalMessage.className = "modal-message";

    const playAgainButton = document.createElement("button");
    playAgainButton.className = "play-again-btn";
    playAgainButton.textContent = "Play Again";

    const closeButton = document.createElement("button");
    closeButton.className = "close-modal-btn";
    closeButton.textContent = "×";

    modalContent.appendChild(closeButton);
    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalMessage);
    modalContent.appendChild(playAgainButton);
    modal.appendChild(modalContent);

    this.gameContainer.appendChild(modal);

    closeButton.addEventListener("click", () => {
      this.hideGameOverModal();
    });

    playAgainButton.addEventListener("click", () => {
      this.game.resetGame();
      this.updateBoards();
      this.updateGameStatus();
      this.hideGameOverModal();
      this.showMessage("New game started!");
    });
  }

  showGameOverModal(winner) {
    if (!this.gameActive) return;

    const modal = document.querySelector(".game-over-modal");
    const modalMessage = document.querySelector(".modal-message");

    if (winner === "Human") {
      modalMessage.textContent =
        "🎉 Congratulations! You sunk all enemy ships! 🎉";
      modalMessage.style.color = "#2ecc71";
    } else {
      modalMessage.textContent =
        "💀 Game Over! The computer sunk all your ships. 💀";
      modalMessage.style.color = "#e74c3c";
    }

    modal.style.display = "flex";
    this.disableComputerBoard();
    this.isComputerThinking = false;
  }

  hideGameOverModal() {
    const modal = document.querySelector(".game-over-modal");
    modal.style.display = "none";

    if (
      this.gameActive &&
      this.game &&
      this.game.getCurrentPlayer().name === "Human" &&
      !this.game.gameOver
    ) {
      this.enableComputerBoard();
    }
  }

  createBoard(playerType, title) {
    const boardContainer = document.createElement("div");
    boardContainer.className = `game-board ${playerType}-board`;

    const boardTitle = document.createElement("h2");
    boardTitle.className = "board-title";
    boardTitle.textContent = title;
    boardContainer.appendChild(boardTitle);

    const boardGrid = document.createElement("div");
    boardGrid.className = "board-grid";
    boardGrid.dataset.player = playerType;

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = document.createElement("div");
        cell.className = "board-cell";
        cell.dataset.row = row;
        cell.dataset.col = col;
        boardGrid.appendChild(cell);
      }
    }

    boardContainer.appendChild(boardGrid);
    return boardContainer;
  }

  updateBoards() {
    if (!this.game) return;

    const gameState = this.game.getGameState();

    const humanBoard = document.querySelector(".human-board .board-grid");
    this.updateBoardCells(humanBoard, gameState.humanBoard, false);

    const computerBoard = document.querySelector(".computer-board .board-grid");
    this.updateBoardCells(computerBoard, gameState.computerBoard, true);
  }

  updateBoardCells(boardElement, boardState, hideShips) {
    const cells = boardElement.querySelectorAll(".board-cell");

    cells.forEach((cell) => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const cellState = boardState[row][col];

      cell.className = "board-cell";

      if (cellState === "ship" && !hideShips) {
        cell.classList.add("ship");
      } else if (cellState === "hit") {
        cell.classList.add("hit");
      } else if (cellState === "miss") {
        cell.classList.add("miss");
      } else if (cellState === "sunk") {
        cell.classList.add("sunk");
      }
    });
  }

  setupEventListeners() {
    const computerBoard = document.querySelector(".computer-board .board-grid");
    if (computerBoard) {
      computerBoard.addEventListener("click", async (event) => {
        if (
          !this.game ||
          this.game.gameOver ||
          this.isComputerThinking ||
          this.game.getCurrentPlayer().name !== "Human" ||
          !this.gameActive
        ) {
          return;
        }

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

        this.disableComputerBoard();

        const attackResult = this.game.processHumanAttack(row, col);

        // Handle "not your turn" result
        if (attackResult.result === "not your turn") {
          this.showMessage("Wait for your turn!");
          this.enableComputerBoard();
          return;
        }

        if (
          attackResult.result === "hit" ||
          attackResult.result === "miss" ||
          attackResult.result === "sunk"
        ) {
          this.updateBoards();
          this.updateGameStatus();

          const message =
            attackResult.result === "sunk"
              ? `Attack at (${row}, ${col}) SUNK an enemy ship!`
              : `Attack at (${row}, ${col}): ${attackResult.result}`;
          this.showMessage(message);

          // If human missed, it's computer's turn
          if (attackResult.nextPlayer === "computer") {
            await this.handleComputerTurn();
          } else {
            // If human hit, it's still their turn - re-enable board
            this.enableComputerBoard();
          }

          if (this.game.gameOver) {
            const winner = this.game.winner.name;
            setTimeout(() => {
              this.showGameOverModal(winner);
            }, 1000);
          }
        } else if (attackResult.result === "already attacked") {
          this.showMessage("You already attacked this coordinate!");
          this.enableComputerBoard();
        } else if (attackResult.result === "invalid coordinates") {
          this.showMessage("Invalid coordinates!");
          this.enableComputerBoard();
        } else {
          this.enableComputerBoard();
        }
      });
    }

    const resetButton = document.querySelector(".reset-btn");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        this.cancelComputerTurn();
        this.gameActive = false;
        this.isComputerThinking = false;

        this.game.resetGame();
        this.updateBoards();
        this.updateGameStatus();
        this.hideGameOverModal();

        this.enableComputerBoard();
        this.gameActive = true;

        this.showMessage("New game started!");
      });
    }
  }

  checkForHitStreak() {
    if (!this.game) return false;

    const currentPlayer = this.game.getCurrentPlayer();
    const gameState = this.game.getGameState();

    let hits = 0;
    let totalAttacks = 0;

    if (currentPlayer.name === "Human") {
      gameState.computerBoard.forEach((row) => {
        row.forEach((cell) => {
          if (cell === "hit") hits++;
          if (cell === "hit" || cell === "miss") totalAttacks++;
        });
      });
    } else {
      gameState.humanBoard.forEach((row) => {
        row.forEach((cell) => {
          if (cell === "hit") hits++;
          if (cell === "hit" || cell === "miss") totalAttacks++;
        });
      });
    }

    return (
      hits > 0 &&
      totalAttacks > 0 &&
      (hits === totalAttacks || this.getLastAttackWasHit())
    );
  }

  getLastAttackWasHit() {
    return false;
  }

  updateGameStatus() {
    const statusElement = document.querySelector(".game-status");
    const resetButton = document.querySelector(".reset-btn");

    if (!statusElement) return;

    if (this.game.gameOver) {
      const winnerName = this.game.winner ? this.game.winner.name : "Unknown";
      statusElement.textContent = `🏆 Game Over! ${winnerName} wins! 🏆`;
      statusElement.style.color = "#f39c12";
      statusElement.style.fontWeight = "bold";

      if (resetButton) {
        resetButton.textContent = "Play Again";
        resetButton.style.backgroundColor = "#2ecc71";
      }
    } else {
      const currentPlayer = this.game.getCurrentPlayer();

      if (currentPlayer.name === "Human") {
        statusElement.textContent = "🎯 Your turn - Click on enemy board!";
        statusElement.style.color = "#2ecc71";
      } else {
        statusElement.textContent = "🤖 Computer's turn...";
        statusElement.style.color = "#e74c3c";
      }
      statusElement.style.fontWeight = "normal";

      if (resetButton) {
        resetButton.textContent = "Restart Game";
        resetButton.style.backgroundColor = "#e74c3c";
      }
    }
  }

  showMessage(message) {
    const statusElement = document.querySelector(".game-status");
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

  async handleComputerTurn() {
    if (!this.gameActive || this.game.gameOver) {
      return;
    }

    this.isComputerThinking = true;
    this.disableComputerBoard();
    this.showMessage("Computer's turn...");
    this.updateGameStatus();

    let computerTurn = true;
    while (computerTurn && !this.game.gameOver && this.isComputerThinking) {
      await this.delay(800); // 800ms delay for testing

      if (!this.gameActive || !this.isComputerThinking) {
        break;
      }

      const attackResult = this.game.processComputerAttack();

      this.updateBoards();
      this.updateGameStatus();

      if (
        attackResult.result === "hit" ||
        attackResult.result === "miss" ||
        attackResult.result === "sunk"
      ) {
        const lastAttack = this.game.getLastComputerAttack();
        if (lastAttack) {
          const message =
            attackResult.result === "sunk"
              ? `Computer attacks (${lastAttack.x}, ${lastAttack.y}) and SUNK your ship!`
              : `Computer attacks (${lastAttack.x}, ${lastAttack.y}): ${attackResult.result}`;
          this.showMessage(message);
        }

        computerTurn = attackResult.nextPlayer === "computer";

        if (attackResult.nextPlayer === "human") {
          this.showMessage("Your turn!");
        }
      } else if (attackResult.result === "no moves left") {
        this.showMessage("Computer has no moves left!");
        computerTurn = false;
      }

      if (computerTurn && this.isComputerThinking) {
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

  disableComputerBoard() {
    const computerBoard = document.querySelector(".computer-board .board-grid");
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
      const computerBoard = document.querySelector(
        ".computer-board .board-grid"
      );
      if (computerBoard) {
        computerBoard.style.pointerEvents = "auto";
        computerBoard.style.opacity = "1";
      }
    }
  }

  cancelComputerTurn() {
    this.isComputerThinking = false;
  }
}
