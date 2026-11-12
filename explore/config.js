// config.js
// All the "knobs" for explore mode live here, so you can tune the feel
// of the game without reading the rest of the code.

// Size of one map square, in game pixels. The placeholder art and the
// collision code both assume square tiles of this size.
export const TILE = 16;

// How much of the map is visible at once, in tiles. The canvas is
// VIEW_COLS * TILE wide and VIEW_ROWS * TILE tall (320 x 224), and the
// browser then stretches it to fit the page (see explore.css).
// If you change these, also change width/height on the <canvas> in explore.qmd.
export const VIEW_COLS = 20;
export const VIEW_ROWS = 14;

// Walking speed in game pixels per second (16 pixels = one tile).
export const PLAYER_SPEED = 72;

// The player's "footprint" used for collisions, in game pixels. It is
// smaller than a tile so the player can slip through one-tile gaps
// without having to line up perfectly.
export const PLAYER_WIDTH = 10;
export const PLAYER_HEIGHT = 8;
