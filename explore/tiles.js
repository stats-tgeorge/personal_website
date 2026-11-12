// tiles.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
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
  floor: "#c9a36b",
  floorLine: "#b58f58",
  mat: "#a8323a",
  nothing: "#1b1424", // the darkness beyond a room's walls
  roof: "#523178", // the site's navbar purple
  roofLine: "#3b2257",
  wall: "#e8dcc0",
  wallLine: "#c9bc9c",
  door: "#7a4a22",
  doorKnob: "#f2d24b",
};

// ctx  = the canvas drawing context
// char = the map character for this tile (see the keys in the maps/ files)
// x, y = where the tile's top-left corner goes on the canvas
// col, row = the tile's position in the map; only used to vary the
//            speckles so the grass does not look like wallpaper
export function drawTile(ctx, char, x, y, col, row) {
  // A cheap, repeatable "random" number from the tile's position.
  // Using position (rather than Math.random) keeps speckles from
  // flickering, because each tile gets the same answer every frame.
  const variety = (col * 7 + row * 13) % 5;

  // --- Indoor tiles ---
  // Empty space outside a room.
  if (char === " ") {
    fill(ctx, COLORS.nothing, x, y, TILE, TILE);
    return;
  }

  // Floor, and everything that sits on floor. The spots for things
  // (desks "o", portals "p", helpers "n", pets "d", signs "*", the
  // fairy "i", laptop desks "L" and "l") are drawn as bare floor here;
  // things.js draws whatever stands there on top.
  if ("_opnd*liLE".includes(char)) {
    fill(ctx, COLORS.floor, x, y, TILE, TILE);
    fill(ctx, COLORS.floorLine, x, y + 15, TILE, 1); // floorboard seams
    fill(ctx, COLORS.floorLine, x + (row % 2 === 0 ? 7 : 15), y, 1, TILE);

    if (char === "E") {
      fill(ctx, COLORS.mat, x + 1, y + 4, 14, 10); // exit mat
      fill(ctx, COLORS.doorKnob, x + 3, y + 6, 10, 1);
      fill(ctx, COLORS.doorKnob, x + 3, y + 11, 10, 1);
    }
    return;
  }

  // --- Outdoor tiles ---
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

  // A bookshelf: shelves of books in mixed colours.
  if (char === "B") {
    fill(ctx, "#6b4a2b", x, y, TILE, TILE);
    const books = ["#0072b2", "#d55e00", "#009e73", "#cc79a7", "#e69f00", "#56b4e9"];
    for (let shelf = 0; shelf < 2; shelf++) {
      for (let book = 0; book < 7; book++) {
        // Which colour: a pattern that differs from shelf to shelf and tile to tile.
        const color = books[(book + shelf * 2 + col) % books.length];
        fill(ctx, color, x + 1 + book * 2, y + 2 + shelf * 7, 2, 5);
      }
    }
    return;
  }

  // Walls, and walls with a statistics poster on them:
  //   h = histogram (bell-shaped)      s = scatter plot
  //   b = bar chart                    x = side-by-side box plots
  //   t = time series (a wiggly line)  q = normal curve with a shaded tail
  //   c = correlation heat map         k = two overlapping density curves
  // ("f" is a picture-frame spot: plain wall here; things.js draws a
  // frame on it when there is a photo to show.)
  if ("#hsbxtqckf".includes(char)) {
    fill(ctx, COLORS.wall, x, y, TILE, TILE);
    fill(ctx, COLORS.wallLine, x, y + 15, TILE, 1);
    if (char !== "#" && char !== "f") {
      fill(ctx, "#6b4a2b", x + 1, y + 2, 14, 12); // frame
      fill(ctx, "#ffffff", x + 2, y + 3, 12, 10); // paper
    }
    if (char === "h") {
      // Bar heights rising to a peak and falling again, like a
      // histogram of roughly normal data.
      [1, 2, 4, 7, 8, 7, 4, 2, 1].forEach((height, i) => {
        fill(ctx, "#0072b2", x + 3 + i, y + 12 - height, 1, height);
      });
    }
    if (char === "s") {
      // Points drifting upward to the right: a positive association.
      for (const [dx, dy] of [[3, 10], [4, 11], [5, 9], [7, 9], [8, 7], [9, 8], [10, 6], [11, 5], [12, 6], [12, 4]]) {
        fill(ctx, "#d55e00", x + dx, y + dy, 1, 1);
      }
    }
    if (char === "b") {
      // Four bars in four colours.
      [["#0072b2", 5], ["#e69f00", 8], ["#009e73", 3], ["#cc79a7", 6]].forEach(([color, height], i) => {
        fill(ctx, color, x + 3 + i * 3, y + 12 - height, 2, height);
      });
    }
    if (char === "x") {
      // Three box plots side by side: whisker, box, and a median line.
      [["#0072b2", 5, 4], ["#e69f00", 4, 5], ["#009e73", 6, 3]].forEach(([color, top, boxHeight], i) => {
        const bx = x + 3 + i * 4;
        fill(ctx, "#333333", bx + 1, y + 4, 1, 8); // whisker
        fill(ctx, color, bx, y + top, 3, boxHeight); // box
        fill(ctx, "#333333", bx, y + top + 2, 3, 1); // median
      });
    }
    if (char === "t") {
      // A time series: one value per column, wandering up and down.
      [8, 7, 9, 6, 7, 4, 6, 5, 3, 5, 2, 4].forEach((height, i) => {
        fill(ctx, "#0072b2", x + 2 + i, y + 3 + height, 1, 1);
      });
      fill(ctx, "#333333", x + 2, y + 12, 12, 1); // time axis
    }
    if (char === "q") {
      // A normal curve with its right tail shaded: a p-value.
      [1, 1, 2, 4, 6, 8, 8, 6, 4, 2, 1, 1].forEach((height, i) => {
        fill(ctx, i >= 9 ? "#d55e00" : "#cfd8e3", x + 2 + i, y + 12 - height, 1, height);
        fill(ctx, "#333333", x + 2 + i, y + 12 - height, 1, 1); // the curve itself
      });
    }
    if (char === "c") {
      // A correlation heat map: a 4 by 4 grid, darkest on the diagonal.
      const shades = ["#0072b2", "#56b4e9", "#a9d6f5", "#e8f3fb"];
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          fill(ctx, shades[Math.abs(i - j)], x + 3 + i * 3, y + 4 + j * 2, 2, 2);
        }
      }
    }
    if (char === "k") {
      // Two overlapping density curves, as when comparing two groups.
      [1, 2, 4, 6, 7, 6, 4, 2, 1, 0, 0, 0].forEach((height, i) => {
        if (height > 0) fill(ctx, "#0072b2", x + 2 + i, y + 12 - height, 1, 1);
      });
      [0, 0, 0, 1, 2, 3, 5, 6, 5, 3, 2, 1].forEach((height, i) => {
        if (height > 0) fill(ctx, "#d55e00", x + 2 + i, y + 12 - height, 1, 1);
      });
      fill(ctx, "#333333", x + 2, y + 12, 12, 1); // baseline
    }
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
