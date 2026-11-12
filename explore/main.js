// main.js
// The starting point of explore mode. explore.qmd loads this one file,
// and it pulls in the others:
//
//   config.js  numbers you can tune (tile size, walking speed, ...)
//   map.js     the world, as rows of text
//   tiles.js   how each kind of tile is drawn
//   input.js   which keys are held down
//   player.js  moving and drawing the player
//   camera.js  which part of the map is on screen
//   places.js  joins the buildings on the map to the entries in explore-world.yml
//   panel.js   the pop-up shown at a door
//
// The game repeats three steps many times a second: read the keys,
// move the player, redraw the screen.

import { TILE, VIEW_COLS, VIEW_ROWS } from "./config.js";
import { tileAt, findPlayerStart } from "./map.js";
import { drawTile } from "./tiles.js";
import { createInput } from "./input.js";
import { createPlayer, updatePlayer, drawPlayer } from "./player.js";
import { cameraFor } from "./camera.js";
import { loadPlaces, placeInFrontOf, drawSigns } from "./places.js";
import { showPlace, openShownPlace } from "./panel.js";

const canvas = document.getElementById("game-canvas");
const startHint = document.getElementById("game-start-hint");
const fallbackNote = document.getElementById("game-fallback");
const ctx = canvas.getContext("2d");

// Pressing Enter or Space opens the place whose pop-up is showing.
const input = createInput(canvas, openShownPlace);
const start = findPlayerStart();
const player = createPlayer(start.col, start.row);

// The places from explore-world.yml. The list starts empty and is filled in a
// moment later, once the file has been fetched. If the file cannot be
// loaded, the map still works; it just has no signs or pop-ups, and
// the plain list of links under the map is still there.
let places = [];
loadPlaces()
  .then((loaded) => {
    places = loaded;
    draw(); // redraw so the signs appear straight away
  })
  .catch((error) => console.warn("Explore mode: places not loaded.", error));

// --- Show the game -------------------------------------------------
// In explore.qmd the canvas starts hidden and a "needs JavaScript" note
// is shown. If this script is running, JavaScript works, so swap them.
canvas.hidden = false;
startHint.hidden = false;
fallbackNote.hidden = true;

// --- Drawing ---------------------------------------------------------
function draw() {
  const camera = cameraFor(player);

  // Only draw the tiles that are on screen (plus one extra row and
  // column, because the view usually starts part-way through a tile).
  const firstCol = Math.floor(camera.x / TILE);
  const firstRow = Math.floor(camera.y / TILE);
  for (let row = firstRow; row <= firstRow + VIEW_ROWS; row++) {
    for (let col = firstCol; col <= firstCol + VIEW_COLS; col++) {
      drawTile(ctx, tileAt(col, row), col * TILE - camera.x, row * TILE - camera.y, col, row);
    }
  }

  drawSigns(ctx, places, camera);
  drawPlayer(ctx, player, player.x - camera.x, player.y - camera.y);
}

// --- The game loop -----------------------------------------------------
// The loop only runs while the canvas has keyboard focus. When the
// visitor clicks or tabs elsewhere, the game stops completely, so it
// uses no battery in a background tab or while someone reads the page.
let running = false;
let lastTime = 0;

function frame(now) {
  if (!running) return;

  // Time since the previous frame, in seconds. It is capped because
  // browsers pause animation in hidden tabs; without the cap, the
  // player would leap across the map (possibly through a wall) when
  // the tab is shown again.
  const seconds = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  updatePlayer(player, input, seconds);
  showPlace(placeInFrontOf(player, places)); // pop-up appears at a door
  draw();
  requestAnimationFrame(frame); // ask the browser to call frame() again
}

canvas.addEventListener("focus", () => {
  startHint.hidden = true;
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(frame);
});

canvas.addEventListener("blur", () => {
  running = false;
  startHint.hidden = false;
});

// Clicking the hint (which sits on top of the canvas) starts the game.
startHint.addEventListener("click", () => canvas.focus());

// Draw once now, so the map is visible behind the hint before the
// visitor starts.
draw();
