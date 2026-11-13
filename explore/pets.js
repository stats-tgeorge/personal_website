// pets.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// Draws the dogs in the office: each stands against the wall just to
// the left of its own framed photo. PLACEHOLDER art made of coloured rectangles.
//
// A pet has a "breed" (chosen in rooms.js from its name):
//   "lab"    a small black lab mix
//   "corgi"  a corgi: tan and white, short legs, big upright ears
//
// Petting a dog (the "Pet" button, or Enter) makes hearts float up and
// the dog spin round. main.js is not involved: pressing the button
// just records the time in pet.pettedAt, and this file draws whatever
// should be showing at the current time.

import { TILE } from "./config.js";

// Visitors who have asked their computer to reduce motion still get a
// heart, but no spinning, floating or tail-wagging.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// How long the reaction to being petted lasts, in milliseconds.
const HAPPY_TIME = 1600;

// pet  = the thing to draw (see things.js); x, y = top-left corner of
//        its tile on the canvas
// now  = the current time in milliseconds
export function drawPet(ctx, pet, x, y, now) {
  // The pet's framed photo: on the wall, one tile up and one to the
  // right, so the pet stands just to the left of it and does not hide it.
  drawFrame(ctx, x + TILE, y - TILE);

  // How far through the "just been petted" reaction we are (0 to 1),
  // or outside that range when not reacting.
  const progress = (now - (pet.pettedAt || -Infinity)) / HAPPY_TIME;
  const happy = progress >= 0 && progress < 1;

  // Spinning round: the dog flips to face the other way several times.
  // (Math.floor(progress * 8) counts 0,1,2...7 during the reaction;
  // odd numbers face right.)
  const facingRight = happy && !reduceMotion && Math.floor(progress * 8) % 2 === 1;

  // The tail wags all the time, and faster when happy.
  const wagSpeed = happy ? 80 : 220;
  const tailUp = !reduceMotion && Math.floor(now / wagSpeed) % 2 === 0;

  // Every shape below is given as "pixels from the dog's nose end".
  // When the dog faces right, each shape is mirrored across the tile.
  const part = (color, fromLeft, top, width, height) => {
    const left = facingRight ? TILE - fromLeft - width : fromLeft;
    ctx.fillStyle = color;
    ctx.fillRect(x + left, y + top, width, height);
  };

  part("rgba(0, 0, 0, 0.25)", 2, 14, 12, 2); // shadow

  if (pet.breed === "corgi") {
    const tan = "#d9822b";
    const white = "#ffffff";
    part(tan, 4, 8, 10, 5); // long body
    part(white, 4, 11, 4, 2); // white chest
    part(tan, 1, 5, 6, 5); // head
    part(white, 1, 8, 3, 2); // white muzzle
    part(tan, 2, 2, 2, 3); // two big upright ears
    part(tan, 5, 2, 2, 3);
    part("#111111", 3, 6, 1, 1); // eye
    part("#111111", 1, 8, 1, 1); // nose
    part(white, 5, 13, 2, 2); // short legs with white socks
    part(white, 11, 13, 2, 2);
    part(tan, 14, tailUp ? 7 : 8, 1, 2); // a corgi's stub of a tail
  } else {
    // Black lab mix (also used for any breed this file does not know).
    const coat = "#1e1e1e";
    part(coat, 5, 7, 9, 4); // body
    part(coat, 2, 3, 5, 5); // head
    part(coat, 1, 6, 2, 2); // muzzle
    part("#000000", 5, 3, 2, 4); // floppy ear
    part("#f0e442", 3, 5, 1, 1); // a bright eye, so it shows on the black coat
    part("#444444", 1, 6, 1, 1); // nose
    part(coat, 6, 11, 2, 4); // longer legs
    part(coat, 11, 11, 2, 4);
    part(coat, 14, tailUp ? 4 : 6, 1, 4); // tail
  }

  if (happy) drawHearts(ctx, x, y, progress);
}

// Three little hearts drifting up from the dog, one after another.
function drawHearts(ctx, x, y, progress) {
  // 1 = a pixel of the heart. Five wide, four tall.
  const heart = ["01010", "11111", "01110", "00100"];
  const colors = ["#e63946", "#ff8fa3", "#e63946"];

  for (let i = 0; i < 3; i++) {
    // Each heart starts a little later than the one before.
    const age = progress * 1.6 - i * 0.3;
    if (age < 0 || age > 1) continue;
    // With reduced motion the hearts appear in place and do not drift.
    const rise = reduceMotion ? 0 : Math.round(age * 12);
    const heartX = x + 1 + i * 5;
    const heartY = y - 4 - rise;
    ctx.fillStyle = colors[i];
    heart.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) {
        if (row[dx] === "1") ctx.fillRect(heartX + dx, heartY + dy, 1, 1);
      }
    });
  }
}

// A picture frame on a wall tile, holding a little landscape. (The
// real photo is shown in the strip at the top when the player comes
// close.) Also used by things.js for photos without a pet.
export function drawFrame(ctx, x, y) {
  const fill = (color, dx, dy, width, height) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + dx, y + dy, width, height);
  };
  fill("#6b4a2b", 2, 2, 12, 12); // frame
  fill("#a8d5f0", 3, 3, 10, 6); // sky,
  fill("#6aaa5a", 3, 9, 10, 4); // grass,
  fill("#f0e442", 10, 4, 2, 2); // and sun
}
