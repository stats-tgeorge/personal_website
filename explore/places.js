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
  return places;
}

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
    lines.forEach((line, i) => ctx.fillText(line, Math.round(centreX), Math.round(firstLineY + i * lineHeight)));
  }
}

// Splits text into lines no wider than maxWidth, breaking at spaces.
function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let current = "";
  for (const word of String(text).split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}
