import Ship from "../src/ship";

describe("Ship", () => {
  describe("constructor", () => {
    test("creates a ship with given length", () => {
      const ship = new Ship(4);
      expect(ship.length).toBe(4);
    });

    test("initializes hits to 0", () => {
      const ship = new Ship(3);
      expect(ship.hits).toBe(0);
    });
  });

  describe("hit()", () => {
    test("increases hit count by 1", () => {
      const ship = new Ship(3);
      ship.hit();
      expect(ship.hits).toBe(1);
    });

    test("can be called multiple times", () => {
      const ship = new Ship(3);
      ship.hit();
      ship.hit();
      expect(ship.hits).toBe(2);
    });
  });

  describe("isSunk()", () => {
    test("returns false when hits are less than length", () => {
      const ship = new Ship(3);
      ship.hit();
      expect(ship.isSunk()).toBe(false);
    });

    test("returns true when hits equal length", () => {
      const ship = new Ship(2);
      ship.hit();
      ship.hit();
      expect(ship.isSunk()).toBe(true);
    });

    test("returns true when hits exceed length", () => {
      const ship = new Ship(2);
      ship.hit();
      ship.hit();
      ship.hit();
      expect(ship.isSunk()).toBe(true);
    });

    test("returns false for new ship", () => {
      const ship = new Ship(4);
      expect(ship.isSunk()).toBe(false);
    });
  });
});
