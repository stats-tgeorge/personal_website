// layout.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// Makes the game fill the browser window, and looks after the two
// things that must not get lost when it does:
//   - the "switch to traditional site" link (it is in the game's top
//     bar, so it is always on screen), and
//   - the list of all places (the "All places" button shows it).

import { openReader } from "./reader.js";

const allPlacesButton = document.getElementById("all-places-button");

// Called once by main.js when the game starts.
export function fillTheWindow() {
  // This class switches on the "full window" rules in explore.css.
  // It goes on the <html> element so those rules can also stop the
  // page behind from scrolling.
  document.documentElement.classList.add("explore-full");

  // The rest of the page (navigation bar, title, list of places) is now
  // hidden behind the game. Mark it "inert" so the Tab key and screen
  // readers skip it, instead of landing on links nobody can see.
  const game = document.getElementById("game-area");
  const behind = document.querySelectorAll("#quarto-header, #title-block-header, main > *, footer");
  for (const element of behind) {
    if (element !== game) element.inert = true;
  }

  // The list of places is hidden too, so offer it through a button.
  allPlacesButton.hidden = false;
}

// "All places" shows the same list that is on the page (built by
// Quarto from explore-world.yml), inside the large reader.
allPlacesButton.addEventListener("click", () => {
  const copy = document.getElementById("places-info").cloneNode(true);
  // Two things on one page must not share an id, so strip the ids
  // from the copy.
  for (const element of copy.querySelectorAll("[id]")) element.removeAttribute("id");
  openReader({ title: "All places", html: copy.innerHTML });
});
