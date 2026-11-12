// maps/support.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The inside of the Student Support Center. Each character is one
// tile, and every row must be the same length. Rooms should be at
// least 20 tiles wide and 14 tall (the size of the screen).
//
//   _  floor                      (walkable)
//   #  wall                       (blocks the player)
//   x t q  wall with a poster (see tiles.js for which is which)
//   i  the helper fairy           (blocks the player; always present)
//   L  the laptop desk            (blocks the player; always present.
//                                  It opens the whole Student Support
//                                  page. It is at the back of the room,
//                                  behind the helpers)
//   n  a spot for a helper        (blocks the player when someone is there)
//   E  the exit mat               (walking onto it leaves the room;
//                                  the player arrives on the tile above it)
//
// One helper stands in the room for each "##" heading on the Student
// Support page, in the page's order. They fill the spots nearest the
// entrance first (bottom row first, left to right). A spot with nobody
// in it is drawn as plain floor.
//
// Leave the tile to the RIGHT of each "n" and the tile ABOVE it as
// floor: some helpers bring something with them (a whiteboard, a
// second person, a server) that stands there.
//
// There are 6 spots. If the page ever has more than 6 "##" headings,
// add more "n" spots here.

export const SUPPORT_ROWS = [
  "####x#####t####q####",
  "#________L_________#",
  "#__________________#",
  "#________n_________#",
  "#__________________#",
  "#___n_________n____#",
  "#__________________#",
  "#________n_________#",
  "#__________________#",
  "#___n_________n____#",
  "#__________________#",
  "#__________i_______#",
  "#_________E________#",
  "####################",
];
