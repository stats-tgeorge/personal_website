// places.js
// Connects the buildings on the map to the entries in explore-world.yml.
//
// explore-world.yml says WHAT each place is (title, page, blurb).
// map.js says WHERE each door is (a digit in the map).
// This file joins the two using the door digit.

import { load as parseYaml } from "./vendor/js-yaml.js";
import { TILE, PLAYER_WIDTH, PLAYER_HEIGHT } from "./config.js";
import { MAP_ROWS, MAP_COLS, MAP_HEIGHT, tileAt } from "./map.js";

// Reads explore-world.yml and returns a list of places. Each place is the
// explore-world.yml entry plus where its door and building are on the map:
//   { door, title, path, description, url,
//     doorCol, doorRow,        the door's tile
//     leftCol, rightCol,       the building's left and right edges
//     roofTopRow }             the top row of its roof (for the sign)
export async function loadPlaces() {
  // explore-world.yml is in the site's main folder, one level up from
  // this file. Working the address out relative to THIS file means it
  // is correct both in preview and on GitHub Pages.
  const response = await fetch(new URL("../explore-world.yml", import.meta.url));
  if (!response.ok) throw new Error(`Could not load explore-world.yml (${response.status})`);
  const entries = parseYaml(await response.text()) || [];

  const places = [];
  for (const entry of entries) {
    const doorPosition = findDoor(String(entry.door));
    if (!doorPosition) {
      // A place with no door on the map still appears in the list of
      // links under the map, so this is a warning and not an error.
      console.warn(`explore-world.yml: "${entry.title}" uses door ${entry.door}, but map.js has no such door.`);
      continue;
    }
    places.push({ ...entry, url: pageAddress(entry.path), ...doorPosition, ...buildingAround(doorPosition) });
  }
  return places;
}

// explore-world.yml uses Quarto-style paths ("about.qmd"). The rendered site
// has "about.html", so swap the ending. Full web addresses are left
// alone. The result is resolved relative to the site's root folder
// (one level up from explore/), which works both in preview and on
// GitHub Pages, where the site lives in a /personal_website/ subfolder.
function pageAddress(path) {
  const htmlPath = String(path).replace(/\.qmd$/, ".html");
  return new URL(htmlPath, new URL("../", import.meta.url)).href;
}

// Finds a door digit in the map. Returns { doorCol, doorRow } or null.
function findDoor(digit) {
  for (let row = 0; row < MAP_HEIGHT; row++) {
    const col = MAP_ROWS[row].indexOf(digit);
    if (col !== -1) return { doorCol: col, doorRow: row };
  }
  return null;
}

// Measures the building a door belongs to, so the sign can be centred
// on its roof: walk left and right along the wall, then up to the top
// of the roof.
function buildingAround({ doorCol, doorRow }) {
  let leftCol = doorCol;
  while (leftCol > 0 && tileAt(leftCol - 1, doorRow) === "#") leftCol--;
  let rightCol = doorCol;
  while (rightCol < MAP_COLS - 1 && tileAt(rightCol + 1, doorRow) === "#") rightCol++;
  let roofTopRow = doorRow;
  while (roofTopRow > 0 && "#^".includes(tileAt(doorCol, roofTopRow - 1))) roofTopRow--;
  return { leftCol, rightCol, roofTopRow };
}

// Which place (if any) is the player standing in front of?
// "In front of" means the tile directly below the door.
export function placeInFrontOf(player, places) {
  // Use the centre of the player's footprint to decide which tile they are on.
  const col = Math.floor((player.x + PLAYER_WIDTH / 2) / TILE);
  const row = Math.floor((player.y + PLAYER_HEIGHT / 2) / TILE);
  return places.find((place) => place.doorCol === col && place.doorRow + 1 === row) || null;
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
