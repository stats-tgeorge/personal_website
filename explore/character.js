// character.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// Draws a person: the player, and the helpers in the rooms. One
// drawing routine is used for everybody so that people in the game
// can differ in skin tone, hair and how they get about, and so that
// the visitor can choose a character who looks like them.
// PLACEHOLDER art made of coloured rectangles.
//
// A "look" is a plain object:
//   skin       0 to 4: which of SKIN_TONES
//   hair       0 to 4: which hair style (see HAIR_STYLES)
//   hairColor  0 to 4: which of HAIR_COLORS
//   figure     0 to 4: which of FIGURES (how the person gets about)
//   shirt      a colour, e.g. "#c0392b"

export const SKIN_TONES = ["#f6d7c3", "#e8b98f", "#c68e5f", "#8d5a3b", "#4f3222"];
export const HAIR_COLORS = ["#1c1c1c", "#5a3a1e", "#a8431f", "#d9b45a", "#9a9a9a"];

// The names here are for screen readers and for this code. They are
// never shown on screen: the visitor chooses by picture.
export const HAIR_STYLES = ["Short hair", "Long hair", "Curly hair", "Hair in a bun", "Shaved head"];
export const FIGURES = ["Standing", "Wheelchair", "Crutches", "One arm", "White cane"];

// The look used until the visitor chooses, and if they skip choosing.
export const DEFAULT_LOOK = { skin: 1, hair: 0, hairColor: 1, figure: 0, shirt: "#c0392b" };

// Draws a person inside a box 10 pixels wide and 16 tall whose
// top-left corner is at (x, y).
//   facing  "down" (towards the screen), "up", "left" or "right"
//   step    0 normally, 1 on the "up" beat of a walking bounce
export function drawCharacter(ctx, look, x, y, facing = "down", step = 0) {
  const fill = (color, dx, dy, width, height) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x + dx), Math.round(y + dy), width, height);
  };

  const skin = SKIN_TONES[look.skin];
  const hair = HAIR_COLORS[look.hairColor];
  const seated = look.figure === 1; // in a wheelchair
  // A walking bounce lifts the body one pixel. A wheelchair rolls, so
  // it does not bounce.
  const lift = seated ? 0 : -step;

  // Shadow on the ground.
  fill("rgba(0, 0, 0, 0.25)", 0, 14, 10, 2);

  // ---- Behind the body: wheelchair back and wheels ----
  if (seated) {
    fill("#444444", 1, 6, 8, 6); // chair back
    fill("#222222", -1, 8, 2, 8); // left wheel
    fill("#222222", 9, 8, 2, 8); // right wheel
    fill("#bbbbbb", -1, 11, 2, 2); // wheel hubs
    fill("#bbbbbb", 9, 11, 2, 2);
  }

  // ---- Legs ----
  if (seated) {
    fill("#2f3b52", 2, 12, 6, 2); // lap
    fill("#2f3b52", 2, 14, 2, 2); // lower legs on the footrest
    fill("#2f3b52", 6, 14, 2, 2);
  } else {
    fill("#2f3b52", 2, 13 + lift, 2, 3 - lift);
    fill("#2f3b52", 6, 13 + lift, 2, 3 - lift);
  }

  // ---- Body and arms ----
  fill(look.shirt, 1, 8 + lift, 8, seated ? 4 : 5); // shirt
  const leftArm = look.figure !== 3; // figure 3 has one arm (the right)
  if (leftArm) {
    fill(look.shirt, 0, 8 + lift, 1, 3); // sleeve
    fill(skin, 0, 11 + lift, 1, 1); // hand
  } else {
    fill(look.shirt, 0, 8 + lift, 1, 2); // a short, empty sleeve
  }
  fill(look.shirt, 9, 8 + lift, 1, 3);
  fill(skin, 9, 11 + lift, 1, 1);

  // ---- Head ----
  fill(skin, 1, lift, 8, 8);

  // ---- Hair ----
  const fromBehind = facing === "up";
  if (look.hair === 0) {
    fill(hair, 1, lift, 8, 2); // short
  } else if (look.hair === 1) {
    fill(hair, 1, lift, 8, 2); // long: top, and down both sides past the shoulders
    fill(hair, 0, lift + 1, 1, 9);
    fill(hair, 9, lift + 1, 1, 9);
  } else if (look.hair === 2) {
    fill(hair, 0, lift - 2, 10, 4); // curly: a rounded cloud above and around the head
    fill(hair, 1, lift - 3, 8, 1);
    fill(hair, 0, lift + 2, 1, 2);
    fill(hair, 9, lift + 2, 1, 2);
  } else if (look.hair === 3) {
    fill(hair, 1, lift, 8, 2); // a bun on top
    fill(hair, 3, lift - 2, 4, 2);
  }
  // (style 4 is a shaved head: no hair to draw)

  if (fromBehind) {
    // The back of the head: hair covers it, except on a shaved head.
    if (look.hair !== 4) fill(hair, 1, lift, 8, look.hair === 1 ? 9 : 6);
  } else {
    // Eyes. Light eyes on the darkest skin tones so they can be seen.
    const eyes = look.skin >= 3 ? "#f5f5f5" : "#222222";
    if (facing === "down") {
      fill(eyes, 3, lift + 4, 1, 2);
      fill(eyes, 6, lift + 4, 1, 2);
    } else if (facing === "left") {
      fill(eyes, 2, lift + 4, 1, 2);
    } else {
      fill(eyes, 7, lift + 4, 1, 2);
    }
  }

  // ---- In front of the body: crutches or cane ----
  if (look.figure === 2) {
    // Two forearm crutches, one each side.
    fill("#9aa3ab", -1, 9 + lift, 1, 7 - lift);
    fill("#9aa3ab", 10, 9 + lift, 1, 7 - lift);
    fill("#5c646b", -1, 9 + lift, 2, 1); // cuffs
    fill("#5c646b", 9, 9 + lift, 2, 1);
  }
  if (look.figure === 4) {
    // A long white cane held out in front, with a red tip.
    fill("#ffffff", 10, 11 + lift, 1, 2);
    fill("#ffffff", 11, 13 + lift, 1, 2);
    fill("#d62828", 12, 15, 1, 1);
  }
}
