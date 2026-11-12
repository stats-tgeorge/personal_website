// camera.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The outdoor map is bigger than the screen, so we only draw the part
// around the player. The "camera" is just the map position (in game
// pixels) of the top-left corner of what is visible.

import { TILE, VIEW_COLS, VIEW_ROWS, PLAYER_WIDTH, PLAYER_HEIGHT } from "./config.js";
import { mapCols, mapRows } from "./map.js";

export function cameraFor(player) {
  const viewWidth = VIEW_COLS * TILE;
  const viewHeight = VIEW_ROWS * TILE;

  // Start by putting the player in the centre of the view...
  let x = player.x + PLAYER_WIDTH / 2 - viewWidth / 2;
  let y = player.y + PLAYER_HEIGHT / 2 - viewHeight / 2;

  // ...then stop the view at the map's edges, so we never show the
  // empty space beyond the map.
  x = keepInside(x, mapCols() * TILE, viewWidth);
  y = keepInside(y, mapRows() * TILE, viewHeight);

  // Whole pixels only: half-pixel positions make pixel art look blurry.
  return { x: Math.round(x), y: Math.round(y) };
}

// Keeps the camera within a map that is mapSize pixels long, when the
// screen shows viewSize pixels of it. A map smaller than the screen
// (a small room) is centred instead.
function keepInside(position, mapSize, viewSize) {
  if (mapSize <= viewSize) return (mapSize - viewSize) / 2;
  return Math.max(0, Math.min(mapSize - viewSize, position));
}
