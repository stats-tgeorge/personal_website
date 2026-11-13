// main.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The starting point of explore mode. explore.qmd loads this one file,
// and it pulls in the others:
//
//   config.js       numbers you can tune (tile size, walking speed, ...)
//   maps/           the maps, as rows of text (outdoor.js, one file per room)
//   map.js          questions about the map in use (what tile is here?)
//   tiles.js        how each kind of tile is drawn
//   input.js        which keys are held down
//   player.js       moving and drawing the player
//   camera.js       which part of the map is on screen
//   places.js       joins the buildings outdoors to explore-world.yml
//   rooms.js        sets up the inside of a building
//   page-reader.js  reads a room's content from its ordinary web page
//   things.js       what the player can interact with, and reaching it
//   panel.js        the description shown when something is in reach
//   labels.js       name tags above things in a room
//   reader.js       the large pop-up for reading part of the regular site
//   dialogue.js     the conversation box (talking to the fairy)
//   warp.js         the zoom when stepping through a portal
//   posters.js      the wall posters and the real data behind them
//   minigame/       Sheet Breaker, the game outdoors
//   character.js    draws people (the player and the helpers)
//   creator.js      the "choose your character" box shown at the start
//   layout.js       makes the game fill the browser window
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
import { showThing, activateShownThing, onGoInside, onStepThrough, refreshPanel } from "./panel.js";
import { playWarp } from "./warp.js";
import { showLabelsFor, positionLabels, setPlayerTag, positionPlayerTag } from "./labels.js";
import { onReaderClosed } from "./reader.js";
import { fillTheWindow } from "./layout.js";
import { dialogueIsOpen, advanceDialogue, closeDialogue } from "./dialogue.js";
import { gameAction, quitGame, gameIsActive } from "./minigame/game.js";
import { setUpStall, stallCamera, updateStall, drawStall, stallHud, updateFormulaBar } from "./minigame/stall.js";
import { chooseCharacter } from "./creator.js";

const canvas = document.getElementById("game-canvas");
const startHint = document.getElementById("game-start-hint");
const fallbackNote = document.getElementById("game-fallback");
const sceneLabel = document.getElementById("scene-label");
const ctx = canvas.getContext("2d");

// What the keys do depends on what is going on:
//   Enter or Space  during a conversation: move it on a line;
//                   during Sheet Breaker: launch the ball;
//                   otherwise: the main action of whatever is in reach.
//   Escape          ends a conversation, or quits Sheet Breaker.
const input = createInput(
  canvas,
  () => {
    if (dialogueIsOpen()) advanceDialogue();
    else if (gameIsActive()) gameAction();
    else activateShownThing();
  },
  () => {
    if (dialogueIsOpen()) closeDialogue();
    else if (gameIsActive()) quitGame();
  },
  () => false // no other keys are used at present
);
const start = findInRows(OUTDOOR_ROWS, "@")[0] || { col: 1, row: 1 };
const player = createPlayer(start.col, start.row);

// --- Where the player is ------------------------------------------------
// "things" is what can be interacted with on the map in use: the
// buildings' doors when outdoors, or the contents of a room.
let things = [];
let outdoorPlaces = []; // the doors, kept so we can come back to them
let insidePlace = null; // the building we are inside, or null when outdoors
let spotOutside = null; // where the player stood before going in
let reached = null; // the thing currently in reach (null = nothing)

// The places from explore-world.yml. The list starts empty and is
// filled a moment later, once the file has been fetched. If the file
// cannot be loaded, the map still works; it just has no signs or
// pop-ups, and the plain list of links under the map is still there.
loadPlaces()
  .then((loaded) => {
    outdoorPlaces = loaded;
    if (!insidePlace) {
      things = outdoorPlaces;
      showLabelsFor(things); // the game stall and leaderboard have name tags
    }
    // Give the game stall its buttons and fill in the leaderboard.
    // When the scores change, the name tags are written again.
    setUpStall(
      outdoorPlaces,
      () => {
        if (!insidePlace) showLabelsFor(things);
      },
      () => player.initials
    );
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
  showLabelsFor(things);
  movePlayerToTile(player, room.start.col, room.start.row, "up");
  sceneLabel.textContent = place.title; // screen readers announce this
  canvas.focus(); // clicking "Go inside" moved focus to that button
  draw();
}
onGoInside(goInside);

// Stepping through a portal (or a blog bubble) to another website:
// zoom in on it, then open the site in a new tab.
onStepThrough((thing) => {
  // Where the portal is on screen, as a percentage of the map's size.
  const camera = cameraFor(player);
  const xPercent = (((thing.col + 0.5) * TILE - camera.x) / (VIEW_COLS * TILE)) * 100;
  const yPercent = (((thing.row + 0.5) * TILE - camera.y) / (VIEW_ROWS * TILE)) * 100;

  playWarp(xPercent, yPercent, () => {
    const newTab = window.open(thing.url, "_blank");
    if (newTab) {
      newTab.opener = null; // the other site gets no handle on this page
    } else {
      // Some browsers refuse to open a tab a moment after the key
      // press. Say so, and let the button work as an ordinary link.
      thing.plainLink = true;
      thing.description += " (Your browser stopped the new tab from opening. Click the button to open it.)";
      refreshPanel();
    }
  });
});

// Coming back out: the player returns to where they stood at the door.
function goOutside() {
  insidePlace = null;
  closeDialogue();
  useMap(OUTDOOR_ROWS);
  things = outdoorPlaces;
  showLabelsFor(things); // (buildings have signs on their roofs, not tags)
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
fillTheWindow();

// --- Drawing ---------------------------------------------------------
function draw() {
  // The view follows the player, except during Sheet Breaker, when it
  // holds still on the stall.
  const camera = gameIsActive() ? stallCamera() : cameraFor(player);

  // Only draw the tiles that are on screen (plus one extra row and
  // column, because the view usually starts part-way through a tile).
  const firstCol = Math.floor(camera.x / TILE);
  const firstRow = Math.floor(camera.y / TILE);
  for (let row = firstRow; row <= firstRow + VIEW_ROWS; row++) {
    for (let col = firstCol; col <= firstCol + VIEW_COLS; col++) {
      drawTile(ctx, tileAt(col, row), col * TILE - camera.x, row * TILE - camera.y, col, row);
    }
  }

  if (!insidePlace) drawStall(ctx, camera); // the game, or its still display
  drawThings(ctx, things, camera, performance.now());
  if (!insidePlace) drawSigns(ctx, things.filter((thing) => thing.kind === "door"), camera);
  drawPlayer(ctx, player, player.x - camera.x, player.y - camera.y);
  positionLabels(camera); // keep the name tags above their things
  positionPlayerTag(player.x - camera.x, player.y - camera.y);
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

  if (gameIsActive()) {
    // Sheet Breaker is being played: it gets the keys, and the strip
    // shows the score line. (The game waits while a message is up.)
    if (!dialogueIsOpen()) updateStall(seconds, input, player);
    reached = null;
    const hud = stallHud();
    showThing(hud.thing);
    if (hud.changed) refreshPanel();
  } else {
    walkAbout(seconds, now);
  }
  updateFormulaBar(); // Sheet Breaker's latest message, if it changed

  draw();
  requestAnimationFrame(frame); // ask the browser to call frame() again
}

// One frame of ordinary exploring: walk, leave rooms, and describe
// whatever is in reach.
function walkAbout(seconds, now) {
  // The player stands still while someone is talking to them.
  if (!dialogueIsOpen()) updatePlayer(player, input, seconds);

  // Stepping onto a room's exit mat ("E") takes the player back outside.
  if (insidePlace && tileUnderPlayer() === "E") goOutside();

  // Describe whatever is in reach. When the player first comes up to
  // something, note the time: things that react (the tutors' high-five
  // in people.js) use it to time their animation.
  const nowReached = thingInReach(player, things);
  if (nowReached && nowReached !== reached) {
    nowReached.reachedAt = now;
    // Some things do something when the player arrives (the fairy
    // goes back to the start of what she has to say).
    if (nowReached.onReach) nowReached.onReach();
  }
  reached = nowReached;
  showThing(reached);
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
  // If focus moved into the description strip (the visitor is about to
  // click its button or link), the conversation box or the large
  // reader, do not put the "click to start" hint on top of things.
  const stillInGame = ["place-panel", "reader", "dialogue", "score-entry", "mode-choice", "creator"].some((id) =>
    document.getElementById(id).contains(event.relatedTarget)
  );
  startHint.hidden = stillInGame;
});

// When the large reader is closed, hand the keyboard back to the game
// so the visitor can carry on walking straight away.
onReaderClosed(() => canvas.focus());

// When explore mode opens, the visitor chooses a character. Their
// choices go onto the player, and the game starts.
chooseCharacter((choice) => {
  player.look = choice.look;
  player.initials = choice.initials;
  setPlayerTag(choice.initials);
  canvas.focus();
  draw();
});

// Clicking the hint (which sits on top of the canvas) starts the game.
startHint.addEventListener("click", () => canvas.focus());

// Draw once now, so the map is visible behind the hint before the
// visitor starts.
draw();
