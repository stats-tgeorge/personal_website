// map.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// Questions about "the map the player is on right now": what tile is
// here, and can it be walked on? The maps themselves are in the maps/
// folder (outdoor.js for the campus, one file per room).
//
// Only one map is in use at a time. main.js calls useMap() to switch
// when the player goes through a door.

import { OUTDOOR_ROWS } from "./maps/outdoor.js";

// The rows of the map currently in use.
let rows = OUTDOOR_ROWS;

// Tiles the player can walk on. Anything else is solid.
//   . grass   : path   @ start marker   _ floor   E exit mat
//   p portal or bubble spot   o desk spot   n helper spot
// (An "o" or "n" spot is floor until something is put on it; whatever
// is put there is listed in blockedSpots below, which makes it solid.)
const WALKABLE = ".:@_pEon";

// Tiles made solid by something standing on them: a desk, a helper,
// or something a helper brought along (a whiteboard, a server).
let blockedSpots = new Set();

// Switch to a different map. "blocked" is an optional list of
// { col, row } positions to treat as solid on top of the map's own tiles.
export function useMap(newRows, blocked = []) {
  rows = newRows;
  blockedSpots = new Set(blocked.map((spot) => `${spot.col},${spot.row}`));
  warnAboutUnevenRows(rows);
}

export function mapCols() {
  return rows[0].length;
}

export function mapRows() {
  return rows.length;
}

// Returns the character at a map position. Anything off the edge of
// the map is " " (empty space), which is solid, so the player can never
// leave the map even if its border has a gap in it.
export function tileAt(col, row) {
  if (row < 0 || row >= rows.length || col < 0 || col >= rows[0].length) return " ";
  return rows[row][col];
}

export function isSolid(col, row) {
  if (blockedSpots.has(`${col},${row}`)) return true;
  return !WALKABLE.includes(tileAt(col, row));
}

// Finds every copy of a character in a set of map rows, in reading
// order (left to right, top to bottom). Returns a list of { col, row }.
// Unlike the functions above, this takes the rows as an argument, so
// it can inspect a map that is not the one currently in use.
export function findInRows(mapRowsToSearch, char) {
  const found = [];
  mapRowsToSearch.forEach((rowText, row) => {
    for (let col = 0; col < rowText.length; col++) {
      if (rowText[col] === char) found.push({ col, row });
    }
  });
  return found;
}

// A typo check for whoever edits a map: uneven rows are the most
// likely mistake, and they cause confusing behaviour, so report them.
// Open the browser console (F12) to see these messages.
function warnAboutUnevenRows(rowsToCheck) {
  rowsToCheck.forEach((rowText, row) => {
    if (rowText.length !== rowsToCheck[0].length) {
      console.warn(
        `Map row ${row + 1} has ${rowText.length} characters, but row 1 has ` +
          `${rowsToCheck[0].length}. All rows must be the same length.`
      );
    }
  });
}
warnAboutUnevenRows(rows);
