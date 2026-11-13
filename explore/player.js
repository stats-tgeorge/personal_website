// player.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The player character: where they are, how they move, how they are drawn.
//
// The player's position (x, y) is the top-left corner of their
// "footprint", a small rectangle around their feet. Collisions use the
// footprint only, so the player's head can overlap the wall behind
// them, which is what gives a top-down game its sense of depth.

import { TILE, PLAYER_SPEED, PLAYER_WIDTH, PLAYER_HEIGHT } from "./config.js";
import { isSolid } from "./map.js";
import { drawCharacter, DEFAULT_LOOK } from "./character.js";

// Creates a player standing in the middle of the given map tile.
export function createPlayer(col, row) {
  return {
    x: col * TILE + (TILE - PLAYER_WIDTH) / 2,
    y: row * TILE + (TILE - PLAYER_HEIGHT) / 2,
    facing: "down", // "up", "down", "left" or "right"
    moving: false,
    walkTime: 0, // seconds spent walking; drives the little step bounce
    look: { ...DEFAULT_LOOK }, // replaced by the visitor's choices (creator.js)
    initials: "", // shown on a tag above the player, if they gave any
  };
}

// Puts the player in the middle of a map tile, facing a direction.
// Used when going through a door into a room.
export function movePlayerToTile(player, col, row, facing) {
  player.x = col * TILE + (TILE - PLAYER_WIDTH) / 2;
  player.y = row * TILE + (TILE - PLAYER_HEIGHT) / 2;
  player.facing = facing;
}

// Moves the player for one frame.
// input   = from input.js
// seconds = time since the last frame (so speed is the same on fast
//           and slow screens)
export function updatePlayer(player, input, seconds) {
  let stepX = input.horizontal();
  let stepY = input.vertical();

  player.moving = stepX !== 0 || stepY !== 0;
  if (!player.moving) {
    player.walkTime = 0;
    return;
  }

  // Remember which way the player faces (used for drawing).
  if (stepX !== 0) player.facing = stepX > 0 ? "right" : "left";
  if (stepY !== 0) player.facing = stepY > 0 ? "down" : "up";

  // Walking diagonally would otherwise be about 41% faster than walking
  // straight (Pythagoras: sqrt(1 + 1)). Scale both steps down to match.
  if (stepX !== 0 && stepY !== 0) {
    stepX *= Math.SQRT1_2;
    stepY *= Math.SQRT1_2;
  }

  const distance = PLAYER_SPEED * seconds;

  // Try the sideways move and the up/down move SEPARATELY. If we tried
  // both at once, walking diagonally into a wall would stop the player
  // dead; this way they slide along the wall instead.
  const newX = player.x + stepX * distance;
  if (!footprintHitsSomething(newX, player.y)) player.x = newX;

  const newY = player.y + stepY * distance;
  if (!footprintHitsSomething(player.x, newY)) player.y = newY;

  player.walkTime += seconds;
}

// Would the footprint overlap a solid tile if its top-left were at (x, y)?
// The footprint is smaller than a tile, so checking its four corners is
// enough: it can never straddle a whole tile.
function footprintHitsSomething(x, y) {
  const left = Math.floor(x / TILE);
  const right = Math.floor((x + PLAYER_WIDTH - 1) / TILE);
  const top = Math.floor(y / TILE);
  const bottom = Math.floor((y + PLAYER_HEIGHT - 1) / TILE);
  return (
    isSolid(left, top) ||
    isSolid(right, top) ||
    isSolid(left, bottom) ||
    isSolid(right, bottom)
  );
}

// Draws the player.
// screenX / screenY = where the footprint's top-left is on the canvas.
export function drawPlayer(ctx, player, screenX, screenY) {
  // Bounce one pixel up on every other "step" while walking.
  const step = player.moving && Math.floor(player.walkTime * 8) % 2 === 1 ? 1 : 0;

  // The body is drawn above the footprint so the feet line up with it.
  // What the player looks like (player.look) was chosen by the visitor;
  // character.js does the drawing.
  drawCharacter(ctx, player.look, screenX, screenY + PLAYER_HEIGHT - 16, player.facing, step);
}
