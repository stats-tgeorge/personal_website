// maps/support.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The inside of the Student Support Center. Each character is one
// tile, and every row must be the same length. Rooms should be at
// least 20 tiles wide and 14 tall (the size of the screen).
//
//   _  floor                      (walkable)
//   #  wall                       (blocks the player)
//   i  the instruction board      (blocks the player; always present)
//   L  the laptop desk            (blocks the player; always present.
//                                  It opens the whole Student Support page)
//   n  a spot for a helper        (blocks the player when someone is there)
//   E  the exit mat               (walking onto it leaves the room;
//                                  the player arrives on the tile above it)
//
// One helper stands in the room for each "##" heading on the Student
// Support page, in the page's order. They fill the spots nearest the
// entrance first (bottom row first, left to right). A spot with nobody
// in it is drawn as plain floor.
//
// There are 8 spots. If the page ever has more than 8 "##" headings,
// add more "n" spots here.

export const SUPPORT_ROWS = [
  "####################",
  "#__________________#",
  "#___n_________n____#",
  "#__________________#",
  "#________n_________#",
  "#__________________#",
  "#___n_________n____#",
  "#__________________#",
  "#________n_________#",
  "#__________________#",
  "#___n_________n____#",
  "#______L___i_______#",
  "#_________E________#",
  "####################",
];
