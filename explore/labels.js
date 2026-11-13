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
    element.textContent = thing.label;
    holder.append(element);
    tags.push({ thing, element });
  }
}

// Puts each tag just above its thing. main.js calls this every time it
// draws, because on a map bigger than the screen the things move
// across the screen as the player walks.
export function positionLabels(camera) {
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
    element.hidden = !onScreen;
  }
}
