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
import { OFFICE_ROWS } from "./maps/office.js";
import { HALL_ROWS } from "./maps/hall.js";

// Every room the game knows about. The names on the left are what
// "room:" in explore-world.yml refers to.
const ROOMS = {
  classroom: { rows: CLASSROOM_ROWS, fill: fillClassroom },
  support: { rows: SUPPORT_ROWS, fill: fillSupportCenter },
  newsstand: { rows: NEWSSTAND_ROWS, fill: fillNewsstand },
  office: { rows: OFFICE_ROWS, fill: fillOffice },
  // The hall's map marks pedestal spots with digits (see maps/hall.js).
  hall: { rows: HALL_ROWS, fill: fillHall, digitsAreSpots: true },
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
//   blocked  tiles made solid by things (desks, people and their props)
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

  // In the hall's map a digit is a pedestal spot. Once the pedestals
  // have been placed, the game only needs to know "this is a spot", so
  // the digits are swapped for the ordinary spot character "o". (On
  // the outdoor map a digit means a door, and would be drawn as one.)
  const playRows = room.digitsAreSpots ? room.rows.map((row) => row.replace(/[1-9]/g, "o")) : room.rows;

  loadedRooms[place.room] = {
    rows: playRows,
    things,
    blocked: tilesBlockedBy(things),
    start: { col: exit.col, row: exit.row - 1 },
  };
  return loadedRooms[place.room];
}

// --- Helpers shared by the rooms ---------------------------------------------

// Lists the tiles the player cannot walk onto because of the things in
// a room. Desks, laptops, people, pedestals, signs and pets are solid; so is
// anything a person brought with them (thing.props: a whiteboard, a
// server, a second person).
function tilesBlockedBy(things) {
  const blocked = [];
  for (const thing of things) {
    const solid = ["desk", "person", "pedestal", "sign", "pet", "laptop"].includes(thing.kind);
    if (solid) blocked.push({ col: thing.col, row: thing.row });
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
//   - a helper fairy ("i" in the map) hovering by the door, who calls
//     "Hey, listen!" and explains how to use the room. Nothing pops up
//     unasked: her words show in the strip when the player is near,
//     and talking to her (Enter) shows them large.
//   - a laptop on a desk ("L") that opens the room's whole page in the
//     large reader.
// "words" supplies the text that differs from room to room.
function fairyAndLaptop(rows, place, page, words) {
  const things = [];
  for (const spot of findInRows(rows, "i")) {
    things.push({
      kind: "fairy",
      ...spot,
      reach: "near",
      label: "Hey, listen!",
      title: "Hey, listen!",
      description: words.fairyText,
      // The same words as a paragraph, for the large pop-up.
      readerTitle: `${place.title}: how it works`,
      html: `<p class="welcome-text">${words.fairyText}</p>`,
      linkLabel: "Talk",
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
    ...fairyAndLaptop(rows, place, page, {
      fairyText:
        "Each desk is a course Tyler teaches, with the most recent nearest this door. Walk up to a desk and press Enter to read about it. A glowing doorway beside a desk leads to that course's own website. The laptop at the back of the room has every course on one page. Step on the red mat to go back outside.",
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
    ...fairyAndLaptop(rows, place, page, {
      fairyText:
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
    ...fairyAndLaptop(rows, place, blog, {
      fairyText:
        "Each bubble is a blog post, newest first, starting on your left and going clockwise round the room. Step into a bubble to see what the post is about, and press Enter to read it in a new tab. The kiosk in the middle lists every post. Step on the red mat to go back outside.",
      laptopLabel: "All Blog Posts",
      laptopText: "The whole list of blog posts." + (extra > 0 ? ` There are ${extra} older posts that do not have a bubble.` : ""),
    })
  );

  return things;
}

// --- Professor George's office ------------------------------------------------
// A small academic office. The desk opens the About page. One corner
// is personal: the captioned pictures from the About page, as framed
// photos, with the dogs standing under their own.

// The pets. A captioned picture on the About page becomes a pet when
// its caption contains one of these names; "breed" decides how it is
// drawn (see pets.js). The "i" means capital letters do not matter.
// Add a line here when a new pet joins the About page.
const PETS = [
  { ifCaptionHas: /mocha/i, breed: "lab" },
  { ifCaptionHas: /jennabell/i, breed: "lab" },
  { ifCaptionHas: /macchiato/i, breed: "corgi" },
];

async function fillOffice(rows, place) {
  const page = await readPage(place.url, 2);
  const things = [];

  // Pet spots, left to right, and the frame spots that are free for
  // other photos (the ones with no pet spot directly below).
  const petSpots = findInRows(rows, "d");
  const freeFrames = findInRows(rows, "f").filter(
    (frame) => !petSpots.some((spot) => spot.col === frame.col && spot.row === frame.row + 1)
  );

  let petsPlaced = 0;
  let framesUsed = 0;
  for (const picture of page.pictures) {
    const pet = PETS.find((candidate) => candidate.ifCaptionHas.test(picture.caption));
    // The photo itself, large, for the reader.
    const photo = `<img src="${picture.image}" alt="${picture.caption}">`;

    if (pet && petSpots[petsPlaced]) {
      const dog = {
        kind: "pet",
        ...petSpots[petsPlaced++],
        reach: "near",
        breed: pet.breed,
        label: picture.caption,
        title: picture.caption,
        description: "Woof! That is my photo on the wall. I like being petted.",
        image: picture.image,
        html: photo,
        linkLabel: "See the photo",
        buttonLabel: "Pet",
      };
      // Being petted just records when it happened; pets.js draws the
      // hearts and the spin from that time.
      dog.press = () => {
        dog.pettedAt = performance.now();
      };
      things.push(dog);
    } else if (!pet && freeFrames[framesUsed]) {
      // A framed photo with no name tag: stand below it to look.
      things.push({
        kind: "frame",
        ...freeFrames[framesUsed++],
        reach: "below",
        title: picture.caption,
        description: "A photo from the About page.",
        image: picture.image,
        html: photo,
        linkLabel: "See the photo",
      });
    }
    // Pictures beyond the spots available are still on the About page.
  }

  // The fairy and the desk. In this room the "laptop" is the office
  // desk, and it opens the About page.
  const intro = page.sections[0] ? shorten(page.sections[0].text, 200) : "The whole About page.";
  things.push(
    ...fairyAndLaptop(rows, place, page, {
      fairyText:
        "This is Professor George's office. The desk has everything about him: walk up to it and press Enter. The corner by the photos belongs to the family. The dogs like being petted, so go and say hello. Step on the red mat to go back outside.",
      laptopLabel: "About Professor George",
      laptopText: intro,
    })
  );

  return things;
}

// --- The museum of the CV ------------------------------------------------------
// Built from the CV page. Each "##" heading is a wing, and each "###"
// heading inside it is a pedestal in that wing. Each wing has a sign
// at its doorway (it only names the wing) and a laptop at the back
// (it opens everything in the wing). A laptop at the far end of the
// corridor opens the whole CV. See maps/hall.js for how the map marks
// which wing is which.
async function fillHall(rows, place) {
  const page = await readPage(place.url, 2);
  const things = [];

  // Where every pedestal spot is, grouped by its digit:
  // spotsByWing["1"] is the list of spots for the first wing.
  const spotsByWing = {};
  for (const digit of "123456789") spotsByWing[digit] = findInRows(rows, digit);

  // Straight-line distance between two map positions (Pythagoras).
  const distance = (a, b) => Math.hypot(a.col - b.col, a.row - b.row);

  // Which wing (as a number, counting from 0) a sign or wing laptop
  // belongs to: the wing whose pedestal spots are nearest to it.
  const wingNearest = (position) => {
    let best = null;
    let bestDistance = Infinity;
    for (const [digit, spots] of Object.entries(spotsByWing)) {
      for (const spot of spots) {
        if (distance(spot, position) < bestDistance) {
          bestDistance = distance(spot, position);
          best = Number(digit) - 1;
        }
      }
    }
    return best;
  };

  const signs = findInRows(rows, "*").map((spot) => ({ ...spot, wing: wingNearest(spot) }));
  const wingLaptops = findInRows(rows, "l").map((spot) => ({ ...spot, wing: wingNearest(spot) }));

  page.sections.forEach((wing, w) => {
    const sign = signs.find((candidate) => candidate.wing === w);
    const laptop = wingLaptops.find((candidate) => candidate.wing === w);
    let spots = spotsByWing[String(w + 1)] || [];
    if (spots.length === 0) {
      console.warn(`The CV has a category "${wing.title}" but maps/hall.js has no "${w + 1}" pedestal spots for it.`);
      return;
    }
    if (wing.children.length > spots.length) {
      console.warn(`"${wing.title}" has ${wing.children.length} sections but only ${spots.length} pedestal spots in maps/hall.js.`);
    }

    // Fill the pedestals nearest the doorway first, so a wing with few
    // sections does not look empty from the corridor.
    if (sign) spots = [...spots].sort((a, b) => distance(a, sign) - distance(b, sign));

    wing.children.slice(0, spots.length).forEach((section, i) => {
      things.push({
        kind: "pedestal",
        ...spots[i],
        reach: "adjacent",
        exhibit: things.length, // picks which little statistics picture is on top
        narrowLabel: true, // pedestals are close together
        label: section.title,
        title: `${section.title} (${wing.title})`,
        description: shorten(section.text, 200),
        html: section.html,
        url: section.url,
        linkLabel: "Read more",
      });
    });

    // The sign only says which wing this is and what is in it.
    if (sign) {
      things.push({
        kind: "sign",
        col: sign.col,
        row: sign.row,
        reach: "adjacent",
        label: wing.title,
        narrowLabel: true,
        title: wing.title,
        description: `In this wing: ${wing.children.map((section) => section.title).join(", ")}. The laptop at the back of the wing has it all on one page.`,
      });
    }

    // The laptop at the back of the wing opens the whole wing.
    if (laptop) {
      things.push({
        kind: "laptop",
        col: laptop.col,
        row: laptop.row,
        reach: "adjacent",
        label: "All of this wing", // short: the sign by the door names the wing
        title: `All of ${wing.title}`,
        description: `Everything in the ${wing.title} wing on one page.`,
        html: wing.html,
        url: wing.url,
        linkLabel: "Read it all",
      });
    }
  });

  things.push(
    ...fairyAndLaptop(rows, place, page, {
      fairyText:
        "Welcome to the museum of Dr. George's CV. The corridor ahead has a wing for each category, named on the sign inside its doorway. In a wing, every pedestal is one section: walk up and press Enter to read it. The laptop at the back of a wing has that whole category, and the laptop at the far end of the corridor has the entire CV. Step on the red mat to go back outside.",
      laptopLabel: "The Whole CV",
      laptopText: "The complete curriculum vitae in one place.",
    })
  );

  return things;
}
