// map.js
// The world map, written as text so it can be edited without any tools.
// Each character is one tile. Every row must be the same length.
//
//   .  grass            (walkable)
//   :  path             (walkable)
//   @  where the player starts (drawn as path; use exactly one)
//   T  tree             (blocks the player)
//   ~  water            (blocks the player)
//   ^  roof             (blocks the player)
//   #  building wall    (blocks the player)
//   1-9  a building's door (blocks the player; the player stands in
//        front of it). The digit is how a building will be matched to
//        its entry in the content file in the next milestone.

export const MAP_ROWS = [
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "T....T...............T...............T.T",
  "T.T.T...T......^^^^^^^^^T..............T",
  "T..T......T..T.^^^^^^^^^T..............T",
  "T...........T..#########.............T.T",
  "T.....^^^^^^^..####4####...^^^^^^^.....T",
  "T.....^^^^^^^...T..::.T....^^^^^^^.....T",
  "T.....#######....T.::......#######..T..T",
  "T...T.###1###......::......###2###.....T",
  "T........:.....T...::...T.....:..~~~...T",
  "TT...TT..:.T...TT..::...T.....:.~~~~~..T",
  "T........:.T.......::.........:.~~~~~.TT",
  "T........:.........::.........:........T",
  "T..::::::::::::::::::::::::::::::::::..T",
  "T..::::::::::::::::::::::::::::::::::..T",
  "T..................::..................T",
  "T...............T..@:.....T............T",
  "T.....^^^^^^^......::....T.^^^^^^^.....T",
  "T..T..^^^^^^^......::.....T^^^^^^^T....T",
  "T.....#######......::......#######.....T",
  "T.....###3###......::......###5###....TT",
  "T.T......:.........::.........:....T...T",
  "T........::::::::::::::::::::::........T",
  "T...T..............::................T.T",
  "T......T...........::.......T..........T",
  "T......................................T",
  "T................T.T....T..............T",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
];

export const MAP_COLS = MAP_ROWS[0].length;
export const MAP_HEIGHT = MAP_ROWS.length; // number of rows

// The only tiles the player can walk on. Anything else is solid.
const WALKABLE = ".:@";

// Returns the character at a map position. Anything off the edge of the
// map counts as a tree, so the player can never leave the world even if
// the border has a gap in it.
export function tileAt(col, row) {
  if (row < 0 || row >= MAP_HEIGHT || col < 0 || col >= MAP_COLS) return "T";
  return MAP_ROWS[row][col];
}

export function isSolid(col, row) {
  return !WALKABLE.includes(tileAt(col, row));
}

// Finds the "@" in the map. Returns { col, row }.
export function findPlayerStart() {
  for (let row = 0; row < MAP_HEIGHT; row++) {
    const col = MAP_ROWS[row].indexOf("@");
    if (col !== -1) return { col, row };
  }
  // No "@" in the map: fall back to the top-left corner and say so.
  console.warn("map.js: no '@' start marker found in MAP_ROWS.");
  return { col: 1, row: 1 };
}

// A typo check for whoever edits the map: uneven rows are the most
// likely mistake, and they cause confusing behaviour, so report them.
// Open the browser console (F12) to see these messages.
MAP_ROWS.forEach((rowText, row) => {
  if (rowText.length !== MAP_COLS) {
    console.warn(
      `map.js: row ${row + 1} has ${rowText.length} characters, ` +
        `but row 1 has ${MAP_COLS}. All rows must be the same length.`
    );
  }
});
