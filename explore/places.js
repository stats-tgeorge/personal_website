// places.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// Connects the buildings on the outdoor map to the entries in
// explore-world.yml.
//
// explore-world.yml says WHAT each place is (title, page, blurb).
// maps/outdoor.js says WHERE each door is (a digit in the map).
// This file joins the two using the door digit, and turns each place
// into a "thing" the player can interact with (see things.js).

import { load as parseYaml } from "./vendor/js-yaml.js";
import { TILE } from "./config.js";
import { findInRows } from "./map.js";
import { OUTDOOR_ROWS } from "./maps/outdoor.js";
import { roomExists } from "./rooms.js";
import { readQuestions } from "./page-reader.js";
import { openDialogue } from "./dialogue.js";

// Reads explore-world.yml and returns a list of door "things". Each is
// the explore-world.yml entry plus the properties described in
// things.js, plus where its building is on the map (for the sign):
//   leftCol, rightCol   the building's left and right edges
//   roofTopRow          the top row of its roof
export async function loadPlaces() {
  // explore-world.yml is in the site's main folder, one level up from
  // this file. Working the address out relative to THIS file means it
  // is correct both in preview and on GitHub Pages.
  const response = await fetch(new URL("../explore-world.yml", import.meta.url));
  if (!response.ok) throw new Error(`Could not load explore-world.yml (${response.status})`);
  const entries = parseYaml(await response.text()) || [];

  const places = [];
  for (const entry of entries) {
    const door = findInRows(OUTDOOR_ROWS, String(entry.door))[0];
    if (!door) {
      // A place with no door on the map still appears in the list of
      // links under the map, so this is a warning and not an error.
      console.warn(`explore-world.yml: "${entry.title}" uses door ${entry.door}, but maps/outdoor.js has no such door.`);
      continue;
    }

    // A "room:" the game does not know is ignored (with a warning), so
    // a typo there cannot break the door; it just opens the page.
    let room = entry.room;
    if (room && !roomExists(room)) {
      console.warn(`explore-world.yml: "${entry.title}" names room "${room}", which rooms.js does not have.`);
      room = undefined;
    }

    places.push({
      ...entry,
      room,
      kind: "door",
      col: door.col,
      row: door.row,
      reach: "below",
      url: pageAddress(entry.path),
      linkLabel: "Open page",
      ...buildingAround(door),
    });
  }
  // Sheet Breaker (see the minigame/ folder). Its play area is the
  // block of "g" tiles on the outdoor map.
  const playArea = findInRows(OUTDOOR_ROWS, "g");
  if (playArea.length > 0) {
    const corner = playArea[0]; // top-left tile
    const bottomRow = playArea[playArea.length - 1].row;
    // Two name tags that are part of the spreadsheet's look: the
    // game's name at the left of the menu bar, and the formula bar,
    // where the game's messages are written (minigame/stall.js).
    // (A tag that "hangs below" starts at the bottom of its thing's
    // row, so each is placed on the row above the bar it belongs in.)
    places.push({ kind: "marquee", col: corner.col - 1, row: corner.row - 3, wide: 4, reach: "none", labelBelow: true, label: "Sheet Breaker" });
    places.push({ kind: "formula", col: corner.col, row: corner.row - 2, wide: 12, reach: "none", labelBelow: true, label: "" });
    // The game itself: stand anywhere along the front to play.
    // minigame/stall.js adds the "Play" button.
    places.push({
      kind: "booth",
      col: corner.col,
      row: bottomRow,
      wide: 12,
      reach: "below",
      title: "Sheet Breaker",
      description:
        "Break the spreadsheet! Knock out the gold cell to finish each level and earn a skill. You have three lives, and every bounce costs a point. You can play as a student or as an instructor: the goals are different.",
    });
  }

  // The two leaderboards (the "K" tiles): the top half of the block is
  // the students' board and the bottom half the instructors'. Each
  // board's name tag is its list of scores, and each is read from the
  // path along its right-hand side. minigame/stall.js fills them in.
  const boardTiles = findInRows(OUTDOOR_ROWS, "K");
  if (boardTiles.length > 0) {
    const top = boardTiles[0];
    const bottom = boardTiles[boardTiles.length - 1];
    const half = (bottom.row - top.row + 1) / 2; // rows in each board
    ["student", "instructor"].forEach((mode, i) => {
      const firstRow = top.row + i * half;
      const pathBeside = [];
      for (let row = firstRow; row < firstRow + half; row++) {
        pathBeside.push({ col: bottom.col + 1, row }, { col: bottom.col + 2, row }); // the path is two tiles wide
      }
      places.push({
        kind: "leaderboard",
        mode,
        col: top.col,
        row: firstRow - 1, // the row above the board, so its tag hangs from the board's top edge
        wide: bottom.col - top.col + 1,
        tall: half + 1, // with "wide", the area a mouse click counts as "on the board"
        reachTiles: pathBeside,
        labelBelow: true, // the "tag" hangs down over the board
        label: "",
        title: "",
        description: "",
      });
    });
  }

  // A signpost beside the leaderboards ("P"), so that people know the
  // boards have more to show than the top five.
  for (const spot of findInRows(OUTDOOR_ROWS, "P")) {
    places.push({
      kind: "sign",
      ...spot,
      reach: "adjacent",
      label: "Click leaderboard to see how you compare",
      title: "Click a leaderboard to see how you compare",
      description:
        "Walk up this path beside either leaderboard, then click or tap the board for a histogram of every finished game. You can download the scores there too.",
    });
  }

  // The "Change your look" signpost ("W"), beside where the player
  // starts. main.js gives it its button, which opens the box in
  // creator.js. "changesLook" is how main.js recognises it.
  for (const spot of findInRows(OUTDOOR_ROWS, "W")) {
    places.push({
      kind: "sign",
      changesLook: true,
      ...spot,
      reach: "adjacent",
      label: "Change your look",
      title: "Change your look",
      description: "Choose how your character looks, and add your initials if you like. Nothing is saved or sent anywhere.",
    });
  }

  places.push(...(await supportTrail(places)));

  // The trees that can be shaken ("Y" on the outdoor map): a small
  // surprise for anyone who wanders. Each shake drops spreadsheets and
  // shows the next remark from the list below.
  for (const spot of findInRows(OUTDOOR_ROWS, "Y")) {
    const tree = {
      kind: "shaketree",
      ...spot,
      reach: "adjacent",
      title: "A suspicious tree",
      description: "Something is rustling in the branches.",
      buttonLabel: "Shake",
    };
    tree.press = () => {
      tree.shakenAt = performance.now(); // things.js draws the wobble from this time
      tree.description = TREE_REMARKS[shakes % TREE_REMARKS.length];
      shakes++;
    };
    places.push(tree);
  }

  return places;
}

// What the strip says each time a tree is shaken, in turn.
let shakes = 0;
const TREE_REMARKS = [
  "Three spreadsheets fall out. One is called final_FINAL_v3.xlsx.",
  "More spreadsheets. Somebody has merged the cells.",
  "A spreadsheet with 40 tabs. One of them is called Sheet1 (2).",
  "The dates in this one are stored as text. A classic.",
  "No header row. Brave.",
  "Column Q is hidden. What is column Q hiding?",
  "This one uses colour as the only record of which rows were checked.",
  "A tidy one! One row per observation, one column per variable. Frame it.",
];

// explore-world.yml uses Quarto-style paths ("about.qmd"). The rendered
// site has "about.html", so swap the ending. Full web addresses are
// left alone. The result is resolved relative to the site's root folder
// (one level up from explore/), which works both in preview and on
// GitHub Pages, where the site lives in a /personal_website/ subfolder.
function pageAddress(path) {
  const htmlPath = String(path).replace(/\.qmd$/, ".html");
  return new URL(htmlPath, new URL("../", import.meta.url)).href;
}

// Measures the building a door belongs to, so the sign can be centred
// on its roof: walk left and right along the wall, then up to the top
// of the roof.
function buildingAround(door) {
  const tile = (col, row) => (OUTDOOR_ROWS[row] || "")[col];
  let leftCol = door.col;
  while (tile(leftCol - 1, door.row) === "#") leftCol--;
  let rightCol = door.col;
  while (tile(rightCol + 1, door.row) === "#") rightCol++;
  let roofTopRow = door.row;
  while ("#^".includes(tile(door.col, roofTopRow - 1) || " ")) roofTopRow--;
  return { leftCol, rightCol, roofTopRow };
}

// Writes each place's title on its roof.
export function drawSigns(ctx, places, camera) {
  ctx.font = "8px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";

  for (const place of places) {
    const buildingWidth = (place.rightCol - place.leftCol + 1) * TILE;
    const centreX = place.leftCol * TILE + buildingWidth / 2 - camera.x;
    const roofY = place.roofTopRow * TILE - camera.y;

    // Long titles are split over two lines so they fit on the roof.
    const lines = wrapText(ctx, place.title, buildingWidth - 6);
    const lineHeight = 9;
    const firstLineY = roofY + TILE - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => drawSignLine(ctx, line, centreX, Math.round(firstLineY + i * lineHeight)));
  }
}

// Writes one line of a roof sign, centred on centreX.
// The letters are placed one at a time, each exactly LETTER_STEP
// pixels after the last. Left to itself the browser spaces these small
// letters by fractions of a pixel, which on a canvas this coarse shows
// up as uneven gaps: "Newsstand" looked like "News stand".
const LETTER_STEP = 5;
function drawSignLine(ctx, line, centreX, y) {
  const letters = [...line];
  const startX = Math.round(centreX - ((letters.length - 1) * LETTER_STEP) / 2);
  letters.forEach((letter, i) => ctx.fillText(letter, startX + i * LETTER_STEP, y));
}

// Splits text into lines no wider than maxWidth, breaking at spaces.
function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let current = "";
  for (const word of String(text).split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length * LETTER_STEP > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ---- The Support Trail ---------------------------------------------------------
// The park around the Student Support Center. Each person there has
// one of the "Questions students ask" from the Student Support page
// (which come from student-questions.csv) in a thought bubble, and
// gives its answer when talked to.
//
// The questions are handed out in the page's order to the people on
// the map, reading the map left to right, top to bottom. If there are
// more questions than people, the console says so (press F12); add
// more "Q" or "Z" spots to maps/outdoor.js.
//
// places = the places made so far (used to find the Student Support page)
async function supportTrail(places) {
  const things = [];

  // The park's name sign, and a name for the pond.
  for (const spot of findInRows(OUTDOOR_ROWS, "N")) {
    things.push({
      kind: "sign",
      ...spot,
      reach: "adjacent",
      label: "Support Trail",
      title: "Support Trail",
      description: "A walk around Ink Pond. The people here are thinking about questions students often ask. Talk to one to hear the answer.",
    });
  }
  const water = findInRows(OUTDOOR_ROWS, "~").filter((tile) => tile.col < 12); // the park's pond, not the one by the Classroom
  if (water.length > 0) {
    const middle = water[Math.floor(water.length / 2)];
    things.push({ kind: "name", ...middle, reach: "none", label: "Ink Pond" });
  }

  // The dog comes before its walker in the list: where both are in
  // reach, the first one listed is the one the player gets.
  for (const spot of findInRows(OUTDOOR_ROWS, "J")) {
    const dog = {
      kind: "pet",
      ...spot,
      reach: "near",
      breed: "corgi",
      noFrame: true, // no photo on a wall out here
      title: "A dog out for a walk",
      description: "Very interested in the pond.",
      buttonLabel: "Pet",
    };
    dog.press = () => {
      dog.pettedAt = performance.now(); // pets.js draws the hearts from this
    };
    things.push(dog);
  }

  // The questions, read from the Student Support page.
  const support = places.find((place) => place.room === "support");
  let questions = [];
  try {
    if (support) questions = await readQuestions(support.url);
  } catch (error) {
    console.warn("Support Trail: could not read the questions from the Student Support page.", error);
  }

  // Everyone on the trail, in reading order.
  const spots = ["Q", "Z", "D"]
    .flatMap((char) => findInRows(OUTDOOR_ROWS, char).map((spot) => ({ ...spot, char })))
    .sort((a, b) => a.row - b.row || a.col - b.col);

  spots.forEach((spot, i) => {
    const asked = questions[i]; // may be missing if there are fewer questions than people
    const person = {
      kind: "person",
      look: "staff",
      staff: i, // which outfit (see people.js)
      seated: spot.char === "Z",
      walksDog: spot.char === "D",
      col: spot.col,
      row: spot.row,
      reach: asked ? "near" : "none",
    };
    if (asked) {
      person.thought = true; // labels.js shows the question as a thought, and only up close
      person.label = asked.question;
      person.title = asked.question;
      person.description = "Talk to hear the answer.";
      person.buttonLabel = "Talk";
      person.press = () => openDialogue("On the Support Trail", [asked.question, ...inSpeakingLengths(asked.answer)]);
    }
    things.push(person);
  });

  if (questions.length > spots.length) {
    console.warn(`The Student Support page has ${questions.length} questions but the Support Trail has ${spots.length} people. Add more "Q" or "Z" spots in maps/outdoor.js.`);
  }
  return things;
}

// Splits an answer into pieces short enough for the conversation box:
// whole sentences, joined while they stay under about 150 letters.
function inSpeakingLengths(answer) {
  const sentences = answer.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [answer];
  const pieces = [];
  for (const sentence of sentences.map((part) => part.trim())) {
    const last = pieces[pieces.length - 1];
    if (last && (last + " " + sentence).length <= 150) pieces[pieces.length - 1] = `${last} ${sentence}`;
    else pieces.push(sentence);
  }
  return pieces;
}
