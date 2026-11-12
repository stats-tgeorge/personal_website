// tiles.js
// Draws one map tile. For now every tile is a PLACEHOLDER made of
// coloured rectangles, so the game works before any real art exists.
// When real pixel art is added (a later milestone), only this file
// needs to change: the rest of the game just calls drawTile().

import { TILE } from "./config.js";

const COLORS = {
  grass: "#6aaa5a",
  grassSpeck: "#5b9a4d",
  path: "#d8c08a",
  pathSpeck: "#c9b07a",
  water: "#4f8fd0",
  waterShine: "#8fbdea",
  treeLeaves: "#2f6b3a",
  treeTrunk: "#6b4a2b",
  roof: "#523178", // the site's navbar purple
  roofLine: "#3b2257",
  wall: "#e8dcc0",
  wallLine: "#c9bc9c",
  door: "#7a4a22",
  doorKnob: "#f2d24b",
};

// ctx  = the canvas drawing context
// char = the map character for this tile (see the key in map.js)
// x, y = where the tile's top-left corner goes on the canvas
// col, row = the tile's position in the map; only used to vary the
//            speckles so the grass does not look like wallpaper
export function drawTile(ctx, char, x, y, col, row) {
  // A cheap, repeatable "random" number from the tile's position.
  // Using position (rather than Math.random) keeps speckles from
  // flickering, because each tile gets the same answer every frame.
  const variety = (col * 7 + row * 13) % 5;

  if (char === ":" || char === "@") {
    fill(ctx, COLORS.path, x, y, TILE, TILE);
    fill(ctx, COLORS.pathSpeck, x + 3 + variety * 2, y + 4 + variety, 2, 1);
    return;
  }

  if (char === "~") {
    fill(ctx, COLORS.water, x, y, TILE, TILE);
    fill(ctx, COLORS.waterShine, x + 2 + variety * 2, y + 5, 4, 1);
    return;
  }

  if (char === "^") {
    fill(ctx, COLORS.roof, x, y, TILE, TILE);
    fill(ctx, COLORS.roofLine, x, y + 7, TILE, 1);
    fill(ctx, COLORS.roofLine, x, y + 15, TILE, 1);
    return;
  }

  if (char === "#") {
    fill(ctx, COLORS.wall, x, y, TILE, TILE);
    fill(ctx, COLORS.wallLine, x, y + 15, TILE, 1);
    return;
  }

  // Doors are the digits 1-9.
  if (char >= "1" && char <= "9") {
    fill(ctx, COLORS.wall, x, y, TILE, TILE);
    fill(ctx, COLORS.door, x + 3, y + 2, 10, 14);
    fill(ctx, COLORS.doorKnob, x + 10, y + 9, 2, 2);
    return;
  }

  // Everything else sits on grass: plain grass, trees, and any
  // character we do not recognise (so a typo in the map shows as grass).
  fill(ctx, COLORS.grass, x, y, TILE, TILE);
  fill(ctx, COLORS.grassSpeck, x + 2 + variety * 2, y + 3 + variety * 2, 2, 1);

  if (char === "T") {
    fill(ctx, COLORS.treeTrunk, x + 6, y + 10, 4, 6);
    fill(ctx, COLORS.treeLeaves, x + 2, y + 2, 12, 9);
    fill(ctx, COLORS.treeLeaves, x + 4, y, 8, 2);
  }
}

// Small helper so the drawing code above reads as one line per shape.
function fill(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}
