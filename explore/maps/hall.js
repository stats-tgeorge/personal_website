// maps/hall.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The museum of the CV ("Dr. George Achievements and Activities"),
// laid out as one area. A corridor runs up the middle from the
// entrance, with a wing opening off it for each main category ("##"
// heading) of the CV page. This map is bigger than the screen, so the
// view follows the player.
//
// Each character is one tile, and every row must be the same length
// (spaces count).
//
//   (space)  nothing: the darkness outside the walls
//   _  floor                      (walkable)
//   #  wall                       (blocks the player)
//   x q c k  wall with a poster (see tiles.js for which is which)
//   i  the helper fairy           (blocks the player; always present)
//   L  the laptop at the far end  (blocks the player; always present.
//                                  It opens the whole CV)
//   E  the exit mat               (walking onto it leaves the museum;
//                                  the player arrives on the tile above it)
//   1-9  a pedestal SPOT. The digit says which wing it belongs to:
//        1 = the first "##" heading on the CV page, 2 = the second,
//        and so on. Within a wing, the "###" headings fill that
//        digit's spots starting with the one nearest the wing's sign.
//        A spot with nothing on it is plain floor.
//   *  a wing's sign, just inside its doorway. It only names the wing.
//   l  (a small L) a wing's laptop, at the back of the wing. It opens
//      everything in that wing.
//      A sign or wing laptop belongs to whichever wing's pedestal
//      spots are closest to it.
//
// Today the CV has 8 categories with at most 5 sections each; every
// wing here has 6 spots. To add a ninth wing, draw a new room with
// "9" spots, a "*" and an "l".

export const HALL_ROWS = [
  "           ##x#q##c#k##           ",
  "           #____L_____#           ",
  "           #__________#           ",
  "###############____###############",
  "#___7__7__7__*#____#*__8__8__8___#",
  "#l______________________________l#",
  "#___7__7__7___#____#___8__8__8___#",
  "###############____###############",
  "#___5__5__5__*#____#*__6__6__6___#",
  "#l______________________________l#",
  "#___5__5__5___#____#___6__6__6___#",
  "###############____###############",
  "#___3__3__3__*#____#*__4__4__4___#",
  "#l______________________________l#",
  "#___3__3__3___#____#___4__4__4___#",
  "###############____###############",
  "#___1__1__1__*#____#*__2__2__2___#",
  "#l______________________________l#",
  "#___1__1__1___#____#___2__2__2___#",
  "###############____###############",
  "           #__________#           ",
  "           #_____i____#           ",
  "           #####E######           ",
  "               ###                ",
];
