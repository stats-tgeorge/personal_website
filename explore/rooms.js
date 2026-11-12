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
// One desk per "###" heading on the Teaching page. A course whose
// section has a picture linking to another website also gets a portal.
async function fillClassroom(rows, place) {
  const page = await readPage(place.url, 3);
  const courses = page.sections;
  const deskSpots = findInRows(rows, "o");
  const portalSpots = findInRows(rows, "p");
  const things = [];

  courses.slice(0, deskSpots.length).forEach((course, i) => {
    things.push({
      kind: "desk",
      ...deskSpots[i],
      reach: "adjacent",
      title: course.title,
      description: shorten(course.text),
      html: course.html, // "Read more" opens this in the large reader
      url: course.url,
      linkLabel: "Read more",
    });

    if (course.portal && portalSpots[i]) {
      things.push({
        kind: "portal",
        ...portalSpots[i],
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

  // The instruction board beside the entrance. It explains the room,
  // and its link opens the whole Teaching page in the large reader.
  const extra = courses.length - deskSpots.length;
  if (extra > 0) {
    console.warn(`The Teaching page has ${courses.length} courses but the classroom has ${deskSpots.length} desk spots. Add more "o" spots in maps/classroom.js.`);
  }
  for (const spot of findInRows(rows, "i")) {
    things.push({
      kind: "board",
      ...spot,
      reach: "adjacent",
      title: `Welcome to the ${place.title}`,
      description:
        "Each desk is a course I teach. Walk up to a desk and press Enter to read about it. A glowing doorway beside a desk leads to that course's own website. Step on the red mat to go back outside." +
        (extra > 0 ? ` ${extra} more courses are on the full page.` : ""),
      html: page.html,
      url: place.url,
      linkLabel: "Read the whole page",
    });
  }

  return things;
}
