export const SHIP_IMAGES = {
  carrier: {
    horizontal: new URL(
      "../assets/images/carrier-horizontal.png",
      import.meta.url
    ).href,
    vertical: new URL("../assets/images/carrier-vertical.png", import.meta.url)
      .href,
  },
  battleship: {
    horizontal: new URL(
      "../assets/images/battleship-horizontal.png",
      import.meta.url
    ).href,
    vertical: new URL(
      "../assets/images/battleship-vertical.png",
      import.meta.url
    ).href,
  },
  cruiser: {
    horizontal: new URL(
      "../assets/images/cruiser-horizontal.png",
      import.meta.url
    ).href,
    vertical: new URL("../assets/images/cruiser-vertical.png", import.meta.url)
      .href,
  },
  submarine: {
    horizontal: new URL(
      "../assets/images/submarine-horizontal.png",
      import.meta.url
    ).href,
    vertical: new URL(
      "../assets/images/submarine-vertical.png",
      import.meta.url
    ).href,
  },
  destroyer: {
    horizontal: new URL(
      "../assets/images/destroyer-horizontal.png",
      import.meta.url
    ).href,
    vertical: new URL(
      "../assets/images/destroyer-vertical.png",
      import.meta.url
    ).href,
  },
};

export const BOARD_SIZE = 10;
export const BOARD_PADDING = 0;

export const SHIP_FLEET = [
  { name: "carrier", length: 5, displayName: "Carrier (5)" },
  { name: "battleship", length: 4, displayName: "Battleship (4)" },
  { name: "cruiser", length: 3, displayName: "Cruiser (3)" },
  { name: "submarine", length: 3, displayName: "Submarine (3)" },
  { name: "destroyer", length: 2, displayName: "Destroyer (2)" },
];
