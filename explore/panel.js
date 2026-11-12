// panel.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The pop-up shown when the player can reach a thing (a door, a desk,
// a portal...): its name, its text, sometimes a picture, and its link.
//
// The pop-up is ordinary HTML (it lives in explore.qmd and is styled in
// explore.css), not something drawn on the canvas. That means the link
// is a real link: it can be clicked, tapped, and read by screen readers.

import { openReader } from "./reader.js";

const panel = document.getElementById("place-panel");
const title = document.getElementById("place-title");
const description = document.getElementById("place-description");
const image = document.getElementById("place-image");
const link = document.getElementById("place-link");
const enterButton = document.getElementById("place-enter");

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

  if (!thing) {
    panel.hidden = true;
    return;
  }

  title.textContent = thing.title;
  description.textContent = thing.description;

  // Picture (only portals have one).
  image.hidden = !thing.image;
  if (thing.image) image.src = thing.image;

  // The link. Other websites open in a new tab so the game is not lost.
  link.href = thing.url;
  link.target = thing.newTab ? "_blank" : "";
  link.rel = thing.newTab ? "noopener" : "";

  // A building with a room gets a "Go inside" button, and Enter goes
  // inside. Everything else: Enter does what the link does.
  enterButton.hidden = !thing.room;
  link.textContent = thing.room ? `${thing.linkLabel} instead` : `${thing.linkLabel} (Enter)`;

  panel.hidden = false;
}

// Moves the pop-up out of the player's way: it sits along the bottom
// of the map, unless the player is in the bottom half, in which case
// it moves to the top so it never covers them. (The "at-top" class is
// styled in explore.css.)
export function keepPanelClearOf(playerIsInBottomHalf) {
  panel.classList.toggle("at-top", playerIsInBottomHalf);
}

// Does the main action for the thing being shown. Used for the Enter
// and Space keys, so the keyboard does the same as the main button.
export function activateShownThing() {
  if (!shownThing) return;
  if (shownThing.room) {
    goInside(shownThing);
  } else if (shownThing.html) {
    openReader(shownThing); // read it here, without leaving the game
  } else if (shownThing.newTab) {
    window.open(shownThing.url, "_blank", "noopener");
  } else {
    window.location.href = shownThing.url;
  }
}

// Clicking "Go inside" does the same as pressing Enter.
enterButton.addEventListener("click", activateShownThing);

// Clicking the link normally goes to its page. For a thing that has
// content to read in the game, open the reader instead.
// (preventDefault stops the browser from following the link.)
link.addEventListener("click", (event) => {
  if (shownThing && shownThing.html && !shownThing.room) {
    event.preventDefault();
    openReader(shownThing);
  }
});
