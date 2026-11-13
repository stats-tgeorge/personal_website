// creator.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The "choose your character" box shown when explore mode opens. The
// visitor picks a skin tone, a hair style and colour, and a figure,
// all by picture, and may type their initials. Nothing chosen here is
// saved or sent anywhere: it lasts until the page is closed.
//
// The box is a <dialog> in explore.qmd. This file fills each row with
// picture buttons, keeps the preview up to date, and hands the result
// to main.js when the visitor presses "Start exploring".

import { drawCharacter, SKIN_TONES, HAIR_COLORS, HAIR_STYLES, FIGURES, DEFAULT_LOOK } from "./character.js";

const box = document.getElementById("creator");
const form = document.getElementById("creator-form");
const preview = document.getElementById("creator-preview");
const initialsBox = document.getElementById("creator-initials");

// The look being built. It starts as the default.
const look = { ...DEFAULT_LOOK };

// Each row of choices: which part of the look it sets, how many
// options there are, the name read out by screen readers for each
// option, and how to draw option number i on a small canvas.
const ROWS = [
  {
    holder: "creator-skin",
    part: "skin",
    names: ["Skin tone 1", "Skin tone 2", "Skin tone 3", "Skin tone 4", "Skin tone 5"],
    draw: (ctx, i) => drawCharacter(ctx, { ...look, skin: i }, 3, 4),
  },
  {
    holder: "creator-hair",
    part: "hair",
    names: HAIR_STYLES,
    draw: (ctx, i) => drawCharacter(ctx, { ...look, hair: i }, 3, 4),
  },
  {
    holder: "creator-hair-color",
    part: "hairColor",
    names: ["Black hair", "Brown hair", "Red hair", "Blond hair", "Grey hair"],
    draw: (ctx, i) => drawCharacter(ctx, { ...look, hairColor: i, hair: look.hair === 4 ? 0 : look.hair }, 3, 4),
  },
  {
    holder: "creator-figure",
    part: "figure",
    names: FIGURES,
    draw: (ctx, i) => drawCharacter(ctx, { ...look, figure: i }, 3, 4),
  },
];

// Builds the picture buttons for every row.
for (const row of ROWS) {
  const holder = document.getElementById(row.holder);
  row.buttons = row.names.map((name, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "creator-choice";
    // The name is for screen readers only; on screen there is just the picture.
    button.setAttribute("aria-label", name);
    const picture = document.createElement("canvas");
    picture.width = 16;
    picture.height = 22;
    button.append(picture);
    button.addEventListener("click", () => {
      look[row.part] = i;
      redraw();
    });
    holder.append(button);
    return button;
  });
}

// Redraws every picture, because changing one part (skin, say) changes
// how the options in the other rows look, and marks the chosen ones.
function redraw() {
  for (const row of ROWS) {
    row.buttons.forEach((button, i) => {
      const ctx = button.firstChild.getContext("2d");
      ctx.clearRect(0, 0, 16, 22);
      row.draw(ctx, i);
      // aria-pressed tells screen readers which option is chosen;
      // explore.css uses it to draw the highlight.
      button.setAttribute("aria-pressed", String(look[row.part] === i));
    });
  }
  const ctx = preview.getContext("2d");
  ctx.clearRect(0, 0, 16, 22);
  drawCharacter(ctx, look, 3, 4);
}

// Opens the box. whenDone is given the result:
//   { look, initials }
export function chooseCharacter(whenDone) {
  redraw();
  let initials = ""; // stays empty if the box is closed with the Esc key

  form.onsubmit = (event) => {
    event.preventDefault(); // a form normally reloads the page; not wanted here
    // Initials: letters and numbers only, capitals, at most three.
    initials = initialsBox.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
    box.close();
  };

  // "close" happens however the box is shut: the Start button, or the
  // Esc key (which keeps whatever has been chosen so far). Waiting for
  // it means the box is really gone before the game takes the keyboard.
  box.onclose = () => whenDone({ look: { ...look }, initials });

  box.showModal();
}

// Typing in the box must not reach the rest of the page (Quarto's
// search listens for "s" and "f").
box.addEventListener("keydown", (event) => event.stopPropagation());
box.addEventListener("keyup", (event) => event.stopPropagation());
