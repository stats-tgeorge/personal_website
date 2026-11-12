// maps/classroom.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The inside of the Classroom. Each character is one tile, and every
// row must be the same length. Rooms should be at least 20 tiles wide
// and 14 tall (the size of the screen).
//
//   _  floor                      (walkable)
//   #  wall                       (blocks the player)
//   i  the instruction board      (blocks the player; always present.
//                                  It is next to where the player comes
//                                  in, so its pop-up shows straight away)
//   o  a desk SPOT                (blocks the player when a desk is there)
//   p  a portal SPOT              (walkable)
//   E  the exit mat               (walking onto it leaves the room;
//                                  the player arrives on the tile above it)
//
// Desk and portal spots are filled from the Teaching page: the first
// course heading on the page gets the first "o" (reading left to right,
// top to bottom), the second course the second "o", and so on. The
// first "p" belongs to the first "o", the second "p" to the second "o".
// A spot with nothing to show is drawn as plain floor.
//
// There are 8 desk spots. If the Teaching page ever has more than 8
// courses, add more "o" and "p" spots here.

export const CLASSROOM_ROWS = [
  "####################",
  "#__________________#",
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
