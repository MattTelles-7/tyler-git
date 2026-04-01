const winningCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const boardElement = document.getElementById("board");
const cellElements = Array.from(document.querySelectorAll(".cell"));
const statusMessage = document.getElementById("status-message");
const restartButton = document.getElementById("restart-button");
const resetScoreButton = document.getElementById("reset-score-button");
const modeButtons = Array.from(document.querySelectorAll(".mode-button"));

const scoreElements = {
  X: document.getElementById("score-x"),
  O: document.getElementById("score-o"),
  draw: document.getElementById("score-draw"),
};

const scores = {
  X: 0,
  O: 0,
  draw: 0,
};

let boardState = Array(9).fill("");
let currentPlayer = "X";
let gameMode = "human";
let gameActive = true;
let waitingForComputer = false;
let winningLine = [];
let computerTurnTimer = null;

function resetBoard() {
  if (computerTurnTimer) {
    window.clearTimeout(computerTurnTimer);
    computerTurnTimer = null;
  }

  boardState = Array(9).fill("");
  currentPlayer = "X";
  gameActive = true;
  waitingForComputer = false;
  winningLine = [];
  statusMessage.textContent =
    gameMode === "computer"
      ? "You are X. Make the first move."
      : "Two-player mode. X starts the round.";
  render();
}

function resetScores() {
  scores.X = 0;
  scores.O = 0;
  scores.draw = 0;
  renderScores();
}

function renderScores() {
  scoreElements.X.textContent = scores.X;
  scoreElements.O.textContent = scores.O;
  scoreElements.draw.textContent = scores.draw;
}

function render() {
  cellElements.forEach((cell, index) => {
    const value = boardState[index];
    cell.textContent = value;
    cell.disabled = Boolean(value) || !gameActive || waitingForComputer;
    cell.classList.toggle("x-mark", value === "X");
    cell.classList.toggle("o-mark", value === "O");
    cell.classList.toggle("winner", winningLine.includes(index));
  });

  boardElement.setAttribute("aria-busy", waitingForComputer ? "true" : "false");
}

function checkWinner(state) {
  for (const combo of winningCombos) {
    const [a, b, c] = combo;
    if (state[a] && state[a] === state[b] && state[a] === state[c]) {
      return { winner: state[a], combo };
    }
  }

  if (state.every(Boolean)) {
    return { winner: "draw", combo: [] };
  }

  return null;
}

function finishRound(result) {
  gameActive = false;
  waitingForComputer = false;
  winningLine = result.combo;

  if (result.winner === "draw") {
    scores.draw += 1;
    statusMessage.textContent = "Draw. Nobody found the winning line.";
  } else {
    scores[result.winner] += 1;
    statusMessage.textContent =
      gameMode === "computer" && result.winner === "O"
        ? "Computer wins this round."
        : `${result.winner} wins this round.`;
  }

  renderScores();
  render();
}

function applyMove(index, player) {
  boardState[index] = player;
  const result = checkWinner(boardState);

  if (result) {
    finishRound(result);
    return;
  }

  currentPlayer = player === "X" ? "O" : "X";
  statusMessage.textContent =
    gameMode === "computer" && currentPlayer === "O"
      ? "Computer is choosing a move..."
      : `${currentPlayer}'s turn.`;
  render();
}

function minimax(state, isMaximizing) {
  const outcome = checkWinner(state);
  if (outcome) {
    if (outcome.winner === "O") {
      return 1;
    }
    if (outcome.winner === "X") {
      return -1;
    }
    return 0;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    state.forEach((value, index) => {
      if (value) {
        return;
      }
      state[index] = "O";
      bestScore = Math.max(bestScore, minimax(state, false));
      state[index] = "";
    });
    return bestScore;
  }

  let bestScore = Infinity;
  state.forEach((value, index) => {
    if (value) {
      return;
    }
    state[index] = "X";
    bestScore = Math.min(bestScore, minimax(state, true));
    state[index] = "";
  });
  return bestScore;
}

function getBestComputerMove() {
  let bestScore = -Infinity;
  let bestMove = -1;

  boardState.forEach((value, index) => {
    if (value) {
      return;
    }
    boardState[index] = "O";
    const score = minimax(boardState, false);
    boardState[index] = "";

    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  });

  return bestMove;
}

function triggerComputerTurn() {
  if (!gameActive || gameMode !== "computer" || currentPlayer !== "O") {
    return;
  }

  waitingForComputer = true;
  render();

  computerTurnTimer = window.setTimeout(() => {
    if (!gameActive) {
      return;
    }
    waitingForComputer = false;
    const move = getBestComputerMove();
    applyMove(move, "O");
    computerTurnTimer = null;
  }, 320);
}

function handleCellClick(event) {
  const button = event.target.closest(".cell");
  if (!button || !gameActive || waitingForComputer) {
    return;
  }

  const index = Number(button.dataset.cellIndex);
  if (boardState[index]) {
    return;
  }

  applyMove(index, currentPlayer);
  triggerComputerTurn();
}

function handleModeChange(event) {
  const button = event.target.closest(".mode-button");
  if (!button) {
    return;
  }

  gameMode = button.dataset.mode;
  modeButtons.forEach((modeButton) => {
    modeButton.classList.toggle("is-active", modeButton === button);
  });

  resetScores();
  resetBoard();
}

boardElement.addEventListener("click", handleCellClick);
restartButton.addEventListener("click", resetBoard);
resetScoreButton.addEventListener("click", () => {
  resetScores();
  resetBoard();
});
modeButtons.forEach((button) => {
  button.addEventListener("click", handleModeChange);
});

renderScores();
render();
