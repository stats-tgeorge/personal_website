// minigame/draw.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// Draws Sheet Breaker onto the outdoor map: the spreadsheet, its cells,
// the paddle and the ball. PLACEHOLDER art, like the rest of the game.
// When nobody is playing, the same drawing serves as the still display.

import { game, goalIcon, SHEET_WIDTH, VIEW_HEIGHT, HEADER_HEIGHT, CELL_WIDTH, CELL_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT } from "./game.js";

// Tiny letters A to L for the column headers, 3 pixels wide and 5
// tall. Each row of a letter is three characters: 1 = a dark pixel.
const LETTERS = {
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "010"],
  K: ["101", "110", "100", "110", "101"],
  L: ["100", "100", "100", "100", "111"],
};

// Tiny digits for the row numbers, in the same 3 by 5 style.
const DIGITS = [
  ["111", "101", "101", "101", "111"],
  ["010", "110", "010", "010", "111"],
  ["111", "001", "111", "100", "111"],
  ["111", "001", "111", "001", "111"],
  ["101", "101", "111", "001", "001"],
  ["111", "100", "111", "001", "111"],
  ["111", "100", "111", "101", "111"],
  ["111", "001", "010", "010", "010"],
  ["111", "101", "111", "101", "111"],
  ["111", "101", "111", "001", "111"],
];

// How wide the edges around the sheet are: one map tile.
const EDGE = 16;

// The pictures that can appear on the gold goal cell, one per kind of
// goal (levels.js says which level uses which). 1 = a white pixel.
const GOAL_ICONS = {
  page: ["11110", "10011", "11111", "10001", "11111"], // a sheet of paper with a folded corner
  envelope: ["11111", "11011", "10101", "10001", "11111"],
  bug: ["10101", "01110", "11111", "01110", "10101"],
  people: ["01010", "01010", "00000", "11011", "11011"], // two heads, two bodies
  grade: ["01000", "10101", "11111", "10101", "10000"], // an "A+"
  clock: ["01110", "10101", "10111", "10001", "01110"],
  coin: ["01110", "10101", "10111", "11101", "01110"],
};

// left, top = where the sheet's top-left corner is on the canvas.
export function drawGame(ctx, left, top) {
  // Small helper: a rectangle measured from the sheet's corner.
  const fill = (color, x, y, width, height) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(left + x), Math.round(top + y), width, height);
  };
  // Draws a little picture from rows of "1" and "0".
  const pattern = (color, x, y, rows) => {
    rows.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) if (row[dx] === "1") fill(color, x + dx, y + dy, 1, 1);
    });
  };

  // On a tall level the sheet scrolls. Everything that scrolls (cells,
  // row numbers, holes, paddle, ball) is drawn "scroll" pixels higher
  // than its place on the sheet. The column letters do not scroll.
  const scroll = Math.round(game.scroll);

  // ---- The edges that never move: what surrounds a real spreadsheet ----
  // Above the sheet, two bars, each one map tile tall. First the menu
  // bar: the program's green, with the game's name at its left end
  // (a name tag; see places.js) followed by smudges where "File",
  // "Edit" and the rest would be (deliberately unreadable).
  fill("#1d6f42", -EDGE, -2 * EDGE, SHEET_WIDTH + 2 * EDGE, EDGE);
  [14, 12, 16, 20, 14].reduce((x, width) => {
    fill("rgba(255, 255, 255, 0.35)", x, -2 * EDGE + 6, width, 4);
    return x + width + 6; // the next smudge starts after a gap
  }, 46);

  // Then the formula bar: the game's messages are written in it by
  // another name tag. Here, just the bar and its "fx" mark.
  fill("#eef1f3", -EDGE, -EDGE, SHEET_WIDTH + 2 * EDGE, EDGE);
  fill("#ffffff", 0, -EDGE + 2, SHEET_WIDTH, EDGE - 4);
  pattern("#777777", -11, -EDGE + 5, ["0110000", "1000101", "1100010", "1000101", "1000000"]); // "fx"

  // ---- The part that scrolls -------------------------------------------
  // "Clipping" tells the canvas to draw only inside a rectangle: here,
  // the sheet below its header plus the two side edges. Anything that
  // has scrolled out of that rectangle is simply not drawn.
  ctx.save();
  ctx.beginPath();
  ctx.rect(Math.round(left - EDGE), Math.round(top + HEADER_HEIGHT), SHEET_WIDTH + 2 * EDGE, VIEW_HEIGHT - HEADER_HEIGHT);
  ctx.clip();

  // The sheet: white paper with pale grid lines.
  fill("#ffffff", 0, HEADER_HEIGHT, SHEET_WIDTH, VIEW_HEIGHT - HEADER_HEIGHT);
  for (let x = 0; x <= SHEET_WIDTH; x += CELL_WIDTH) fill("#e3e7ea", x, HEADER_HEIGHT, 1, VIEW_HEIGHT - HEADER_HEIGHT);

  // Row numbers down the left and a scroll bar down the right.
  fill("#d5dadd", -EDGE, HEADER_HEIGHT, EDGE, VIEW_HEIGHT - HEADER_HEIGHT);
  fill("#eef1f3", SHEET_WIDTH, HEADER_HEIGHT, EDGE, VIEW_HEIGHT - HEADER_HEIGHT);
  for (let row = 1; HEADER_HEIGHT + (row - 1) * CELL_HEIGHT < game.height; row++) {
    const y = HEADER_HEIGHT + (row - 1) * CELL_HEIGHT - scroll;
    if (y < 0 || y > VIEW_HEIGHT) continue; // not on screen at the moment
    fill("#e3e7ea", 0, y, SHEET_WIDTH, 1); // the grid line across the sheet
    fill("#b8bfc4", -EDGE, y, EDGE, 1);
    // One or two digits, ending 3 pixels from the gutter's right edge.
    const digits = String(row);
    [...digits].forEach((digit, i) => {
      pattern("#555555", -3 - (digits.length - i) * 4, y + 2, DIGITS[Number(digit)]);
    });
  }
  // The scroll bar's handle shows how far down the sheet the view is.
  const track = VIEW_HEIGHT - HEADER_HEIGHT - 4;
  const handle = Math.max(16, Math.round((VIEW_HEIGHT / game.height) * track));
  const travel = game.height > VIEW_HEIGHT ? scroll / (game.height - VIEW_HEIGHT) : 0;
  fill("#c3c9ce", SHEET_WIDTH + 5, HEADER_HEIGHT + 2 + Math.round(travel * (track - handle)), 6, handle);

  // Holes in the side edges: stretches that are missing, so the ball
  // can leave through them. Shown dark, with a red line where the gap
  // opens onto the sheet.
  for (const [wall, from, to] of game.holes) {
    if (wall === "left") {
      fill("#1b1424", -EDGE, from - scroll, EDGE, to - from);
      fill("#d62828", -2, from - scroll, 2, to - from);
    }
    if (wall === "right") {
      fill("#1b1424", SHEET_WIDTH, from - scroll, EDGE, to - from);
      fill("#d62828", SHEET_WIDTH, from - scroll, 2, to - from);
    }
  }

  // The cells.
  game.cells.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) drawCell(fill, pattern, cell, c * CELL_WIDTH, HEADER_HEIGHT + r * CELL_HEIGHT - scroll);
    });
  });

  // The paddle, drawn as a scroll bar.
  const paddleLeft = game.paddleX - PADDLE_WIDTH / 2;
  fill("#8a9299", paddleLeft, game.paddleY - scroll, PADDLE_WIDTH, PADDLE_HEIGHT);
  fill("#5c646b", paddleLeft + 4, game.paddleY - scroll + 1, PADDLE_WIDTH - 8, PADDLE_HEIGHT - 2);

  // The ball: a data point. A square with its corners knocked off
  // reads as a circle at this size.
  const ball = game.ball;
  const size = ball.size;
  fill("#d55e00", ball.x - size, ball.y - scroll - size + 1, size * 2, size * 2 - 2);
  fill("#d55e00", ball.x - size + 1, ball.y - scroll - size, size * 2 - 2, size * 2);

  ctx.restore(); // stop clipping

  // ---- The header: column letters, frozen at the top --------------------
  // Drawn last so that it covers anything scrolling up underneath it.
  fill("#d5dadd", -EDGE, 0, SHEET_WIDTH + 2 * EDGE, HEADER_HEIGHT);
  Object.keys(LETTERS).forEach((letter, column) => {
    pattern("#555555", column * CELL_WIDTH + 6, 1, LETTERS[letter]);
    fill("#b8bfc4", column * CELL_WIDTH, 0, 1, HEADER_HEIGHT);
  });
  // A hole in the top edge is a missing stretch of the header. It only
  // matters (and only shows) when the view is at the top of the sheet.
  if (scroll === 0) {
    for (const [wall, from, to] of game.holes) {
      if (wall !== "top") continue;
      fill("#1b1424", from, 0, to - from, HEADER_HEIGHT);
      fill("#d62828", from, HEADER_HEIGHT - 2, to - from, 2);
    }
  }
}

// One cell, with its top-left corner at (x, y) on the sheet.
function drawCell(fill, pattern, cell, x, y) {
  const w = CELL_WIDTH;
  const h = CELL_HEIGHT;

  if (cell.kind === "#") {
    // A #REF! error cell.
    fill("#f4c7c3", x, y, w, h);
    fill("#b3261e", x, y, w, 1);
    fill("#b3261e", x, y + h - 1, w, 1);
    pattern("#b3261e", x + 6, y + 2, ["0101", "1111", "0101", "1111", "0101"]); // a "#"
    return;
  }

  if (cell.kind === "G") {
    // The goal: gold, with a star. It darkens as it is hit.
    fill(["#b8860b", "#daa520", "#ffd700"][cell.hits - 1], x, y, w, h);
    fill("#7a5c00", x, y, w, 1);
    fill("#7a5c00", x, y + h - 1, w, 1);
    fill("#7a5c00", x, y, 1, h);
    fill("#7a5c00", x + w - 1, y, 1, h);
    // Its picture shows what this level's goal is (see levels.js).
    pattern("#ffffff", x + 5, y + 1, GOAL_ICONS[goalIcon()] || GOAL_ICONS.page);
    return;
  }

  if (cell.kind === "m") {
    // A merged cell: green fill and a heavy border. Paler once cracked.
    fill(cell.hits === 2 ? "#8fd19e" : "#cdebd3", x, y, w, h);
    fill("#2e7d32", x, y, w, 1);
    fill("#2e7d32", x, y + h - 1, w, 1);
    fill("#2e7d32", x, y, 1, h);
    fill("#2e7d32", x + w - 1, y, 1, h);
    if (cell.hits === 1) pattern("#2e7d32", x + 6, y + 1, ["001", "010", "011", "010", "100"]); // a crack
    return;
  }

  // An ordinary cell: pale blue with a border.
  fill("#dbeafe", x, y, w, h);
  fill("#7aa5d8", x, y, w, 1);
  fill("#7aa5d8", x, y + h - 1, w, 1);
  fill("#7aa5d8", x, y, 1, h);
  fill("#7aa5d8", x + w - 1, y, 1, h);

  if (cell.kind === "c") {
    fill("#5b7fa8", x + 8, y + 3, 5, 1); // a number, right-aligned as numbers are
    fill("#5b7fa8", x + 10, y + 5, 3, 1);
  } else if (cell.kind === "e") {
    pattern("#333333", x + 4, y + 1, ["11111111", "11000011", "10100101", "10011001", "10000001", "11111111"]); // envelope
  } else if (cell.kind === "r") {
    pattern("#e69f00", x + 5, y + 1, ["00100", "01110", "11111", "01110", "01010"]); // star
  } else if (cell.kind === "k") {
    pattern("#6b4a2b", x + 5, y + 1, ["111110", "111111", "111101", "111110", "011100"]); // mug
  } else if (cell.kind === "q") {
    pattern("#cc0066", x + 6, y + 1, ["0110", "1001", "0010", "0100", "0000", "0100"]); // question mark
  }
}
