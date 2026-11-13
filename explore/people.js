// people.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// Draws the helpers in the Student Support Center, and whatever each
// one stands next to. PLACEHOLDER art made of coloured rectangles.
//
// Each helper has a "look" (chosen in rooms.js from the heading on the
// Student Support page):
//   "plain"     an ordinary person
//   "lecturer"  holds a laptop; a whiteboard on wheels stands to their right
//   "nurse"     red and white, with a plus sign; a first-aid cabinet to their right
//   "tech"      headphones and a laptop; a server stands behind them
//   "tutors"    two people, "S" (stats) and "W" (writing) on their shirts,
//               who jump and high-five when the player comes up to them

import { TILE } from "./config.js";

// Visitors who have asked their computer to reduce motion do not get
// the jumping animation.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// How long the tutors' high-five lasts, in milliseconds.
const HIGH_FIVE_TIME = 600;

// person = the thing to draw (see things.js); x, y = top-left corner of
//          its tile on the canvas
// now    = the current time in milliseconds (for animation)
export function drawPerson(ctx, person, x, y, now) {
  if (person.look === "tutors") {
    drawTutors(ctx, person, x, y, now);
    return;
  }

  if (person.look === "nurse") {
    drawFigure(ctx, x, y, { shirt: "#ffffff", hair: "#d62828" }); // red cap
    fill(ctx, "#d62828", x + 7, y + 9, 2, 5); // plus sign on the shirt:
    fill(ctx, "#d62828", x + 5, y + 11, 6, 2); // upright, then crossbar
    // First-aid cabinet to the right.
    fill(ctx, "#ffffff", x + TILE + 2, y + 2, 12, 13);
    fill(ctx, "#999999", x + TILE + 2, y + 14, 12, 1);
    fill(ctx, "#d62828", x + TILE + 7, y + 5, 2, 7);
    fill(ctx, "#d62828", x + TILE + 4, y + 8, 8, 2);
    return;
  }

  if (person.look === "lecturer") {
    drawFigure(ctx, x, y, { shirt: "#0072b2" });
    drawLaptopInHands(ctx, x, y);
    // Whiteboard on wheels to the right, showing a scatter plot with a
    // trend line through it.
    const bx = x + TILE;
    fill(ctx, "#888888", bx + 1, y + 1, 14, 11); // frame
    fill(ctx, "#ffffff", bx + 2, y + 2, 12, 9); // board
    for (const [dx, dy] of [[3, 8], [5, 7], [6, 8], [8, 5], [10, 5], [11, 3], [12, 4]]) {
      fill(ctx, "#0072b2", bx + dx, y + dy, 1, 1); // the points
    }
    for (let i = 0; i < 10; i++) {
      fill(ctx, "#d55e00", bx + 3 + i, y + 9 - Math.round(i * 0.6), 1, 1); // the line
    }
    fill(ctx, "#888888", bx + 3, y + 12, 1, 2); // legs
    fill(ctx, "#888888", bx + 12, y + 12, 1, 2);
    fill(ctx, "#222222", bx + 2, y + 14, 3, 2); // wheels
    fill(ctx, "#222222", bx + 11, y + 14, 3, 2);
    return;
  }

  if (person.look === "tech") {
    // The server stands on the tile behind (above) them, so draw it first.
    const sy = y - TILE;
    fill(ctx, "#2b2b2b", x + 2, sy + 1, 12, 15);
    for (let shelf = 0; shelf < 4; shelf++) {
      fill(ctx, "#555555", x + 3, sy + 2 + shelf * 3.5, 10, 2);
      fill(ctx, shelf % 2 === 0 ? "#3ddc84" : "#f0e442", x + 11, sy + 2 + shelf * 3.5, 1, 1); // lights
    }
    drawFigure(ctx, x, y, { shirt: "#e69f00" });
    fill(ctx, "#222222", x + 4, y, 8, 1); // headphone band
    fill(ctx, "#222222", x + 3, y + 3, 2, 3); // ear cups
    fill(ctx, "#222222", x + 11, y + 3, 2, 3);
    drawLaptopInHands(ctx, x, y);
    return;
  }

  // "plain", and any look this file does not know.
  drawFigure(ctx, x, y, { shirt: person.shirt || "#d55e00" });
}

// The two tutors stand on this tile and the one to its right.
function drawTutors(ctx, person, x, y, now) {
  // How far through the high-five we are: 0 at the start, 1 at the end.
  // person.reachedAt is set by main.js when the player comes up to them.
  const progress = (now - (person.reachedAt || -Infinity)) / HIGH_FIVE_TIME;
  const celebrating = !reduceMotion && progress >= 0 && progress < 1;

  // A jump is a smooth up-and-down: Math.sin goes 0 -> 1 -> 0 as
  // progress goes 0 -> 1. The jump is 5 pixels high at its top.
  const jump = celebrating ? Math.round(Math.sin(progress * Math.PI) * 5) : 0;

  const leftX = x + 3; // stand a little closer together than the tile centres
  const rightX = x + TILE - 3;

  drawFigure(ctx, leftX, y - jump, { shirt: "#0072b2", shadowY: y });
  drawFigure(ctx, rightX, y - jump, { shirt: "#d55e00", shadowY: y });

  // "S" for stats and "W" for writing, as tiny dot patterns
  // (1 = a white pixel). There is no room for whole words at this size.
  drawPattern(ctx, leftX + 6, y + 9 - jump, ["111", "100", "111", "001", "111"]);
  drawPattern(ctx, rightX + 5, y + 9 - jump, ["10001", "10001", "10101", "10101", "01010"]);

  if (celebrating) {
    // Raised arms meeting in the middle, and a little star where the
    // hands clap at the top of the jump.
    const handY = y + 4 - jump;
    fill(ctx, "#f1c9a5", leftX + 12, handY, 3, 2);
    fill(ctx, "#f1c9a5", rightX + 1, handY, 3, 2);
    if (progress > 0.35 && progress < 0.65) {
      fill(ctx, "#f0e442", x + TILE - 1, handY - 3, 2, 8);
      fill(ctx, "#f0e442", x + TILE - 4, handY, 8, 2);
    }
  }
}

// The basic person: shadow, shirt, head, hair, eyes. Facing the room.
// options.shirt   shirt colour
// options.hair    hair (or cap) colour
// options.shadowY where the ground is, if the person is in the air
function drawFigure(ctx, x, y, options) {
  const groundY = options.shadowY === undefined ? y : options.shadowY;
  fill(ctx, "rgba(0, 0, 0, 0.25)", x + 3, groundY + 14, 10, 2); // shadow
  fill(ctx, options.shirt, x + 4, y + 8, 8, 7); // shirt
  fill(ctx, "#f1c9a5", x + 4, y, 8, 8); // head
  fill(ctx, options.hair || "#2b2b2b", x + 4, y, 8, 2); // hair
  fill(ctx, "#222222", x + 6, y + 4, 1, 2); // eyes
  fill(ctx, "#222222", x + 9, y + 4, 1, 2);
}

// A small open laptop held in front of the body.
function drawLaptopInHands(ctx, x, y) {
  fill(ctx, "#444444", x + 5, y + 9, 6, 4); // screen back
  fill(ctx, "#56b4e9", x + 6, y + 10, 4, 2); // glow
  fill(ctx, "#999999", x + 4, y + 13, 8, 1); // base
}

// Draws a small picture from rows of "1" and "0": each "1" is one
// white pixel. Used for the letters on the tutors' shirts.
function drawPattern(ctx, x, y, rows) {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      if (row[dx] === "1") fill(ctx, "#ffffff", x + dx, y + dy, 1, 1);
    }
  });
}

// Small helper so the drawing code above reads as one line per shape.
function fill(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}
