export default class UI {
  constructor() {
    this.game = null;
    this.gameContainer = null;
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

    // Create game header
    const header = document.createElement("div");
    header.className = "game-header";

    const title = document.createElement("h1");
    title.textContent = "Battleship";
    header.appendChild(title);

    const status = document.createElement("div");
    status.className = "game-status";
    header.appendChild(status);

    this.gameContainer.appendChild(header);

    // Create game boards container
    const boardsContainer = document.createElement("div");
    boardsContainer.className = "game-boards";

    // Create human board
    const humanBoard = this.createBoard("human", "Your Fleet");
    boardsContainer.appendChild(humanBoard);

    // Create computer board
    const computerBoard = this.createBoard("computer", "Enemy Waters");
    boardsContainer.appendChild(computerBoard);

    this.gameContainer.appendChild(boardsContainer);

    // Create game controls
    const controls = document.createElement("div");
    controls.className = "game-controls";

    const resetButton = document.createElement("button");
    resetButton.className = "reset-btn";
    resetButton.textContent = "New Game";
    controls.appendChild(resetButton);

    this.gameContainer.appendChild(controls);

    // Initial update
    this.updateBoards();
    this.updateGameStatus();
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

    // Create 10x10 grid
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

    // Update human board
    const humanBoard = document.querySelector(".human-board .board-grid");
    this.updateBoardCells(humanBoard, gameState.humanBoard, false);

    // Update computer board (hide ships unless hit)
    const computerBoard = document.querySelector(".computer-board .board-grid");
    this.updateBoardCells(computerBoard, gameState.computerBoard, true);
  }

  updateBoardCells(boardElement, boardState, hideShips) {
    const cells = boardElement.querySelectorAll(".board-cell");

    cells.forEach((cell) => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const cellState = boardState[row][col];

      // Reset classes
      cell.className = "board-cell";

      // Add state-specific class
      if (cellState === "ship" && !hideShips) {
        cell.classList.add("ship");
      } else if (cellState === "hit") {
        cell.classList.add("hit");
      } else if (cellState === "miss") {
        cell.classList.add("miss");
      }
    });
  }

  updateGameStatus() {
    const statusElement = document.querySelector(".game-status");
    if (!statusElement) return;

    if (this.game.gameOver) {
      const winnerName = this.game.winner ? this.game.winner.name : "Unknown";
      statusElement.textContent = `Game Over! ${winnerName} wins!`;
    } else {
      const currentPlayer = this.game.getCurrentPlayer();
      statusElement.textContent = `${currentPlayer.name}'s turn`;
    }
  }

  setupEventListeners() {
    // Computer board cell clicks
    const computerBoard = document.querySelector(".computer-board .board-grid");
    if (computerBoard) {
      computerBoard.addEventListener("click", (event) => {
        if (!this.game || this.game.gameOver) return;

        const cell = event.target.closest(".board-cell");
        if (
          !cell ||
          cell.classList.contains("hit") ||
          cell.classList.contains("miss")
        ) {
          return; // Ignore clicks on already attacked cells
        }

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        const result = this.game.processHumanAttack(row, col);

        if (result === "hit" || result === "miss") {
          this.updateBoards();
          this.updateGameStatus();
          this.showMessage(`Attack at (${row}, ${col}): ${result}`);
        } else if (result === "already attacked") {
          this.showMessage("You already attacked this coordinate!");
        } else if (result === "invalid coordinates") {
          this.showMessage("Invalid coordinates!");
        }
      });
    }

    // Reset button
    const resetButton = document.querySelector(".reset-btn");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        this.game.resetGame();
        this.updateBoards();
        this.updateGameStatus();
        this.showMessage("New game started!");
      });
    }
  }

  showMessage(message) {
    const statusElement = document.querySelector(".game-status");
    if (statusElement) {
      // Store current status temporarily
      const originalMessage = statusElement.textContent;
      statusElement.textContent = message;

      // Restore original message after 2 seconds
      if (!this.game.gameOver) {
        setTimeout(() => {
          statusElement.textContent = originalMessage;
        }, 2000);
      }
    }
  }
}
