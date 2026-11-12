// reader.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The large pop-up for reading a piece of the regular site without
// leaving the game ("Read more" on a desk, for example).
//
// It uses the browser's built-in <dialog> element (in explore.qmd).
// The browser then handles the hard parts for us: the Esc key closes
// it, the page behind is dimmed and cannot be clicked, and screen
// readers are told a dialog has opened.

const reader = document.getElementById("reader");
const title = document.getElementById("reader-title");
const content = document.getElementById("reader-content");
const source = document.getElementById("reader-source");
const closeButton = document.getElementById("reader-close");

// Opens the reader.
//   thing.title  shown in the bar at the top
//   thing.html   the content, copied from the regular page (see page-reader.js)
//   thing.url    where this content lives on the regular site (optional)
export function openReader(thing) {
  title.textContent = thing.title;
  content.innerHTML = thing.html;
  // The "open on the regular site" line is only shown when there is
  // a page to point to.
  source.parentElement.hidden = !thing.url;
  if (thing.url) source.href = thing.url;
  content.scrollTop = 0; // start at the top, not where the last one was left
  reader.showModal();
}

// main.js uses this to give the keyboard back to the game afterwards.
export function onReaderClosed(handler) {
  reader.addEventListener("close", handler);
}

closeButton.addEventListener("click", () => reader.close());

// Clicking the dimmed area outside the box also closes it. (A click on
// the dimmed area reports the dialog itself as the thing clicked.)
reader.addEventListener("click", (event) => {
  if (event.target === reader) reader.close();
});

// Keep key presses inside the reader, for the same reason as in
// input.js: otherwise typing "s" would open Quarto's search box.
// Esc still closes the reader, because the browser handles that itself.
reader.addEventListener("keydown", (event) => event.stopPropagation());
reader.addEventListener("keyup", (event) => event.stopPropagation());
