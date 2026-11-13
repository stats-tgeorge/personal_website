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

// Creates a player standing in the middle of the given map tile.
export function createPlayer(col, row) {
  return {
    x: col * TILE + (TILE - PLAYER_WIDTH) / 2,
    y: row * TILE + (TILE - PLAYER_HEIGHT) / 2,
    facing: "down", // "up", "down", "left" or "right"
    moving: false,
    walkTime: 0, // seconds spent walking; drives the little step bounce
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

// Draws the placeholder character: a head, a body, and a dot showing
// which way they face. Replace with real art later.
// screenX / screenY = where the footprint's top-left is on the canvas.
export function drawPlayer(ctx, player, screenX, screenY) {
  // Bounce one pixel up on every other "step" while walking.
  const bounce = player.moving && Math.floor(player.walkTime * 8) % 2 === 1 ? 1 : 0;

  // The body is drawn above the footprint so the feet line up with it.
  const bodyX = Math.round(screenX);
  const bodyY = Math.round(screenY) + PLAYER_HEIGHT - 16 - bounce;

  // Shadow on the ground (does not bounce).
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(Math.round(screenX), Math.round(screenY) + PLAYER_HEIGHT - 2, PLAYER_WIDTH, 2);

  ctx.fillStyle = "#c0392b"; // shirt
  ctx.fillRect(bodyX + 1, bodyY + 8, 8, 7);
  ctx.fillStyle = "#f1c9a5"; // head
  ctx.fillRect(bodyX + 1, bodyY, 8, 8);
  ctx.fillStyle = "#4a3222"; // hair
  ctx.fillRect(bodyX + 1, bodyY, 8, 2);

  // Eyes show the facing direction; no eyes when facing away (up).
  ctx.fillStyle = "#222222";
  if (player.facing === "down") {
    ctx.fillRect(bodyX + 3, bodyY + 4, 1, 2);
    ctx.fillRect(bodyX + 6, bodyY + 4, 1, 2);
  } else if (player.facing === "left") {
    ctx.fillRect(bodyX + 2, bodyY + 4, 1, 2);
  } else if (player.facing === "right") {
    ctx.fillRect(bodyX + 7, bodyY + 4, 1, 2);
  } else {
    ctx.fillStyle = "#4a3222"; // back of the head is all hair
    ctx.fillRect(bodyX + 1, bodyY, 8, 6);
  }
}
