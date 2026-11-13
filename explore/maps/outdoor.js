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
  "T...T.###1###......::......###2###.....T",
  "T........:.....T...::...T.....:..~~~...T",
  "TT...TT..:.T...TT..::...T.....:.~~~~~..T",
  "T........:.T.......::.........:.~~~~~.YT",
  "T........:.........::.........:........T",
  "T..::::::::::::::::::::::::::::::::::..T",
  "T..::::::::::::::::::::::::::::::::::..T",
  "T..................::..................T",
  "T...............Y..@:.....T............T",
  "T.....^^^^^^^......::....T.^^^^^^^.....T",
  "T..Y..^^^^^^^......::.....T^^^^^^^T....T",
  "T.....#######......::......#######.....T",
  "T.....###3###......::......###5###....TT",
  "T.T......:.........::.........:....Y...T",
  "T........::::::::::::::::::::::........T",
  "T...T..............::................T.T",
  "T......T...........::.......T..........T",
  "T..................::..................T",
  "T................T.::...Y..............T",
  "T..................::..................T",
  "T..........::::::::::..................T",
  "T..........::MMMMMMMMMMMMMM............T",
  "T..........::MMMMMMMMMMMMMM............T",
  "T..........::MggggggggggggM.KKKK::.....T",
  "T..........::MggggggggggggM.KKKK::.....T",
  "T..........::MggggggggggggM.KKKK::.....T",
  "T..........::MggggggggggggM.KKKK::.....T",
  "T..........::MggggggggggggM.KKKK::.....T",
  "T..........::MggggggggggggM.KKKK::.....T",
  "T..........::MggggggggggggM.KKKK::.....T",
  "T..........::MggggggggggggM.KKKK::.....T",
  "T..........::MggggggggggggM.KKKK::.....T",
  "T..........::MggggggggggggM.KKKK::.....T",
  "T..........:::::::::::::::::::::::.....T",
  "T......................................T",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
];

// The bottom of the map is the Sheet Breaker game: the play area ("g")
// with the spreadsheet's edges round it ("M", two rows deep on top), a
// path along the front where the player stands to play, and the two
// leaderboards ("K") to the right with a path beside them. If you move
// it, keep the play area 12 tiles wide and 10 tall, with two rows of
// "M" above it and a row of path directly below it.
