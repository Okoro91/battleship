import { SetupPhase } from "./components/SetupPhase.js";
import { BattlePhase } from "./components/BattlePhase.js";

export default class UI {
  constructor() {
    this.game = null;
    this.gameContainer = null;
    this.isComputerThinking = false;
    this.gameActive = true;
    this.soundManager = null;
    this.setupPhase = null;
    this.battlePhase = null;
  }

  initialize(game) {
    this.game = game;
    this.gameContainer =
      document.getElementById("game-container") || this.createGameContainer();
    this.soundManager = window.soundManager;

    this.setupPhase = new SetupPhase(this);
    this.setupPhase.render();
  }

  createGameContainer() {
    const container = document.createElement("div");
    container.id = "game-container";
    document.body.appendChild(container);
    return container;
  }

  startBattle(setupPhase) {
    if (setupPhase.placedShips.size !== 5) return;

    const finalShips = Array.from(setupPhase.placedShips).map((shipName) => {
      const shipEl = setupPhase.shipElements.get(shipName);
      return {
        length: parseInt(shipEl.dataset.length),
        x: parseInt(shipEl.dataset.row),
        y: parseInt(shipEl.dataset.col),
        orientation: shipEl.dataset.orientation,
      };
    });

    this.game.initializeGame(finalShips);

    const setupPhaseElement = document.getElementById("setup-phase");
    if (setupPhaseElement) setupPhaseElement.style.display = "none";

    this.battlePhase = new BattlePhase(this, setupPhase);
    this.battlePhase.render();

    if (this.soundManager) this.soundManager.play("place");
  }
}
