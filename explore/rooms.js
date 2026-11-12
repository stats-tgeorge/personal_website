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
import { readPage, readListing, shorten } from "./page-reader.js";
import { CLASSROOM_ROWS } from "./maps/classroom.js";
import { SUPPORT_ROWS } from "./maps/support.js";
import { NEWSSTAND_ROWS } from "./maps/newsstand.js";

// Every room the game knows about. The names on the left are what
// "room:" in explore-world.yml refers to.
const ROOMS = {
  classroom: { rows: CLASSROOM_ROWS, fill: fillClassroom },
  support: { rows: SUPPORT_ROWS, fill: fillSupportCenter },
  newsstand: { rows: NEWSSTAND_ROWS, fill: fillNewsstand },
};

export function roomExists(name) {
  return name in ROOMS;
}

// Rooms already set up in this visit, so walking in a second time is instant.
const loadedRooms = {};

// Sets up a room. "place" is the explore-world.yml entry for the
// building (it supplies the page to read and the title).
// Returns { rows, things, blocked, start, welcome }:
//   rows     the room's map
//   things   what the player can interact with
//   blocked  tiles made solid by things (desks, people and their props)
//   start    the tile where the player appears
//   welcome  the chalkboard, whose instructions main.js pops up the
//            first time the player walks in
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
    blocked: tilesBlockedBy(things),
    welcome: things.find((thing) => thing.kind === "board") || null,
    start: { col: exit.col, row: exit.row - 1 },
  };
  return loadedRooms[place.room];
}

// --- Helpers shared by the rooms ---------------------------------------------

// Lists the tiles the player cannot walk onto because of the things in
// a room. Desks and people are solid; so is anything a person brought
// with them (thing.props: a whiteboard, a server, a second person).
function tilesBlockedBy(things) {
  const blocked = [];
  for (const thing of things) {
    if (thing.kind === "desk" || thing.kind === "person") blocked.push({ col: thing.col, row: thing.row });
    for (const prop of thing.props || []) blocked.push(prop);
  }
  return blocked;
}

// For sorting map spots so the ones nearest the entrance come first.
// The entrance is at the bottom of every room, so: the lowest row
// first, and left to right within a row.
function frontFirst(a, b) {
  return b.row - a.row || a.col - b.col;
}

// Every room has the same two fixtures:
//   - a chalkboard ("i" in the map) explaining how to use the room.
//     main.js pops its instructions up, large, the first time the
//     player walks in; pressing Enter at the board shows them again.
//   - a laptop on a desk ("L") that opens the room's whole page in the
//     large reader.
// "words" supplies the text that differs from room to room.
function boardAndLaptop(rows, place, page, words) {
  const things = [];
  for (const spot of findInRows(rows, "i")) {
    things.push({
      kind: "board",
      ...spot,
      reach: "adjacent",
      label: "Read Now",
      title: `Welcome to the ${place.title}`,
      description: words.boardText,
      // The same words as a paragraph, for the large pop-up.
      html: `<p class="welcome-text">${words.boardText}</p>`,
      linkLabel: "Show it large",
    });
  }
  for (const spot of findInRows(rows, "L")) {
    things.push({
      kind: "laptop",
      ...spot,
      reach: "adjacent",
      label: words.laptopLabel,
      title: words.laptopLabel,
      description: words.laptopText,
      html: page.html,
      url: place.url,
      linkLabel: "Read it all",
    });
  }
  return things;
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
    .sort((a, b) => frontFirst(a.desk, b.desk));

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

  things.push(
    ...boardAndLaptop(rows, place, page, {
      boardText:
        "Each desk is a course I teach, with the most recent nearest this door. Walk up to a desk and press Enter to read about it. A glowing doorway beside a desk leads to that course's own website. The laptop has every course on one page. Step on the red mat to go back outside.",
      laptopLabel: "All Course Details",
      laptopText: "The whole Teaching page in one place." + (extra > 0 ? ` It includes ${extra} more courses than there are desks.` : ""),
    })
  );

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

// --- The Student Support Center -------------------------------------------
// One helper per "##" heading on the Student Support page. Walking
// past a helper shows the start of what their section says; "Read
// more" opens the whole section.
async function fillSupportCenter(rows, place) {
  const page = await readPage(place.url, 2);
  const spots = findInRows(rows, "n").sort(frontFirst);

  const things = page.sections.slice(0, spots.length).map((topic, i) => {
    const look = lookFor(topic.title);
    const spot = spots[i];
    return {
      kind: "person",
      ...spot,
      reach: "near",
      look,
      // The tutors are two people, filling this tile and the next.
      wide: look === "tutors" ? 2 : 1,
      props: propsFor(look, spot),
      label: topic.title,
      title: topic.title,
      // Shown in quotation marks, as something the helper says.
      description: `“${shorten(topic.text, 200)}”`,
      html: topic.html,
      url: topic.url,
      linkLabel: "Read more",
    };
  });

  const extra = page.sections.length - spots.length;
  if (extra > 0) {
    console.warn(`The Student Support page has ${page.sections.length} "##" headings but the room has ${spots.length} helper spots. Add more "n" spots in maps/support.js.`);
  }

  things.push(
    ...boardAndLaptop(rows, place, page, {
      boardText:
        "Each person here knows about one kind of help. Walk past someone to hear what they have to say, and press Enter to read more. The laptop at the back of the room has everything on one page. Step on the red mat to go back outside.",
      laptopLabel: "All Support Details",
      laptopText: "The whole Student Support page in one place.",
    })
  );

  return things;
}

// Which helper to draw for a heading on the Student Support page. The
// first rule whose word appears in the heading wins; a heading that
// matches none gets an ordinary person. (The "i" after each pattern
// means capital letters do not matter.)
//
// If you rename a heading on the page, check it still contains one of
// these words, or change the word here.
const SUPPORT_LOOKS = [
  { ifHeadingHas: /lecture|lab/i, look: "lecturer" },
  { ifHeadingHas: /academic|tutor|studio/i, look: "tutors" },
  { ifHeadingHas: /health|wellbeing|wellness/i, look: "nurse" },
  { ifHeadingHas: /tech|computer/i, look: "tech" },
];

function lookFor(heading) {
  const rule = SUPPORT_LOOKS.find((candidate) => candidate.ifHeadingHas.test(heading));
  return rule ? rule.look : "plain";
}

// The extra tiles a helper's belongings stand on (see people.js for
// what is drawn there). These become solid.
function propsFor(look, spot) {
  const toTheRight = { col: spot.col + 1, row: spot.row };
  const behind = { col: spot.col, row: spot.row - 1 };
  if (look === "lecturer") return [toTheRight]; // whiteboard
  if (look === "tutors") return [toTheRight]; // the second tutor
  if (look === "nurse") return [toTheRight]; // first-aid cabinet
  if (look === "tech") return [behind]; // server
  return [];
}

// --- The Newsstand ----------------------------------------------------------
// One bubble per post on the Blog page, newest first. Standing in a
// bubble shows the post's title and summary; Enter opens the post in a
// new tab (posts can be long, with plots and photos, so they get a
// whole tab instead of the reader).
async function fillNewsstand(rows, place) {
  const blog = await readListing(place.url);

  // Put the bubble spots in order round the ring: start at the bottom
  // left (just inside the door) and go clockwise. Math.atan2 gives the
  // direction of each spot from the middle of the room as an angle;
  // sorting by angle walks round the circle.
  const middle = { col: (rows[0].length - 1) / 2, row: (rows.length - 1) / 2 };
  const angle = (spot) => {
    // Measured from "straight down", increasing clockwise on screen,
    // from 0 up to a full turn (2 x pi).
    const turn = Math.atan2(-(spot.col - middle.col), spot.row - middle.row);
    return (turn + 2 * Math.PI) % (2 * Math.PI);
  };
  const spots = findInRows(rows, "p").sort((a, b) => angle(a) - angle(b));

  const things = blog.posts.slice(0, spots.length).map((post, i) => ({
    kind: "bubble",
    ...spots[i],
    reach: "on",
    label: post.title,
    title: post.title,
    description: [post.date, shorten(post.text, 180)].filter(Boolean).join(" · "),
    image: post.image,
    url: post.url,
    linkLabel: "Read this post",
    newTab: true,
  }));

  const extra = blog.posts.length - spots.length;
  things.push(
    ...boardAndLaptop(rows, place, blog, {
      boardText:
        "Each bubble is a blog post, newest first, starting on your left and going clockwise round the room. Step into a bubble to see what the post is about, and press Enter to read it in a new tab. The kiosk in the middle lists every post. Step on the red mat to go back outside.",
      laptopLabel: "All Blog Posts",
      laptopText: "The whole list of blog posts." + (extra > 0 ? ` There are ${extra} older posts that do not have a bubble.` : ""),
    })
  );

  return things;
}
