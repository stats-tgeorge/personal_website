// dialogue.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The conversation box, in the style of a classic adventure game: a
// box across the bottom of the map with the speaker's name, one line
// of what they say, and a "Next" button. Each press of Next (a click,
// Enter or Space) shows the following line; after the last line the
// box closes. Escape closes it at any time.
//
// While the box is open the player stands still (main.js checks
// dialogueIsOpen), so the keys used for talking do not also walk.
//
// Like the other pop-ups, the box is ordinary HTML (in explore.qmd),
// so screen readers read each line as it appears.

const box = document.getElementById("dialogue");
const speakerName = document.getElementById("dialogue-speaker");
const text = document.getElementById("dialogue-text");
const nextButton = document.getElementById("dialogue-next");

// The conversation in progress: the lines still to come, and where we are.
let lines = [];
let lineNumber = 0;

// What to do when the conversation ends (optional).
let whenFinished = null;

// Starts a conversation.
//   speaker  the name shown on the box, e.g. "Fairy"
//   allLines what they say, one entry per press of Next
//   then     optional: a function to call when the box closes
export function openDialogue(speaker, allLines, then = null) {
  whenFinished = then;
  lines = allLines;
  lineNumber = 0;
  speakerName.textContent = speaker;
  box.hidden = false;
  showLine();
}

export function dialogueIsOpen() {
  return !box.hidden;
}

// Moves to the next line, or closes the box after the last one.
export function advanceDialogue() {
  lineNumber++;
  if (lineNumber >= lines.length) closeDialogue();
  else showLine();
}

export function closeDialogue() {
  if (box.hidden) return; // already closed
  box.hidden = true;
  // Do the "afterwards" step once, then forget it.
  const then = whenFinished;
  whenFinished = null;
  if (then) then();
}

function showLine() {
  text.textContent = lines[lineNumber];
  const isLast = lineNumber === lines.length - 1;
  // e.g. "Next (2 of 6)" so the visitor knows how much is left.
  nextButton.textContent = `${isLast ? "Done" : "Next"} (${lineNumber + 1} of ${lines.length})`;
}

// Clicking Next does the same as pressing Enter. Clicking moves the
// keyboard to the button, which would pause the game (see main.js), so
// hand the keyboard straight back to the map.
nextButton.addEventListener("click", () => {
  advanceDialogue();
  document.getElementById("game-canvas").focus();
});
