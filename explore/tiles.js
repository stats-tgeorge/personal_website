// tiles.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// Draws one map tile. For now every tile is a PLACEHOLDER made of
// coloured rectangles, so the game works before any real art exists.
// When real pixel art is added (a later milestone), only this file
// needs to change: the rest of the game just calls drawTile().

import { TILE } from "./config.js";
import { POSTERS, POSTER_LETTERS } from "./posters.js";

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

  // Walls, and walls with a statistics poster on them. The posters,
  // and the real data behind each, are in posters.js. ("f" is a
  // picture-frame spot: plain wall here; things.js draws a frame on it
  // when there is a photo to show.)
  if (char === "#" || char === "f" || POSTER_LETTERS.includes(char)) {
    fill(ctx, COLORS.wall, x, y, TILE, TILE);
    fill(ctx, COLORS.wallLine, x, y + 15, TILE, 1);
    if (POSTER_LETTERS.includes(char)) drawPoster(ctx, POSTERS[char], x, y);
    return;
  }

  // The mini-game field outdoors: fence and arcade cabinet, on grass.
  if (char === "F" || char === "G") {
    fill(ctx, COLORS.grass, x, y, TILE, TILE);
    if (char === "F") {
      fill(ctx, "#8a5a2b", x + 2, y + 3, 2, 12); // two posts
      fill(ctx, "#8a5a2b", x + 12, y + 3, 2, 12);
      fill(ctx, "#a8733d", x, y + 5, TILE, 2); // two rails
      fill(ctx, "#a8733d", x, y + 10, TILE, 2);
    } else {
      fill(ctx, "#3b2257", x + 3, y + 1, 10, 14); // arcade cabinet
      fill(ctx, "#56b4e9", x + 5, y + 3, 6, 5); // its screen
      fill(ctx, "#f0e442", x + 6, y + 10, 2, 2); // buttons
      fill(ctx, "#d55e00", x + 9, y + 10, 2, 2);
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

// Draws one poster (see posters.js) in a frame on a wall tile.
// The paper is 12 pixels wide and 10 tall; "left" and "bottom" below
// are its bottom-left corner, and every height is measured up from there.
function drawPoster(ctx, poster, x, y) {
  fill(ctx, "#6b4a2b", x + 1, y + 2, 14, 12); // frame
  fill(ctx, "#ffffff", x + 2, y + 3, 12, 10); // paper
  const left = x + 2;
  const bottom = y + 13;

  if (poster.type === "histogram") {
    // One column per bin.
    poster.heights.forEach((height, i) => fill(ctx, poster.color, left + i, bottom - height, 1, height));
  }

  if (poster.type === "scatter") {
    for (const [across, up] of poster.points) fill(ctx, poster.color, left + across, bottom - 1 - up, 1, 1);
  }

  if (poster.type === "bars") {
    // Four bars, two pixels wide, with a pixel between.
    poster.heights.forEach((height, i) => fill(ctx, poster.colors[i], left + 1 + i * 3, bottom - height, 2, height));
  }

  if (poster.type === "boxes") {
    poster.boxes.forEach(([minimum, lowerQuartile, median, upperQuartile, maximum], i) => {
      const boxLeft = left + i * 4;
      fill(ctx, "#333333", boxLeft + 1, bottom - 1 - maximum, 1, maximum - minimum + 1); // whisker
      fill(ctx, poster.colors[i], boxLeft, bottom - 1 - upperQuartile, 3, upperQuartile - lowerQuartile + 1); // box
      fill(ctx, "#333333", boxLeft, bottom - 1 - median, 3, 1); // median line
    });
  }

  if (poster.type === "line") {
    // One point per year, with a time axis along the bottom.
    fill(ctx, "#333333", left, bottom - 1, 12, 1);
    poster.heights.forEach((height, i) => fill(ctx, poster.color, left + i, bottom - 2 - height, 1, 2));
  }

  if (poster.type === "heatmap") {
    // A 4 by 4 grid. Blue for positive, orange for negative; the
    // stronger the correlation, the less see-through the square.
    poster.correlations.forEach((row, i) => {
      row.forEach((correlation, j) => {
        ctx.globalAlpha = Math.max(0.15, Math.abs(correlation));
        fill(ctx, correlation >= 0 ? "#0072b2" : "#d55e00", left + j * 3, y + 4 + i * 2, 3, 2);
        ctx.globalAlpha = 1; // back to normal for everything drawn after
      });
    });
  }

  if (poster.type === "curves") {
    // Two outlines sharing a baseline.
    fill(ctx, "#333333", left, bottom - 1, 12, 1);
    poster.curves.forEach((curve, which) => {
      curve.forEach((height, i) => {
        if (height > 0) fill(ctx, poster.colors[which], left + i, bottom - 1 - height, 1, 1);
      });
    });
  }
}

// Small helper so the drawing code above reads as one line per shape.
function fill(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}
