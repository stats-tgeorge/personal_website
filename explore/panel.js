// panel.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The description shown when the player can reach a thing (a door, a
// desk, a portal...): its name, its text, sometimes a picture, and its
// link. It always appears in the same place: the strip between the top
// bar and the map.
//
// It is ordinary HTML (it lives in explore.qmd and is styled in
// explore.css), not something drawn on the canvas. That means the link
// is a real link: it can be clicked, tapped, and read by screen readers.

import { openReader } from "./reader.js";

const panel = document.getElementById("place-panel");
const title = document.getElementById("place-title");
const description = document.getElementById("place-description");
const image = document.getElementById("place-image");
const link = document.getElementById("place-link");
const enterButton = document.getElementById("place-enter");
const idleNote = document.getElementById("talk-idle");

// The thing currently shown, or null when the pop-up is hidden.
let shownThing = null;

// What to do when the visitor chooses to go inside a building.
// main.js supplies this, because main.js is what switches maps.
let goInside = () => {};
export function onGoInside(handler) {
  goInside = handler;
}

// Shows the pop-up for a thing, or hides it if thing is null.
// main.js calls this every frame, so do nothing unless the thing has
// actually changed; otherwise screen readers would re-announce it
// sixty times a second.
export function showThing(thing) {
  if (thing === shownThing) return;
  shownThing = thing;
  fillIn(thing);
}

// Writes a thing's words, picture and buttons into the strip (or
// hides them if thing is null). Kept separate from showThing so the
// strip can be refreshed when a thing's words change while it is on
// show: the fairy says something new each time she is spoken to.
function fillIn(thing) {

  // With nothing in reach, the strip shows its "walk up to something" note.
  idleNote.hidden = Boolean(thing);
  if (!thing) {
    panel.hidden = true;
    return;
  }

  title.textContent = thing.title;
  description.textContent = thing.description;

  // Picture (only portals have one).
  image.hidden = !thing.image;
  if (thing.image) image.src = thing.image;

  // The link. Some things only explain (the chalkboard) and have none.
  // Other websites open in a new tab so the game is not lost.
  link.hidden = !thing.url && !thing.html;
  link.href = thing.url || "#";
  link.target = thing.newTab ? "_blank" : "";
  link.rel = thing.newTab ? "noopener" : "";

  // Some things have a button as their main action: a building with a
  // room ("Go inside") or a pet ("Pet"). For those, Enter presses the
  // button and the link is the second choice. For everything else,
  // Enter does what the link does.
  const hasButton = Boolean(thing.room || thing.press);
  enterButton.hidden = !hasButton;
  if (thing.room) enterButton.textContent = "Go inside (Enter)";
  if (thing.press) enterButton.textContent = `${thing.buttonLabel} (Enter)`;
  if (thing.room) link.textContent = `${thing.linkLabel} instead`;
  else if (thing.press) link.textContent = thing.linkLabel;
  else link.textContent = `${thing.linkLabel} (Enter)`;

  panel.hidden = false;
}

// Does the main action for the thing being shown. Used for the Enter
// and Space keys, so the keyboard does the same as the main button.
export function activateShownThing() {
  if (!shownThing) return;
  if (shownThing.room) {
    goInside(shownThing);
  } else if (shownThing.press) {
    shownThing.press();
    fillIn(shownThing); // pressing may have changed its words (the fairy)
  } else if (shownThing.html) {
    openReader(shownThing); // read it here, without leaving the game
  } else if (shownThing.newTab) {
    window.open(shownThing.url, "_blank", "noopener");
  } else if (shownThing.url) {
    window.location.href = shownThing.url;
  }
  // A thing with no link (the chalkboard) has nothing to do.
}

// Clicking the button does the same as pressing Enter. Clicking moves
// the keyboard to the button, which pauses the game (see main.js), so
// hand the keyboard straight back to the map: otherwise a petted dog
// would not be seen reacting.
enterButton.addEventListener("click", () => {
  activateShownThing();
  document.getElementById("game-canvas").focus();
});

// Clicking the link normally goes to its page. For a thing that has
// content to read in the game, open the reader instead.
// (preventDefault stops the browser from following the link.)
link.addEventListener("click", (event) => {
  if (shownThing && shownThing.html && !shownThing.room) {
    event.preventDefault();
    openReader(shownThing);
  }
});
