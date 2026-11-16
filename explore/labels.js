// labels.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The name tags that float above things in a room ("Read Now" above
// the chalkboard, a course name above each desk).
//
// The tags are ordinary HTML laid over the map, not drawn on the
// canvas, because the canvas is only 320 pixels wide and text drawn on
// it is blocky and hard to read. HTML text stays sharp at any size.
//
// A thing gets a tag by having a "label" property (see things.js).

import { TILE, VIEW_COLS, VIEW_ROWS } from "./config.js";

const holder = document.getElementById("thing-labels");

// The tags currently on screen, as pairs: { thing, element }.
let tags = [];

// Replaces the tags with ones for a new set of things. main.js calls
// this whenever the player changes map.
export function showLabelsFor(things) {
  holder.replaceChildren(); // remove the old tags
  tags = [];
  for (const thing of things) {
    if (!thing.label) continue;
    const element = document.createElement("div");
    // A thing on the top wall has no room above it, so its tag hangs
    // below instead (thing.labelBelow; styled in explore.css).
    element.className = thing.labelBelow ? "thing-label below" : "thing-label";
    // Things that stand close together (museum pedestals) get a
    // narrower tag, so neighbours do not overlap.
    if (thing.narrowLabel) element.classList.add("narrow");
    // Some tags are styled as part of Sheet Breaker's spreadsheet:
    // the scores on a leaderboard, the game's name, the formula bar.
    if (["leaderboard", "marquee", "formula"].includes(thing.kind)) element.classList.add(thing.kind);
    if (thing.thought) element.classList.add("thought"); // a question someone is thinking
    element.textContent = thing.label;
    holder.append(element);
    tags.push({ thing, element });
  }
}

// Puts each tag just above its thing. main.js calls this every time it
// draws, because on a map bigger than the screen the things move
// across the screen as the player walks.
// On a phone the map is small, and a room full of name tags becomes
// an unreadable pile. Below this width (in screen pixels), only the
// tags of things within NEAR_TILES of the player are shown, so tags
// appear as the player walks up to things.
const SMALL_MAP = 520;
const NEAR_TILES = 3;

// player (optional) = where the player is, for the rule just above.
export function positionLabels(camera, player) {
  const nearbyOnly = player && holder.clientWidth < SMALL_MAP;
  for (const { thing, element } of tags) {
    // Where the thing is on screen, in game pixels...
    // (thing.wide is 2 for a thing that fills two tiles side by side.)
    const x = (thing.col + (thing.wide || 1) / 2) * TILE - camera.x; // its centre
    // Top of its tile, or the bottom for a tag that hangs below.
    const y = (thing.row + (thing.labelBelow ? 1 : 0)) * TILE - camera.y;

    // ...converted to a percentage of the map's size, so the tag stays
    // in the right place however large the map is shown.
    element.style.left = `${(x / (VIEW_COLS * TILE)) * 100}%`;
    element.style.top = `${(y / (VIEW_ROWS * TILE)) * 100}%`;

    // Hide tags for things that have scrolled off the screen.
    const onScreen = x >= 0 && x <= VIEW_COLS * TILE && y >= 0 && y <= VIEW_ROWS * TILE;
    // The big signs (the game's title, its message bar, the
    // leaderboards) always show; only ordinary name tags are thinned out.
    const ordinary = !["leaderboard", "marquee", "formula"].includes(thing.kind);
    // A "thought" (a question on the Support Trail) is long, and there
    // are several close together, so on every size of screen it only
    // appears when the player walks up.
    const far =
      player &&
      (thing.thought || (nearbyOnly && ordinary)) &&
      Math.hypot(x + camera.x - player.x, y + camera.y - player.y) > NEAR_TILES * TILE;
    element.hidden = !onScreen || far;
  }
}

// Changes the words on a thing's tag while it is on screen (the
// formula bar's message, a leaderboard after a new high score).
export function setLabelText(thing, text) {
  thing.label = text;
  const tag = tags.find((candidate) => candidate.thing === thing);
  if (tag) tag.element.textContent = text;
}

// The player's own tag: their initials, floating above their head. It
// is separate from the tags above because it follows the player.
const playerTag = document.getElementById("player-tag");

export function setPlayerTag(initials) {
  playerTag.textContent = initials;
  playerTag.hidden = initials === "";
}

// playerX, playerY = where the player's footprint is on screen, in game pixels.
export function positionPlayerTag(playerX, playerY) {
  playerTag.style.left = `${((playerX + 5) / (VIEW_COLS * TILE)) * 100}%`; // centre of the player
  playerTag.style.top = `${((playerY - 12) / (VIEW_ROWS * TILE)) * 100}%`; // just above the head
}
