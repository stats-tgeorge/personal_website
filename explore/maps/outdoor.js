// maps/outdoor.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The outdoor campus map, written as text so it can be edited without
// any tools. Each character is one tile. Every row must be the same length.
//
//   .  grass            (walkable)
//   :  path             (walkable)
//   @  where the player starts (drawn as path; use exactly one)
//   T  tree             (blocks the player)
//   ~  water            (blocks the player)
//   ^  roof             (blocks the player)
//   #  building wall    (blocks the player)
//   Y  a tree worth shaking (blocks the player; stand beside it)
//   M  the edges of the Sheet Breaker spreadsheet: its menu bar and
//      formula bar along the top, row numbers down the left, scroll
//      bar down the right (blocks the player)
//   g  the Sheet Breaker play area: 12 tiles wide, 10 tall (blocks the
//      player; the game is drawn here, see the minigame/ folder)
//   K  the two leaderboards beside the game: the top five rows are the
//      students' board, the bottom five the instructors' (blocks the
//      player; walk up the path to their right to look closer)
//   P  a signpost pointing out the score charts (blocks the player)
//   W  the "Change your look" signpost, on the fence corner just up and
//      left of where the player starts. (Not right beside the start:
//      that tile is the arrival portal's, and one tile cannot offer both.)
//
//   The Support Trail: the little park around the Student Support
//   Center, with a round path and Ink Pond in the middle. The people
//   there each answer one question from student-questions.csv, in the
//   order the spots come (reading left to right, top to bottom).
//   Q  someone standing          (blocks the player)
//   Z  someone sitting on a bench (blocks the player)
//   D  someone walking a dog     (blocks the player)
//   J  the dog, which can be petted (blocks the player)
//   N  the park's name board, on its bottom fence (blocks the player)
//   I  the "Ink Pond" sign       (blocks the player)
//   F  fence running left-right  (blocks the player)
//   H  fence running up-down     (blocks the player)
//   A gap in the fence (a ":" path tile) is a gate.
//
//   G  the billboard pointing to Sheet Breaker (blocks the player)
//
//   1-9  a building's door (blocks the player; the player stands in
//        front of it). The digit matches the "door:" line of a place
//        in explore-world.yml.

export const OUTDOOR_ROWS = [
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "T....T...............T...............T.T",
  "T.T.T...T......^^^^^^^^^T..............T",
  "T..T......T..T.^^^^^^^^^T..............T",
  "T...........Y..#########.............T.T",
  "T.....^^^^^^^..####4####...^^^^^^^.....T",
  "T.....^^^^^^^...T..::.T....^^^^^^^.....T",
  "T.....#######....T.::......#######..T..T",
  "T...T.###1###......::......###5###.....T",
  "T........:.....T...::...T.....:..~~~...T",
  "TT...TT..:.T...TT..::...T.....:.~~~~~..T",
  "T........:.T.......::.........:.~~~~~.YT",
  "T........:.........::.........:........T",
  "T..::::::::::::::::::::::::::::::::::..T",
  "T..::::::::::::::::::::::::::::::::::..T",
  "TFFFFF:FFFFFFF:FFFW::..................T",
  "TH.Q..:..DJ.....Y.H@:G....T............T",
  "TH..:::::..^^^^^^^H::....T.^^^^^^^.....T",
  "TH.::.Z.::.^^^^^^^H::.....T^^^^^^^T....T",
  "TH::.....::#######H::......#######.....T",
  "TH:..~~~.Z:###3###H::......###2###....TT",
  "TH:Q~~~~~.:...:.Q.H::.........:....Y...T",
  "TH:..~~~..:::::::::::::::::::::........T",
  "TH::....I::Q......H::................T.T",
  "TH.::.Z.::........H::.......T..........T",
  "TH..:::::....T....H::..................T",
  "THY...:..Q.....:.TH::...Y..............T",
  "TFFFFF:FFNNNNNF:FFF::..................T",
  "T..........::::::::::..................T",
  "T..........::MMMMMMMMMMMMMM............T",
  "T..........::MMMMMMMMMMMMMM............T",
  "T..........::MggggggggggggM.KKK::......T",
  "T..........::MggggggggggggM.KKK::......T",
  "T..........::MggggggggggggM.KKK::......T",
  "T..........::MggggggggggggM.KKK::......T",
  "T..........::MggggggggggggM.KKK::......T",
  "T..........::MggggggggggggM.KKK::......T",
  "T..........::MggggggggggggM.KKK::......T",
  "T..........::MggggggggggggM.KKK::......T",
  "T..........::MggggggggggggM.KKK::......T",
  "T..........::MggggggggggggM.KKK::......T",
  "T..........::::::::::::::::::::::P.....T",
  "T......................................T",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
];

// The bottom of the map is the Sheet Breaker game: the play area ("g")
// with the spreadsheet's edges round it ("M", two rows deep on top), a
// path along the front where the player stands to play, and the two
// leaderboards ("K") to the right with a path beside them. If you move
// it, keep the play area 12 tiles wide and 10 tall, with two rows of
// "M" above it and a row of path directly below it.
