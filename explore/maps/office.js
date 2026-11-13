// maps/office.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The inside of Professor George's office: a small academic office
// with a personal corner. Each character is one tile, and every row
// must be the same length. (A room smaller than the screen, like this
// one, is shown centred.)
//
//   _  floor                      (walkable)
//   #  wall                       (blocks the player)
//   c k  wall with a poster (see tiles.js for which is which)
//   B  bookshelf                  (blocks the player)
//   f  a picture-frame SPOT on the wall
//   i  the helper fairy           (blocks the player; always present)
//   L  the office desk            (blocks the player; always present.
//                                  It opens the About page)
//   d  a spot for a pet           (blocks the player when a pet is there)
//   E  the exit mat               (walking onto it leaves the room;
//                                  the player arrives on the tile above it)
//
// The personal corner is filled from the captioned pictures on the
// About page:
//   - a picture whose caption is one of the pets' names (listed in
//     rooms.js) becomes that pet, standing on a "d" spot, with its
//     photo in the frame one tile up and one to the right, so the pet
//     stands just left of its photo. So every "d" must have an "f"
//     up and to its right.
//   - any other captioned picture goes in an "f" frame that has plain
//     floor below it (stand there to look at it).

export const OFFICE_ROWS = [
  "##c#k#f#f#f#f#",
  "#B_____d_d_d_#",
  "#B___________#",
  "#__L_________#",
  "#____________#",
  "#______i_____#",
  "#_____E______#",
  "##############",
];
