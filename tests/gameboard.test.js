import Gameboard from "../src/gameboard";
import Ship from "../src/ship";

describe("Gameboard", () => {
  let gameboard;

  beforeEach(() => {
    gameboard = new Gameboard();
  });

  describe("constructor", () => {
    test("creates a 10x10 gameboard by default", () => {
      expect(gameboard.board).toHaveLength(10);
      expect(gameboard.board[0]).toHaveLength(10);
    });

    test("creates empty board cells", () => {
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          expect(gameboard.board[i][j]).toBeNull();
        }
      }
    });

    test("initializes empty ships array", () => {
      expect(gameboard.ships).toEqual([]);
    });

    test("initializes empty missed attacks set", () => {
      expect(gameboard.missedAttacks).toEqual([]);
    });
  });

  describe("placeShip()", () => {
    test("places ship horizontally at valid coordinates", () => {
      const ship = new Ship(3);
      const result = gameboard.placeShip(ship, 2, 3, "horizontal");

      expect(result).toBe(true);
      expect(gameboard.board[2][3]).toBe(ship);
      expect(gameboard.board[2][4]).toBe(ship);
      expect(gameboard.board[2][5]).toBe(ship);
      expect(gameboard.ships).toContain(ship);
    });

    test("places ship vertically at valid coordinates", () => {
      const ship = new Ship(4);
      const result = gameboard.placeShip(ship, 5, 5, "vertical");

      expect(result).toBe(true);
      expect(gameboard.board[5][5]).toBe(ship);
      expect(gameboard.board[6][5]).toBe(ship);
      expect(gameboard.board[7][5]).toBe(ship);
      expect(gameboard.board[8][5]).toBe(ship);
      expect(gameboard.ships).toContain(ship);
    });

    test("returns false when placing ship out of bounds horizontally", () => {
      const ship = new Ship(4);
      const result = gameboard.placeShip(ship, 9, 9, "horizontal");

      expect(result).toBe(false);
      expect(gameboard.board[9][9]).toBeNull();
      expect(gameboard.ships).not.toContain(ship);
    });

    test("returns false when placing ship out of bounds vertically", () => {
      const ship = new Ship(5);
      const result = gameboard.placeShip(ship, 8, 0, "vertical");

      expect(result).toBe(false);
      expect(gameboard.ships).not.toContain(ship);
    });

    test("returns false when placing ship on occupied cells", () => {
      const ship1 = new Ship(3);
      const ship2 = new Ship(3);

      gameboard.placeShip(ship1, 2, 2, "horizontal");
      const result = gameboard.placeShip(ship2, 2, 2, "vertical");

      expect(result).toBe(false);
    });

    test("returns false for invalid orientation", () => {
      const ship = new Ship(3);
      const result = gameboard.placeShip(ship, 0, 0, "diagonal");

      expect(result).toBe(false);
    });

    test("returns false for ship length less than 1", () => {
      const ship = new Ship(0);
      const result = gameboard.placeShip(ship, 0, 0, "horizontal");

      expect(result).toBe(false);
    });
  });

  describe("receiveAttack()", () => {
    test("hits a ship at the given coordinates", () => {
      const ship = new Ship(3);
      gameboard.placeShip(ship, 2, 3, "horizontal");

      const result = gameboard.receiveAttack(2, 4);

      expect(result).toBe("hit");
      expect(ship.hits).toBe(1);
    });

    test("records a miss when no ship at coordinates", () => {
      const result = gameboard.receiveAttack(5, 5);

      expect(result).toBe("miss");
      expect(gameboard.missedAttacks).toContainEqual([5, 5]);
    });

    test("does not allow attacking same coordinate twice", () => {
      const ship = new Ship(2);
      gameboard.placeShip(ship, 1, 1, "horizontal");

      gameboard.receiveAttack(1, 1);
      const result = gameboard.receiveAttack(1, 1);

      expect(result).toBe("already attacked");
      expect(ship.hits).toBe(1);
    });

    test("sinks a ship when all positions are hit", () => {
      const ship = new Ship(2);
      gameboard.placeShip(ship, 3, 3, "horizontal");

      gameboard.receiveAttack(3, 3);
      const result = gameboard.receiveAttack(3, 4);

      expect(result).toBe("hit");
      expect(ship.isSunk()).toBe(true);
    });

    test("returns error for coordinates out of bounds", () => {
      const result = gameboard.receiveAttack(10, 10);

      expect(result).toBe("invalid coordinates");
    });

    test("returns error for negative coordinates", () => {
      const result = gameboard.receiveAttack(-1, 5);

      expect(result).toBe("invalid coordinates");
    });
  });

  describe("allShipsSunk()", () => {
    test("returns true when all ships are sunk", () => {
      const ship1 = new Ship(2);
      const ship2 = new Ship(3);

      gameboard.placeShip(ship1, 0, 0, "horizontal");
      gameboard.placeShip(ship2, 5, 5, "vertical");

      // Sink ship1
      gameboard.receiveAttack(0, 0);
      gameboard.receiveAttack(0, 1);

      // Sink ship2
      gameboard.receiveAttack(5, 5);
      gameboard.receiveAttack(6, 5);
      gameboard.receiveAttack(7, 5);

      expect(gameboard.allShipsSunk()).toBe(true);
    });

    test("returns false when not all ships are sunk", () => {
      const ship1 = new Ship(2);
      const ship2 = new Ship(3);

      gameboard.placeShip(ship1, 0, 0, "horizontal");
      gameboard.placeShip(ship2, 5, 5, "vertical");

      // Only sink ship1
      gameboard.receiveAttack(0, 0);
      gameboard.receiveAttack(0, 1);

      // Don't attack ship2

      expect(gameboard.allShipsSunk()).toBe(false);
    });

    test("returns true when there are no ships", () => {
      expect(gameboard.allShipsSunk()).toBe(true);
    });
  });

  describe("getBoardState()", () => {
    test("returns correct board state with ship placements", () => {
      const ship = new Ship(2);
      gameboard.placeShip(ship, 2, 3, "horizontal");

      const boardState = gameboard.getBoardState();

      expect(boardState[2][3]).toBe("ship");
      expect(boardState[2][4]).toBe("ship");
      expect(boardState[5][5]).toBe("empty");
    });

    test("returns correct board state with hits and misses", () => {
      const ship = new Ship(2);
      gameboard.placeShip(ship, 1, 1, "horizontal");

      gameboard.receiveAttack(1, 1); // Hit
      gameboard.receiveAttack(5, 5); // Miss

      const boardState = gameboard.getBoardState();

      expect(boardState[1][1]).toBe("hit");
      expect(boardState[5][5]).toBe("miss");
      expect(boardState[1][2]).toBe("ship"); // Untouched ship part
    });
  });
});
