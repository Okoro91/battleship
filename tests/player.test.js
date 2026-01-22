import Player from "../src/player";
import Gameboard from "../src/gameboard";
import Ship from "../src/ship";

describe("Player", () => {
  let humanPlayer;
  let computerPlayer;
  let opponentBoard;

  beforeEach(() => {
    humanPlayer = new Player("Human");
    computerPlayer = new Player("Computer", true);
    opponentBoard = new Gameboard();
  });

  describe("constructor", () => {
    test("creates a human player by default", () => {
      const player = new Player("Player1");
      expect(player.name).toBe("Player1");
      expect(player.isComputer).toBe(false);
      expect(player.gameboard).toBeInstanceOf(Gameboard);
      expect(player.attacksMade).toEqual(new Set());
    });

    test("creates a computer player when specified", () => {
      const player = new Player("AI", true);
      expect(player.name).toBe("AI");
      expect(player.isComputer).toBe(true);
      expect(player.gameboard).toBeInstanceOf(Gameboard);
    });
  });

  describe("attack() - Human Player", () => {
    test("human can attack specific coordinates", () => {
      const result = humanPlayer.attack(opponentBoard, 3, 4);

      expect(result).toBe("miss");
      expect(humanPlayer.attacksMade.has("3,4")).toBe(true);
    });

    test("human cannot attack same coordinates twice", () => {
      humanPlayer.attack(opponentBoard, 3, 4);
      const result = humanPlayer.attack(opponentBoard, 3, 4);

      expect(result).toBe("already attacked");
    });

    test("human attack hits a ship", () => {
      const ship = new Ship(3);
      opponentBoard.placeShip(ship, 2, 2, "horizontal");

      const result = humanPlayer.attack(opponentBoard, 2, 3);

      expect(result).toBe("hit");
      expect(ship.hits).toBe(1);
      expect(humanPlayer.attacksMade.has("2,3")).toBe(true);
    });

    test("human cannot attack out of bounds", () => {
      const result = humanPlayer.attack(opponentBoard, 10, 10);

      expect(result).toBe("invalid coordinates");
      expect(humanPlayer.attacksMade.has("10,10")).toBe(false);
    });
  });

  describe("attack() - Computer Player", () => {
    test("computer makes a valid random attack", () => {
      const spy = jest.spyOn(opponentBoard, "receiveAttack");
      const result = computerPlayer.attack(opponentBoard);

      expect(result).toBeDefined();
      expect([
        "miss",
        "hit",
        "invalid coordinates",
        "already attacked",
      ]).toContain(result);
      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });

    test("computer does not repeat attacks", () => {
      const mockBoard = {
        size: 10,
        receiveAttack: jest.fn().mockReturnValue("miss"),
      };

      const attacks = [];
      for (let i = 0; i < 100; i++) {
        const result = computerPlayer.attack(mockBoard);
        const [x, y] = mockBoard.receiveAttack.mock.calls[i];
        attacks.push(`${x},${y}`);
      }

      const uniqueAttacks = new Set(attacks);
      expect(uniqueAttacks.size).toBe(100);
      const result = computerPlayer.attack(mockBoard);
      expect(["no moves left", "already attacked"]).toContain(result);
    });

    test("computer tracks its attacks", () => {
      computerPlayer.attack(opponentBoard);

      expect(computerPlayer.attacksMade.size).toBe(1);
    });
  });

  describe("placeShipRandomly()", () => {
    test("places a ship of given length randomly", () => {
      const ship = new Ship(3);
      const result = computerPlayer.placeShipRandomly(ship);

      expect(result).toBe(true);

      const boardState = computerPlayer.gameboard.getBoardState();
      const shipCells = boardState.flat().filter((cell) => cell === "ship");
      expect(shipCells.length).toBe(3);
    });

    test("returns false if ship cannot be placed after many attempts", () => {
      const computerBoard = new Gameboard(3);
      const smallPlayer = new Player("Test", true);
      smallPlayer.gameboard = computerBoard;

      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const ship = new Ship(1);
          computerBoard.placeShip(ship, i, j, "horizontal");
        }
      }

      const ship = new Ship(2);
      const result = smallPlayer.placeShipRandomly(ship, 10);

      expect(result).toBe(false);
    });

    test("can place multiple ships randomly", () => {
      const ships = [
        new Ship(5),
        new Ship(4),
        new Ship(3),
        new Ship(3),
        new Ship(2),
      ];

      ships.forEach((ship) => {
        const result = computerPlayer.placeShipRandomly(ship);
        expect(result).toBe(true);
      });

      const boardState = computerPlayer.gameboard.getBoardState();
      const shipCells = boardState.flat().filter((cell) => cell === "ship");
      expect(shipCells.length).toBe(5 + 4 + 3 + 3 + 2);
    });
  });

  describe("isAllShipsPlaced()", () => {
    test("returns true when all standard ships are placed", () => {
      const standardShips = [5, 4, 3, 3, 2];

      standardShips.forEach((length) => {
        const ship = new Ship(length);
        computerPlayer.placeShipRandomly(ship);
      });

      expect(computerPlayer.isAllShipsPlaced()).toBe(true);
    });

    test("returns false when not all ships are placed", () => {
      const ship1 = new Ship(5);
      const ship2 = new Ship(4);

      computerPlayer.placeShipRandomly(ship1);
      computerPlayer.placeShipRandomly(ship2);

      expect(computerPlayer.isAllShipsPlaced()).toBe(false);
    });
  });

  describe("getAvailableMoves()", () => {
    test("returns all coordinates initially", () => {
      const moves = humanPlayer.getAvailableMoves();

      expect(moves).toHaveLength(100);
      expect(moves).toContainEqual([0, 0]);
      expect(moves).toContainEqual([9, 9]);
    });

    test("returns only un-attacked coordinates", () => {
      humanPlayer.attack(opponentBoard, 0, 0);
      humanPlayer.attack(opponentBoard, 5, 5);

      const moves = humanPlayer.getAvailableMoves();

      expect(moves).toHaveLength(98);
      expect(moves).not.toContainEqual([0, 0]);
      expect(moves).not.toContainEqual([5, 5]);
      expect(moves).toContainEqual([0, 1]);
    });

    test("computer player also has available moves", () => {
      const moves = computerPlayer.getAvailableMoves();

      expect(moves).toHaveLength(100);
    });
  });

  describe("hasLost()", () => {
    test("returns true when all ships are sunk", () => {
      const ship = new Ship(2);
      humanPlayer.gameboard.placeShip(ship, 0, 0, "horizontal");

      humanPlayer.gameboard.receiveAttack(0, 0);
      humanPlayer.gameboard.receiveAttack(0, 1);

      expect(humanPlayer.hasLost()).toBe(true);
    });

    test("returns false when ships remain", () => {
      const ship = new Ship(2);
      humanPlayer.gameboard.placeShip(ship, 0, 0, "horizontal");

      humanPlayer.gameboard.receiveAttack(0, 0);

      expect(humanPlayer.hasLost()).toBe(false);
    });

    test("returns true when no ships are placed", () => {
      expect(humanPlayer.hasLost()).toBe(true);
    });
  });
});
