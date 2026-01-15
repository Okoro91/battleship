import Game from "../src/game";
import Player from "../src/player";

describe("Game", () => {
  let game;
  let mockHumanPlayer;
  let mockComputerPlayer;

  beforeEach(() => {
    // Create mock players with all required methods
    mockHumanPlayer = {
      name: "Human",
      isComputer: false,
      gameboard: {
        placeShip: jest.fn().mockReturnValue(true),
        receiveAttack: jest.fn(),
        allShipsSunk: jest.fn().mockReturnValue(false),
        getBoardState: jest.fn().mockReturnValue(
          Array(10)
            .fill()
            .map(() => Array(10).fill("empty"))
        ),
        constructor: class MockGameboard {
          constructor() {
            this.placeShip = jest.fn();
            this.receiveAttack = jest.fn();
            this.allShipsSunk = jest.fn();
            this.getBoardState = jest.fn();
          }
        },
      },
      attack: jest.fn(),
      hasLost: jest.fn().mockReturnValue(false),
      placeAllShipsRandomly: jest.fn().mockReturnValue(true),
      generateAllCoordinates: jest
        .fn()
        .mockReturnValue(
          Array.from({ length: 100 }, (_, index) => [
            Math.floor(index / 10),
            index % 10,
          ])
        ),
      availableMoves: Array.from({ length: 100 }, (_, index) => [
        Math.floor(index / 10),
        index % 10,
      ]),
      attacksMade: new Set(),
    };

    mockComputerPlayer = {
      name: "Computer",
      isComputer: true,
      gameboard: {
        placeShip: jest.fn().mockReturnValue(true),
        receiveAttack: jest.fn(),
        allShipsSunk: jest.fn().mockReturnValue(false),
        getBoardState: jest.fn().mockReturnValue(
          Array(10)
            .fill()
            .map(() => Array(10).fill("empty"))
        ),
        constructor: class MockGameboard {
          constructor() {
            this.placeShip = jest.fn();
            this.receiveAttack = jest.fn();
            this.allShipsSunk = jest.fn();
            this.getBoardState = jest.fn();
          }
        },
      },
      attack: jest.fn(),
      hasLost: jest.fn().mockReturnValue(false),
      placeAllShipsRandomly: jest.fn().mockReturnValue(true),
      generateAllCoordinates: jest
        .fn()
        .mockReturnValue(
          Array.from({ length: 100 }, (_, index) => [
            Math.floor(index / 10),
            index % 10,
          ])
        ),
      availableMoves: Array.from({ length: 100 }, (_, index) => [
        Math.floor(index / 10),
        index % 10,
      ]),
      attacksMade: new Set(),
    };

    game = new Game();
    // Replace players with mocks
    game.players = [mockHumanPlayer, mockComputerPlayer];
    game.currentPlayerIndex = 0;
  });

  describe("constructor", () => {
    test("creates a game with two players", () => {
      const newGame = new Game();

      expect(newGame.players).toHaveLength(2);
      expect(newGame.players[0].name).toBe("Human");
      expect(newGame.players[0].isComputer).toBe(false);
      expect(newGame.players[1].name).toBe("Computer");
      expect(newGame.players[1].isComputer).toBe(true);
    });

    test("sets current player to human by default", () => {
      const newGame = new Game();
      expect(newGame.currentPlayerIndex).toBe(0);
    });

    test("initializes game over as false", () => {
      const newGame = new Game();
      expect(newGame.gameOver).toBe(false);
    });

    test("initializes winner as null", () => {
      const newGame = new Game();
      expect(newGame.winner).toBeNull();
    });
  });

  describe("initializeGame()", () => {
    test("places all ships for computer player", () => {
      game.initializeGame();

      expect(mockComputerPlayer.placeAllShipsRandomly).toHaveBeenCalled();
    });

    test("initializes with predetermined ships for human if provided", () => {
      const predeterminedShips = [
        { length: 5, x: 0, y: 0, orientation: "horizontal" },
        { length: 4, x: 2, y: 2, orientation: "vertical" },
      ];

      game.initializeGame(predeterminedShips);

      // Reset calls because initializeGame resets the gameboard
      expect(mockHumanPlayer.gameboard.placeShip).toHaveBeenCalledTimes(2);
    });

    test("resets game state", () => {
      game.gameOver = true;
      game.winner = mockHumanPlayer;
      game.currentPlayerIndex = 1;

      game.initializeGame();

      expect(game.gameOver).toBe(false);
      expect(game.winner).toBeNull();
      expect(game.currentPlayerIndex).toBe(0);
    });
  });

  describe("switchTurn()", () => {
    test("switches from human to computer", () => {
      game.currentPlayerIndex = 0;
      game.switchTurn();

      expect(game.currentPlayerIndex).toBe(1);
    });

    test("switches from computer to human", () => {
      game.currentPlayerIndex = 1;
      game.switchTurn();

      expect(game.currentPlayerIndex).toBe(0);
    });
  });

  describe("getCurrentPlayer()", () => {
    test("returns human player when current player is human", () => {
      game.currentPlayerIndex = 0;
      const currentPlayer = game.getCurrentPlayer();

      expect(currentPlayer).toBe(mockHumanPlayer);
    });

    test("returns computer player when current player is computer", () => {
      game.currentPlayerIndex = 1;
      const currentPlayer = game.getCurrentPlayer();

      expect(currentPlayer).toBe(mockComputerPlayer);
    });
  });

  describe("getOpponent()", () => {
    test("returns computer when current player is human", () => {
      game.currentPlayerIndex = 0;
      const opponent = game.getOpponent();

      expect(opponent).toBe(mockComputerPlayer);
    });

    test("returns human when current player is computer", () => {
      game.currentPlayerIndex = 1;
      const opponent = game.getOpponent();

      expect(opponent).toBe(mockHumanPlayer);
    });
  });

  describe("processHumanAttack()", () => {
    test("processes valid human attack and switches turn", () => {
      mockHumanPlayer.attack.mockReturnValue("hit");

      const result = game.processHumanAttack(3, 4);

      expect(mockHumanPlayer.attack).toHaveBeenCalledWith(
        mockComputerPlayer.gameboard,
        3,
        4
      );
      expect(result).toBe("hit");
      expect(game.currentPlayerIndex).toBe(1); // Should switch to computer
    });

    test("does not switch turn on invalid attack", () => {
      mockHumanPlayer.attack.mockReturnValue("invalid coordinates");

      const result = game.processHumanAttack(10, 10);

      expect(result).toBe("invalid coordinates");
      expect(game.currentPlayerIndex).toBe(0); // Should not switch
    });

    test("does not switch turn on already attacked coordinate", () => {
      mockHumanPlayer.attack.mockReturnValue("already attacked");

      const result = game.processHumanAttack(5, 5);

      expect(result).toBe("already attacked");
      expect(game.currentPlayerIndex).toBe(0); // Should not switch
    });

    test("checks for game over after successful attack", () => {
      mockHumanPlayer.attack.mockReturnValue("hit");
      mockComputerPlayer.hasLost.mockReturnValue(true);

      const result = game.processHumanAttack(3, 4);

      expect(game.gameOver).toBe(true);
      expect(game.winner).toBe(mockHumanPlayer);
    });

    test("returns game over if game is already over", () => {
      game.gameOver = true;

      const result = game.processHumanAttack(3, 4);

      expect(result).toBe("game over");
    });
  });

  describe("processComputerAttack()", () => {
    test("processes computer attack and switches back to human", () => {
      mockComputerPlayer.attack.mockReturnValue("miss");

      game.currentPlayerIndex = 1; // Computer's turn
      const result = game.processComputerAttack();

      expect(mockComputerPlayer.attack).toHaveBeenCalledWith(
        mockHumanPlayer.gameboard
      );
      expect(result).toBe("miss");
      expect(game.currentPlayerIndex).toBe(0); // Should switch back to human
    });

    test("checks for game over after computer attack", () => {
      mockComputerPlayer.attack.mockReturnValue("hit");
      mockHumanPlayer.hasLost.mockReturnValue(true);

      game.currentPlayerIndex = 1;
      const result = game.processComputerAttack();

      expect(game.gameOver).toBe(true);
      expect(game.winner).toBe(mockComputerPlayer);
    });

    test("handles computer having no moves left", () => {
      mockComputerPlayer.attack.mockReturnValue("no moves left");

      game.currentPlayerIndex = 1;
      const result = game.processComputerAttack();

      expect(result).toBe("no moves left");
      expect(game.gameOver).toBe(true);
      expect(game.winner).toBe(mockHumanPlayer); // Human wins by default
    });

    test("returns game over if game is already over", () => {
      game.gameOver = true;
      game.currentPlayerIndex = 1;

      const result = game.processComputerAttack();

      expect(result).toBe("game over");
    });
  });

  describe("isGameOver()", () => {
    test("returns true when human has lost", () => {
      mockHumanPlayer.hasLost.mockReturnValue(true);
      const result = game.isGameOver();

      expect(result).toBe(true);
      expect(game.winner).toBe(mockComputerPlayer);
    });

    test("returns true when computer has lost", () => {
      mockComputerPlayer.hasLost.mockReturnValue(true);
      const result = game.isGameOver();

      expect(result).toBe(true);
      expect(game.winner).toBe(mockHumanPlayer);
    });

    test("returns false when no one has lost", () => {
      mockHumanPlayer.hasLost.mockReturnValue(false);
      mockComputerPlayer.hasLost.mockReturnValue(false);
      const result = game.isGameOver();

      expect(result).toBe(false);
      expect(game.winner).toBeNull();
    });
  });

  describe("resetGame()", () => {
    test("resets game state", () => {
      game.gameOver = true;
      game.winner = mockHumanPlayer;
      game.currentPlayerIndex = 1;

      game.resetGame();

      expect(game.gameOver).toBe(false);
      expect(game.winner).toBeNull();
      expect(game.currentPlayerIndex).toBe(0);
    });
  });

  describe("getGameState()", () => {
    test("returns current game state", () => {
      const gameState = game.getGameState();

      expect(gameState).toHaveProperty("currentPlayer");
      expect(gameState).toHaveProperty("gameOver");
      expect(gameState).toHaveProperty("winner");
      expect(gameState).toHaveProperty("humanBoard");
      expect(gameState).toHaveProperty("computerBoard");
    });
  });
});
