// panel.js
// The pop-up shown when the player stands at a door: the place's name,
// its blurb, and a link to its page.
//
// The pop-up is ordinary HTML (it lives in explore.qmd and is styled in
// explore.css), not something drawn on the canvas. That means the link
// is a real link: it can be clicked, tapped, and read by screen readers.

const panel = document.getElementById("place-panel");
const title = document.getElementById("place-title");
const description = document.getElementById("place-description");
const link = document.getElementById("place-link");

// The place currently shown, or null when the pop-up is hidden.
let shownPlace = null;

// Shows the pop-up for a place, or hides it if place is null.
// main.js calls this every frame, so do nothing unless the place has
// actually changed; otherwise screen readers would re-announce it
// sixty times a second.
export function showPlace(place) {
  if (place === shownPlace) return;
  shownPlace = place;

  if (!place) {
    panel.hidden = true;
    return;
  }
  title.textContent = place.title;
  description.textContent = place.description;
  link.href = place.url;
  panel.hidden = false;
}

// Goes to the page of the place being shown (used for Enter / Space).
export function openShownPlace() {
  if (shownPlace) window.location.href = shownPlace.url;
}
