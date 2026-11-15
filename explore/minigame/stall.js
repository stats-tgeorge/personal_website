// minigame/stall.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The join between Sheet Breaker and the rest of explore mode. The
// game itself (game.js) knows nothing about the campus map; this file
// puts it in its place on the map, gives it its "Play" button and the
// box asking who is playing, writes its messages in the formula bar,
// keeps the two leaderboards beside it up to date, and asks for three
// letters when someone gets a high score.
//
// main.js calls the functions here; nothing else needs to.

import { TILE, PLAYER_WIDTH, PLAYER_HEIGHT } from "../config.js";
import { game, startGame, quitGame, updateGame, hudText } from "./game.js";
import { drawGame } from "./draw.js";
import { refreshScores, recordGame, isHighScore, leaderboardLines, histogramHtml, scoresAsCsv } from "./scores.js";
import { MODES } from "./levels.js";
import { openDialogue } from "../dialogue.js";
import { setLabelText } from "../labels.js";

const canvas = document.getElementById("game-canvas");
const modeBox = document.getElementById("mode-choice");
const entryForm = document.getElementById("score-entry");
const entryCode = document.getElementById("score-code");
const entryScore = document.getElementById("score-entry-score");
const quitButton = document.getElementById("game-quit");

let stall = null; // the "booth" thing from places.js, once found
let leaderboards = []; // the two "leaderboard" things (students', instructors')
let formulaBar = null; // the "formula" thing: its name tag shows the game's messages
let sheetCorner = null; // where the play area's top-left corner is on the map, in pixels
let scoresChanged = () => {}; // main.js's "redraw the name tags" step
let playerInitials = () => ""; // main.js's way of telling us the player's initials

// The score line shown in the strip while a game is on. It is a
// "thing" like any other, so panel.js can show it.
const hud = { kind: "hud", title: "", description: "" };

// Called once by main.js when the outdoor things have been loaded.
//   things             the list from places.js
//   whenScoresChange   what to do when a leaderboard's words change
//   getInitials        a function returning the player's initials
export function setUpStall(things, whenScoresChange, getInitials) {
  stall = things.find((thing) => thing.kind === "booth") || null;
  leaderboards = things.filter((thing) => thing.kind === "leaderboard");
  formulaBar = things.find((thing) => thing.kind === "formula") || null;
  scoresChanged = whenScoresChange;
  playerInitials = getInitials;
  if (!stall) return; // no game on the map: nothing to set up

  // The play area's corner: the stall thing sits on the bottom row of
  // the play area, which is 10 tiles tall.
  sheetCorner = { x: stall.col * TILE, y: (stall.row - 9) * TILE };

  // "Play" opens a box asking who is playing (set up further down).
  stall.buttonLabel = "Play";
  stall.press = () => modeBox.showModal();

  // Messages between levels use the conversation box.
  game.onMessage = (lines, then) => openDialogue("Sheet Breaker", lines, then);

  // When a game ends: a score good enough for the leaderboard earns
  // three letters on it (asked for first, then recorded); any other
  // score is recorded straight away under the player's initials.
  game.onGameOver = (score, mode) => {
    if (isHighScore(mode, score)) askForCode(score, mode);
    else keepScore(mode, playerInitials(), score);
  };

  if (formulaBar) formulaBar.label = game.remark;
  writeLeaderboards();
  // If scores are shared through the Google Sheet, fetch everyone's
  // and write the boards again when they arrive.
  refreshScores().then(writeLeaderboards);
}

// Records a finished game, then brings the boards up to date: at once
// with this game added, and again once the shared list has been
// fetched afresh (which is when other people's new games show up).
function keepScore(mode, code, score) {
  recordGame(mode, code, score).then(refreshScores).then(writeLeaderboards);
  writeLeaderboards();
}

// ---- The box asking who is playing ---------------------------------------------
// One button for each way to play. Clicking a button (or pressing
// Enter on it) starts the game.
for (const button of modeBox.querySelectorAll("button[data-mode]")) {
  button.addEventListener("click", () => {
    modeBox.close();
    startGame(button.dataset.mode); // "student" or "instructor"
  });
}
// The left and right arrow keys move between the two buttons.
modeBox.addEventListener("keydown", (event) => {
  event.stopPropagation(); // keep the keys away from Quarto's search, as in input.js
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    const buttons = [...modeBox.querySelectorAll("button[data-mode]")];
    const other = buttons.find((button) => button !== document.activeElement) || buttons[0];
    other.focus();
  }
});
modeBox.addEventListener("keyup", (event) => event.stopPropagation());
// However the box closes, hand the keyboard back to the map.
modeBox.addEventListener("close", () => canvas.focus());

// ---- While playing -----------------------------------------------------------
// While a game is on, the view stays fixed on the game instead of
// following the player. It starts 2 tiles left of the play area and 2
// rows above it, which shows the whole spreadsheet, its menu and
// formula bars, and both leaderboards.
export function stallCamera() {
  return { x: sheetCorner.x - 2 * TILE, y: sheetCorner.y - 2 * TILE };
}

// One frame of play. The player character moves left and right along
// the front of the sheet, carrying the paddle over their head.
export function updateStall(seconds, input, player) {
  updateGame(seconds, input);
  player.x = sheetCorner.x + game.paddleX - PLAYER_WIDTH / 2;
  player.y = (stall.row + 1) * TILE + (TILE - PLAYER_HEIGHT) / 2;
  player.facing = "up";
  player.moving = false;
}

// Draws the game (or its still display) in its place on the map.
export function drawStall(ctx, camera) {
  if (sheetCorner) drawGame(ctx, sheetCorner.x - camera.x, sheetCorner.y - camera.y);
}

// Keeps two things about the game current. main.js calls this every
// frame; it only does any work when something has changed.
//   - the formula bar shows the game's latest message
//   - the "Quit" button is on screen only while a game is being played
export function refreshStall() {
  // (not while a message is being read: then the game is "waiting")
  quitButton.hidden = !(game.state === "serve" || game.state === "play");
  if (!formulaBar || !game.remarkChanged) return;
  setLabelText(formulaBar, game.remark);
  game.remarkChanged = false;
}

// The Quit button does the same as the Esc key.
quitButton.addEventListener("click", () => {
  quitGame();
  canvas.focus();
});

// The score line for the strip. "changed" is true when its words are
// different from last time, so main.js knows to re-write the strip.
export function stallHud() {
  const changed = game.hudChanged;
  if (changed) {
    Object.assign(hud, hudText());
    game.hudChanged = false;
  }
  return { thing: hud, changed };
}

// ---- The leaderboards ---------------------------------------------------------
// Writes each board's scores (its name tag), and what the strip and the
// large reader show to someone who walks up to it.
function writeLeaderboards() {
  for (const board of leaderboards) {
    const who = MODES[board.mode].name; // "Student" or "Instructor"
    // On the board itself: the top five. "\n" starts a new line.
    board.label = [`${who.toUpperCase()}S`, ...leaderboardLines(board.mode)].join("\n");
    board.title = `Sheet Breaker: ${who.toLowerCase()} high scores`;
    board.description = "The top five are on the board. Look closer for a histogram of every finished game, and to download the scores.";
    board.readerTitle = `How ${who.toLowerCase()}s have scored`;
    board.html = histogramHtml(board.mode);
    board.linkLabel = "See all scores";
  }
  scoresChanged();
}

// Shows the little form asking for three letters or numbers. It
// starts with the player's initials, if they gave any.
let pendingScore = null;
function askForCode(score, mode) {
  pendingScore = { score, mode };
  entryScore.textContent = score.toLocaleString();
  entryCode.value = playerInitials();
  entryForm.hidden = false;
  entryCode.focus();
  entryCode.select();
}

entryForm.addEventListener("submit", (event) => {
  event.preventDefault(); // a form normally reloads the page; not wanted here
  // Keep letters and numbers only, in capitals. "AAA" if nothing was typed.
  const code = entryCode.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "AAA";
  keepScore(pendingScore.mode, code, pendingScore.score);
  pendingScore = null;
  entryForm.hidden = true;
  canvas.focus(); // hand the keyboard back to the map
});

// ---- Downloading the scores -----------------------------------------------------
// The histogram in the large reader ends with a "Download" button
// (made in scores.js). The reader's content is rebuilt every time it
// opens, so the click is listened for on the reader itself, which is
// always there, and the button is recognised by its class.
document.getElementById("reader-content").addEventListener("click", (event) => {
  const button = event.target.closest(".download-scores");
  if (!button) return;
  const mode = button.dataset.mode; // "student" or "instructor"

  // Make the text into a file the browser can save, and "click" an
  // invisible link to it, which is how a page starts a download.
  const file = new Blob([scoresAsCsv(mode)], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = `sheet-breaker-${mode}-scores.csv`;
  link.click();
  URL.revokeObjectURL(link.href); // tidy up the temporary address
});

// Typing in the box must not reach the rest of the page (Quarto's
// search listens for "s" and "f"), the same as in input.js.
entryForm.addEventListener("keydown", (event) => event.stopPropagation());
entryForm.addEventListener("keyup", (event) => event.stopPropagation());
