// rooms.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The insides of buildings. A place in explore-world.yml with a line
// like "room: classroom" can be walked into; this file knows how to
// set that room up.
//
// A room is: a map (in the maps/ folder) plus the things in it. The
// things are NOT written here. They are read from the place's ordinary
// web page each time, so the room always matches the page.

import { findInRows } from "./map.js";
import { readPage, shorten } from "./page-reader.js";
import { CLASSROOM_ROWS } from "./maps/classroom.js";

// Every room the game knows about. The names on the left are what
// "room:" in explore-world.yml refers to.
const ROOMS = {
  classroom: { rows: CLASSROOM_ROWS, fill: fillClassroom },
};

export function roomExists(name) {
  return name in ROOMS;
}

// Rooms already set up in this visit, so walking in a second time is instant.
const loadedRooms = {};

// Sets up a room. "place" is the explore-world.yml entry for the
// building (it supplies the page to read and the title).
// Returns { rows, things, blocked, start }:
//   rows     the room's map
//   things   what the player can interact with
//   blocked  tiles made solid by things (desks)
//   start    the tile where the player appears
export async function loadRoom(place) {
  if (loadedRooms[place.room]) return loadedRooms[place.room];

  const room = ROOMS[place.room];
  let things = [];
  try {
    things = await room.fill(room.rows, place);
  } catch (error) {
    // If the page cannot be read, the room still opens; it is just
    // empty. The link list under the map still works.
    console.warn(`Explore mode: could not fill the ${place.room}.`, error);
  }

  // The player appears on the tile just above the exit mat.
  const exit = findInRows(room.rows, "E")[0];

  loadedRooms[place.room] = {
    rows: room.rows,
    things,
    blocked: things.filter((thing) => thing.kind === "desk"),
    start: { col: exit.col, row: exit.row - 1 },
  };
  return loadedRooms[place.room];
}

// --- The Classroom -------------------------------------------------------
// One desk per "###" heading on the Teaching page, most recently
// taught nearest the entrance. A course whose section has a picture
// linking to another website also gets a portal beside its desk.
async function fillClassroom(rows, place) {
  const page = await readPage(place.url, 3);

  // Most recently taught first. (When two courses tie, they keep the
  // order they have on the page.) "when" is worked out once per
  // course, then used for sorting.
  const courses = page.sections
    .map((course) => ({ ...course, when: lastTaught(course) }))
    .sort((a, b) => b.when - a.when);

  // Pair each desk spot with the portal spot that follows it in the
  // map, then put the pairs in "front first" order: the bottom row
  // (nearest the entrance) first, and left to right within a row.
  const deskSpots = findInRows(rows, "o");
  const portalSpots = findInRows(rows, "p");
  const spots = deskSpots
    .map((desk, i) => ({ desk, portal: portalSpots[i] }))
    .sort((a, b) => b.desk.row - a.desk.row || a.desk.col - b.desk.col);

  const things = [];

  courses.slice(0, spots.length).forEach((course, i) => {
    things.push({
      kind: "desk",
      ...spots[i].desk,
      reach: "adjacent",
      label: withoutCourseCode(course.title),
      title: course.title,
      description: shorten(course.text),
      html: course.html, // "Read more" opens this in the large reader
      url: course.url,
      linkLabel: "Read more",
    });

    if (course.portal && spots[i].portal) {
      things.push({
        kind: "portal",
        ...spots[i].portal,
        reach: "on",
        title: "A door to another world",
        // new URL(...).hostname is the site's name, e.g. "example.github.io".
        description: `This leads to the website for ${course.title}, at ${new URL(course.portal.url).hostname}.`,
        image: course.portal.image,
        url: course.portal.url,
        linkLabel: "Step through",
        newTab: true,
      });
    }
  });

  const extra = courses.length - spots.length;
  if (extra > 0) {
    console.warn(`The Teaching page has ${courses.length} courses but the classroom has ${spots.length} desk spots. Add more "o" and "p" spots in maps/classroom.js.`);
  }

  // The chalkboard beside the entrance: how to use the room. It has no
  // link; it only explains.
  for (const spot of findInRows(rows, "i")) {
    things.push({
      kind: "board",
      ...spot,
      reach: "adjacent",
      label: "Read Now",
      title: `Welcome to the ${place.title}`,
      description:
        "Each desk is a course I teach, with the most recent nearest this door. Walk up to a desk and press Enter to read about it. A glowing doorway beside a desk leads to that course's own website. The laptop has every course on one page. Step on the red mat to go back outside.",
    });
  }

  // The laptop desk: the whole Teaching page, in the large reader.
  for (const spot of findInRows(rows, "L")) {
    things.push({
      kind: "laptop",
      ...spot,
      reach: "adjacent",
      label: "All Course Details",
      title: "All Course Details",
      description:
        "The whole Teaching page in one place." +
        (extra > 0 ? ` It includes ${extra} more courses than there are desks.` : ""),
      html: page.html,
      url: place.url,
      linkLabel: "Read it all",
    });
  }

  return things;
}

// Works out when a course was last taught, as a number that can be
// sorted (bigger = more recent). It reads the line in the course's
// section that starts "Semester:" or "Semesters:", for example
//
//     Semesters: Fall 2022 Block 2, Fall 2021 Block 4
//
// The rules, so the Teaching page can be kept in a shape this understands:
//   - Write the line as "Semesters: ..." near the top of the section.
//   - Include four-digit years ("Fall 2024", "Spring 2021, 2023",
//     "2021-2022"). The latest year on the line is the one used.
//   - A season just before a year (Spring, Summer, Fall, Winter) breaks
//     ties within a year. A year after a comma reuses the season
//     before it: in "Spring 2021, 2023" the 2023 counts as Spring.
//   - "All of them" (or anything with the word "all" and no year)
//     means it is taught all the time, which counts as most recent.
//   - A course with no such line counts as oldest, with a warning in
//     the browser console.
function lastTaught(course) {
  // Find the "Semesters: ..." sentence within the section's text.
  // (The text is one long string, so stop at the next full stop.)
  const match = course.text.match(/Semesters?:\s*([^.]*)/i);
  if (!match) {
    console.warn(`Teaching page: "${course.title}" has no "Semesters:" line, so it is treated as the oldest course.`);
    return 0;
  }
  const line = match[1];

  // Earlier in the calendar year = smaller number.
  const seasonOrder = { winter: 1, spring: 2, summer: 3, fall: 4 };

  let latest = 0;
  let season = 0; // the most recent season word seen while reading along the line
  // Walk through the line picking out season words and years, in order.
  for (const word of line.matchAll(/winter|spring|summer|fall|\d{4}/gi)) {
    const text = word[0].toLowerCase();
    if (text in seasonOrder) {
      season = seasonOrder[text];
    } else {
      // Year times 10 leaves room for the season as the last digit, so
      // Fall 2022 (20224) sorts after Spring 2022 (20222) but before
      // Spring 2023 (20232).
      latest = Math.max(latest, Number(text) * 10 + season);
    }
  }

  if (latest === 0 && /\ball\b/i.test(line)) return Infinity; // "All of them"
  if (latest === 0) {
    console.warn(`Teaching page: could not find a year in "${match[0]}" for "${course.title}", so it is treated as the oldest course.`);
  }
  return latest;
}

// "Advanced Regression (STA 363)" -> "Advanced Regression". The name
// tags above desks are small, so the course code is left to the pop-up.
function withoutCourseCode(title) {
  return title.replace(/\s*\([^)]*\)\s*$/, "");
}
