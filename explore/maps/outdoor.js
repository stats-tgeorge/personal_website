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
//   1-9  a building's door (blocks the player; the player stands in
//        front of it). The digit matches the "door:" line of a place
//        in explore-world.yml.

export const OUTDOOR_ROWS = [
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "T....T...............T...............T.T",
  "T.T.T...T......^^^^^^^^^T..............T",
  "T..T......T..T.^^^^^^^^^T..............T",
  "T...........T..#########.............T.T",
  "T.....^^^^^^^..####4####...^^^^^^^.....T",
  "T.....^^^^^^^...T..::.T....^^^^^^^.....T",
  "T.....#######....T.::......#######..T..T",
  "T...T.###1###......::......###2###.....T",
  "T........:.....T...::...T.....:..~~~...T",
  "TT...TT..:.T...TT..::...T.....:.~~~~~..T",
  "T........:.T.......::.........:.~~~~~.TT",
  "T........:.........::.........:........T",
  "T..::::::::::::::::::::::::::::::::::..T",
  "T..::::::::::::::::::::::::::::::::::..T",
  "T..................::..................T",
  "T...............T..@:.....T............T",
  "T.....^^^^^^^......::....T.^^^^^^^.....T",
  "T..T..^^^^^^^......::.....T^^^^^^^T....T",
  "T.....#######......::......#######.....T",
  "T.....###3###......::......###5###....TT",
  "T.T......:.........::.........:....T...T",
  "T........::::::::::::::::::::::........T",
  "T...T..............::................T.T",
  "T......T...........::.......T..........T",
  "T......................................T",
  "T................T.T....T..............T",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
];
