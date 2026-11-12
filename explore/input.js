// input.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// Keeps track of which movement keys are currently held down.
//
// Keys are only listened for while the game canvas has keyboard focus.
// That is deliberate: arrow keys normally scroll the page, and we only
// want to take them over once the visitor has clicked (or tabbed) into
// the game. Tabbing away gives the keys back to the browser.

// Which keys mean which direction. Arrow keys and W/A/S/D both work.
const KEY_TO_DIRECTION = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

// Keys that mean "do the thing in front of me" (open the door).
const ACTION_KEYS = ["Enter", " "]; // " " is the space bar

// element  = the thing that must have focus for keys to count (the canvas).
// onAction = a function to call when Enter or Space is pressed.
// Returns an object the game asks each frame: "which way is the player
// trying to go?"
export function createInput(element, onAction) {
  // The set of directions currently held, e.g. {"up", "left"}.
  const held = new Set();

  element.addEventListener("keydown", (event) => {
    // Keep key presses inside the game. Quarto's search box opens when
    // it hears "s", "f" or "/" anywhere on the page; stopPropagation()
    // stops the key from travelling on to the rest of the page, so
    // walking down with "s" no longer opens search. Tab still works,
    // because moving focus is done by the browser itself.
    event.stopPropagation();

    if (ACTION_KEYS.includes(event.key)) {
      event.preventDefault(); // stop the space bar from scrolling the page
      // "repeat" is true while a key is held down; only act on the
      // first press.
      if (!event.repeat) onAction();
      return;
    }

    const direction = KEY_TO_DIRECTION[normalise(event.key)];
    if (!direction) return; // not a movement key: leave it alone (Tab etc.)
    held.add(direction);
    event.preventDefault(); // stop arrow keys from scrolling the page
  });

  element.addEventListener("keyup", (event) => {
    event.stopPropagation(); // same reason as above (search listens for key-up)
    const direction = KEY_TO_DIRECTION[normalise(event.key)];
    if (direction) held.delete(direction);
  });

  // If focus leaves the game while a key is down, the "key up" never
  // reaches us, and the player would walk forever. Forget all keys.
  element.addEventListener("blur", () => held.clear());

  return {
    // Each is -1, 0 or +1. Holding two opposite keys cancels out.
    horizontal: () => (held.has("right") ? 1 : 0) - (held.has("left") ? 1 : 0),
    vertical: () => (held.has("down") ? 1 : 0) - (held.has("up") ? 1 : 0),
  };
}

// "W" (with Shift or Caps Lock) should behave like "w".
// Arrow key names are left as they are.
function normalise(key) {
  return key.length === 1 ? key.toLowerCase() : key;
}
