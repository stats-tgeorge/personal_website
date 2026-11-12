// maps/classroom.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The inside of the Classroom. Each character is one tile, and every
// row must be the same length. Rooms should be at least 20 tiles wide
// and 14 tall (the size of the screen).
//
//   _  floor                      (walkable)
//   #  wall                       (blocks the player)
//   h s b  wall with a poster (see tiles.js for which is which)
//   i  the helper fairy           (blocks the player; always present.
//                                  She hovers by the door and explains
//                                  the room to anyone who talks to her)
//   L  the laptop desk            (blocks the player; always present.
//                                  It opens the whole Teaching page. It
//                                  is at the back of the room)
//   o  a desk SPOT                (blocks the player when a desk is there)
//   p  a portal SPOT              (walkable)
//   E  the exit mat               (walking onto it leaves the room;
//                                  the player arrives on the tile above it)
//
// Desk and portal spots are filled from the Teaching page, most
// recently taught course first. The FRONT of the room is the entrance
// (the bottom of the map), so the newest course gets the desk spot
// nearest the entrance: bottom row first, left to right, then the next
// row up. rooms.js works out the order; nothing here needs to change
// when a course is taught again.
//
// Each "p" belongs to the "o" just before it (reading left to right,
// top to bottom). A spot with nothing to show is drawn as plain floor.
//
// There are 8 desk spots. If the Teaching page ever has more than 8
// courses, add more "o" and "p" spots here.

export const CLASSROOM_ROWS = [
  "###h######s######b##",
  "#________L_________#",
  "#__________________#",
  "#__________________#",
  "#__op__op__op__op__#",
  "#__________________#",
  "#__________________#",
  "#__________________#",
  "#__op__op__op__op__#",
  "#__________________#",
  "#__________________#",
  "#__________i_______#",
  "#_________E________#",
  "####################",
];
