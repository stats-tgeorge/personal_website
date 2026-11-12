// main.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The starting point of explore mode. explore.qmd loads this one file,
// and it pulls in the others:
//
//   config.js       numbers you can tune (tile size, walking speed, ...)
//   maps/           the maps, as rows of text (outdoor.js, classroom.js)
//   map.js          questions about the map in use (what tile is here?)
//   tiles.js        how each kind of tile is drawn
//   input.js        which keys are held down
//   player.js       moving and drawing the player
//   camera.js       which part of the map is on screen
//   places.js       joins the buildings outdoors to explore-world.yml
//   rooms.js        sets up the inside of a building
//   page-reader.js  reads a room's content from its ordinary web page
//   things.js       what the player can interact with, and reaching it
//   panel.js        the small pop-up shown when something is in reach
//   reader.js       the large pop-up for reading part of the regular site
//
// The game repeats three steps many times a second: read the keys,
// move the player, redraw the screen.

import { TILE, VIEW_COLS, VIEW_ROWS, PLAYER_WIDTH, PLAYER_HEIGHT } from "./config.js";
import { useMap, tileAt, findInRows } from "./map.js";
import { OUTDOOR_ROWS } from "./maps/outdoor.js";
import { drawTile } from "./tiles.js";
import { createInput } from "./input.js";
import { createPlayer, movePlayerToTile, updatePlayer, drawPlayer } from "./player.js";
import { cameraFor } from "./camera.js";
import { loadPlaces, drawSigns } from "./places.js";
import { loadRoom } from "./rooms.js";
import { thingInReach, drawThings } from "./things.js";
import { showThing, activateShownThing, onGoInside, keepPanelClearOf } from "./panel.js";
import { onReaderClosed } from "./reader.js";

const canvas = document.getElementById("game-canvas");
const startHint = document.getElementById("game-start-hint");
const fallbackNote = document.getElementById("game-fallback");
const sceneLabel = document.getElementById("scene-label");
const ctx = canvas.getContext("2d");

// Pressing Enter or Space does the main action of the pop-up on show.
const input = createInput(canvas, activateShownThing);
const start = findInRows(OUTDOOR_ROWS, "@")[0] || { col: 1, row: 1 };
const player = createPlayer(start.col, start.row);

// --- Where the player is ------------------------------------------------
// "things" is what can be interacted with on the map in use: the
// buildings' doors when outdoors, or the contents of a room.
let things = [];
let outdoorPlaces = []; // the doors, kept so we can come back to them
let insidePlace = null; // the building we are inside, or null when outdoors
let spotOutside = null; // where the player stood before going in

// The places from explore-world.yml. The list starts empty and is
// filled a moment later, once the file has been fetched. If the file
// cannot be loaded, the map still works; it just has no signs or
// pop-ups, and the plain list of links under the map is still there.
loadPlaces()
  .then((loaded) => {
    outdoorPlaces = loaded;
    if (!insidePlace) things = outdoorPlaces;
    draw(); // redraw so the signs appear straight away
  })
  .catch((error) => console.warn("Explore mode: places not loaded.", error));

// Going through a building's door.
async function goInside(place) {
  const room = await loadRoom(place);
  spotOutside = { x: player.x, y: player.y };
  insidePlace = place;
  useMap(room.rows, room.blocked);
  things = room.things;
  movePlayerToTile(player, room.start.col, room.start.row, "up");
  sceneLabel.textContent = place.title; // screen readers announce this
  canvas.focus(); // clicking "Go inside" moved focus to that button
  draw();
}
onGoInside(goInside);

// Coming back out: the player returns to where they stood at the door.
function goOutside() {
  insidePlace = null;
  useMap(OUTDOOR_ROWS);
  things = outdoorPlaces;
  player.x = spotOutside.x;
  player.y = spotOutside.y;
  player.facing = "down";
  sceneLabel.textContent = "Outside";
}

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

  if (insidePlace) {
    drawThings(ctx, things, camera);
  } else {
    drawSigns(ctx, things, camera);
  }
  drawPlayer(ctx, player, player.x - camera.x, player.y - camera.y);

  // Keep the pop-up from covering the player.
  keepPanelClearOf(player.y - camera.y > (VIEW_ROWS * TILE) / 2);
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

  // Stepping onto a room's exit mat ("E") takes the player back outside.
  if (insidePlace && tileUnderPlayer() === "E") goOutside();

  showThing(thingInReach(player, things)); // pop-up for whatever is in reach
  draw();
  requestAnimationFrame(frame); // ask the browser to call frame() again
}

// The map character under the centre of the player's feet.
function tileUnderPlayer() {
  const col = Math.floor((player.x + PLAYER_WIDTH / 2) / TILE);
  const row = Math.floor((player.y + PLAYER_HEIGHT / 2) / TILE);
  return tileAt(col, row);
}

canvas.addEventListener("focus", () => {
  startHint.hidden = true;
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(frame);
});

canvas.addEventListener("blur", (event) => {
  running = false;
  // If focus moved into the small pop-up (the visitor is about to
  // click its button or link) or into the large reader, do not put the
  // "click to start" hint on top of things.
  const panel = document.getElementById("place-panel");
  const reader = document.getElementById("reader");
  startHint.hidden = panel.contains(event.relatedTarget) || reader.contains(event.relatedTarget);
});

// When the large reader is closed, hand the keyboard back to the game
// so the visitor can carry on walking straight away.
onReaderClosed(() => canvas.focus());

// Clicking the hint (which sits on top of the canvas) starts the game.
startHint.addEventListener("click", () => canvas.focus());

// Draw once now, so the map is visible behind the hint before the
// visitor starts.
draw();
