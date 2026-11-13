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
import { game, startGame, updateGame, hudText } from "./game.js";
import { drawGame } from "./draw.js";
import { isHighScore, saveHighScore, recordFinalScore, leaderboardLines, histogramHtml } from "./scores.js";
import { MODES } from "./levels.js";
import { openDialogue } from "../dialogue.js";
import { setLabelText } from "../labels.js";

const canvas = document.getElementById("game-canvas");
const modeBox = document.getElementById("mode-choice");
const entryForm = document.getElementById("score-entry");
const entryCode = document.getElementById("score-code");
const entryScore = document.getElementById("score-entry-score");

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

  // When a game ends its score is noted for the histogram, and a
  // score good enough for the leaderboard earns three letters on it.
  game.onGameOver = (score, mode) => {
    recordFinalScore(mode, score);
    if (isHighScore(mode, score)) askForCode(score, mode);
    else writeLeaderboards();
  };

  if (formulaBar) formulaBar.label = game.remark;
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

// Keeps the formula bar showing the game's latest message. main.js
// calls this every frame; it only does anything when the message changes.
export function updateFormulaBar() {
  if (!formulaBar || !game.remarkChanged) return;
  setLabelText(formulaBar, game.remark);
  game.remarkChanged = false;
}

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
    board.description = "The top five are on the board. Look closer to see how every finished game has scored.";
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
  saveHighScore(pendingScore.mode, code, pendingScore.score);
  pendingScore = null;
  entryForm.hidden = true;
  writeLeaderboards();
  canvas.focus(); // hand the keyboard back to the map
});

// Typing in the box must not reach the rest of the page (Quarto's
// search listens for "s" and "f"), the same as in input.js.
entryForm.addEventListener("keydown", (event) => event.stopPropagation());
entryForm.addEventListener("keyup", (event) => event.stopPropagation());
