// camera.js
// The map is bigger than the screen, so we only draw the part around
// the player. The "camera" is just the map position (in game pixels)
// of the top-left corner of what is visible.

import { TILE, VIEW_COLS, VIEW_ROWS, PLAYER_WIDTH, PLAYER_HEIGHT } from "./config.js";
import { MAP_COLS, MAP_HEIGHT } from "./map.js";

export function cameraFor(player) {
  const viewWidth = VIEW_COLS * TILE;
  const viewHeight = VIEW_ROWS * TILE;

  // Start by putting the player in the centre of the view...
  let x = player.x + PLAYER_WIDTH / 2 - viewWidth / 2;
  let y = player.y + PLAYER_HEIGHT / 2 - viewHeight / 2;

  // ...then stop the view at the map's edges, so we never show the
  // empty space beyond the map.
  x = clamp(x, 0, MAP_COLS * TILE - viewWidth);
  y = clamp(y, 0, MAP_HEIGHT * TILE - viewHeight);

  // Whole pixels only: half-pixel positions make pixel art look blurry.
  return { x: Math.round(x), y: Math.round(y) };
}

function clamp(value, lowest, highest) {
  return Math.max(lowest, Math.min(highest, value));
}
