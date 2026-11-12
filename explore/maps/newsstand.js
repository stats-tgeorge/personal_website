// maps/newsstand.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The inside of the Newsstand: a round room with a ring of bubbles,
// one per blog post. Each character is one tile, and every row must be
// the same length (spaces count).
//
//   (space)  nothing: the darkness outside the round wall
//   _  floor                      (walkable)
//   #  wall                       (blocks the player)
//   h s b  wall with a poster: histogram, scatter plot, bar chart
//   i  the instruction board      (blocks the player; always present)
//   L  the kiosk in the middle    (blocks the player; always present.
//                                  It opens the whole Blog page)
//   p  a bubble SPOT              (walkable; stand in a bubble to see its post)
//   E  the exit mat               (walking onto it leaves the room;
//                                  the player arrives on the tile above it)
//
// Bubbles are filled from the Blog page's list of posts, newest first.
// The newest post gets the spot at the bottom left (just inside the
// door, on the left) and the rest follow clockwise round the ring.
// rooms.js works out that order. A spot with no post is plain floor.
//
// There are 8 spots. When the blog has more than 8 posts, the 8 newest
// get bubbles and the kiosk still lists them all.

export const NEWSSTAND_ROWS = [
  "     ##h##s##b#     ",
  "   ###________###   ",
  " ###____________### ",
  "##____p______p____##",
  "#__________________#",
  "#__p____________p__#",
  "#________L_________#",
  "#__________________#",
  "#__p____________p__#",
  "##________________##",
  " ##___p______p___## ",
  "  ###_____i____###  ",
  "    ####_E__####    ",
  "       ######       ",
];
