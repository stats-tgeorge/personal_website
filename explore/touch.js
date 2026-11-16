// touch.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The on-screen controls for phones and tablets: an arrow pad for
// walking and a round "Go" button that does what Enter does.
//
// They only appear on touch screens. On a computer with a keyboard
// nothing here is shown, and nothing changes.
//
// How it fits with the rest:
//   - input.js keeps the list of directions being "held". The arrow
//     pad adds to and removes from that same list, so the rest of the
//     game cannot tell a thumb from an arrow key.
//   - main.js hands over the function that Enter runs; the Go button
//     runs the same one.

const area = document.querySelector(".game-area");
const controls = document.getElementById("touch-controls");
const pad = document.getElementById("touch-pad");
const goButton = document.getElementById("touch-go");

// True once the game knows it is on a touch screen. Other files use
// this to choose their wording ("Go" in place of "Enter", for example).
export function isTouch() {
  return area.classList.contains("touch");
}

// input   = what createInput() in input.js returned
// onGo    = the function to run when "Go" is pressed (the same one Enter runs)
// canvas  = the game canvas, which must keep the keyboard focus for
//           the game to run (see the game loop in main.js)
export function setUpTouchControls(input, onGo, canvas) {
  // "pointer: coarse" is how a browser says "the main way of pointing
  // here is a finger". The second check catches laptops with touch
  // screens: the controls appear the first time the screen is touched.
  if (window.matchMedia("(pointer: coarse)").matches) showControls();
  else window.addEventListener("touchstart", showControls, { once: true, passive: true });

  // The game only runs while the canvas has focus. Touching a control
  // must not take the focus away (preventDefault does that), and gives
  // it to the canvas if it was elsewhere, which also starts the game.
  function keepFocus(event) {
    event.preventDefault();
    if (document.activeElement !== canvas) canvas.focus({ preventScroll: true });
  }

  // ---- The arrow pad ----------------------------------------------------------
  // The pad is one round area. Where the thumb is, compared with the
  // pad's centre, decides the direction, so a thumb can slide from
  // "up" round to "right" without lifting. Near the diagonals two
  // directions count at once, as with two arrow keys held together.
  function steer(event) {
    const box = pad.getBoundingClientRect();
    // How far the thumb is from the centre, as a share of the pad's
    // half-width: 0 is the centre, 1 is the edge.
    const across = (event.clientX - (box.left + box.width / 2)) / (box.width / 2);
    const down = (event.clientY - (box.top + box.height / 2)) / (box.height / 2);
    const DEAD_ZONE = 0.25; // the middle of the pad does nothing

    input.releaseAll();
    if (across > DEAD_ZONE) input.hold("right");
    if (across < -DEAD_ZONE) input.hold("left");
    if (down > DEAD_ZONE) input.hold("down");
    if (down < -DEAD_ZONE) input.hold("up");
    showPressed();
  }

  // Lights up the arrows being pressed (explore.css does the colours).
  function showPressed() {
    pad.dataset.across = input.horizontal() > 0 ? "right" : input.horizontal() < 0 ? "left" : "";
    pad.dataset.down = input.vertical() > 0 ? "down" : input.vertical() < 0 ? "up" : "";
  }

  let steering = false; // is a thumb on the pad at the moment?

  pad.addEventListener("pointerdown", (event) => {
    keepFocus(event);
    steering = true;
    // "Capture" means this pad keeps hearing about the thumb even if
    // it slides off the edge of the pad.
    pad.setPointerCapture(event.pointerId);
    steer(event);
  });
  pad.addEventListener("pointermove", (event) => {
    if (steering) steer(event);
  });
  // The thumb lifted, or the phone took the touch away (a call, say).
  for (const ending of ["pointerup", "pointercancel", "lostpointercapture"]) {
    pad.addEventListener(ending, () => {
      steering = false;
      input.releaseAll();
      showPressed();
    });
  }

  // ---- The Go button ------------------------------------------------------------
  goButton.addEventListener("pointerdown", (event) => {
    keepFocus(event);
    onGo();
  });
  // A screen reader "presses" a button with a click and no pointer
  // event at all (detail is 0 for those), so listen for that too.
  goButton.addEventListener("click", (event) => {
    if (event.detail === 0) onGo();
  });

  // A long press on a phone normally brings up a copy/save menu.
  controls.addEventListener("contextmenu", (event) => event.preventDefault());
}

function showControls() {
  area.classList.add("touch");
  controls.hidden = false;
  // The start hint talks about keys; say what applies here instead.
  const hint = document.getElementById("game-start-hint");
  hint.innerHTML = "Tap here to start<br><small>Walk with the arrow pad. Press Go at a door or sign.</small>";
}
