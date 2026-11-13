// warp.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The "stepping through a portal" effect: the view zooms in on the
// portal and fades to white, then the other website opens.
//
// The zoom is done by the browser, not by redrawing the game: this
// file adds the class "warping" to the stage, and explore.css says a
// warping stage shows its map enlarged and its white cover solid. The
// browser animates smoothly between the two.

const stage = document.querySelector(".game-stage");
const canvas = document.getElementById("game-canvas");

// Visitors who have asked their computer to reduce motion skip the effect.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// How long the zoom takes, in milliseconds. If you change this, change
// the two "0.5s" values under "warping" in explore.css to match.
const WARP_TIME = 500;

let warping = false;

// Plays the zoom towards a point on the map, then calls whenDone.
//   xPercent, yPercent  where to zoom in on, as a percentage of the
//                       map's width and height (50, 50 is the centre)
export function playWarp(xPercent, yPercent, whenDone) {
  if (warping) return; // already on the way through
  if (reduceMotion) {
    whenDone();
    return;
  }

  warping = true;
  canvas.style.transformOrigin = `${xPercent}% ${yPercent}%`; // zoom towards the portal
  stage.classList.add("warping");

  setTimeout(() => {
    whenDone();
    // Leave the white cover up for a moment (the new tab is opening),
    // then put everything back for when the visitor returns.
    setTimeout(() => {
      stage.classList.remove("warping");
      warping = false;
    }, 400);
  }, WARP_TIME);
}
