// things.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// A "thing" is anything the player can walk up to and have described:
// a building's door, a desk, a portal, a person, a museum pedestal.
//
// Every thing is a plain object with these properties:
//   kind         decides how it is drawn: "door", "desk", "portal",
//                "bubble", "fairy", "laptop", "person", "pedestal",
//                "sign", "frame" or "pet". Two kinds are part of the
//                map and need no drawing here: "poster" (a wall
//                poster) and "arcade" (the mini-game cabinet outdoors)
//   col, row     the map tile it is on
//   wide         optional: 2 if it fills this tile and the one to its
//                right (the pair of tutors)
//   look         optional, for people: which helper to draw (people.js)
//   reach        where the player must stand for the pop-up to show:
//                  "below"    on the tile directly below it (doors)
//                  "adjacent" on any of the four tiles touching it
//                  "near"     on any of the eight tiles around it, corners
//                             included (people: they speak as you walk by)
//                  "on"       on the thing's own tile (portals)
//   label        optional name tag shown above it on the map (labels.js)
//   labelBelow   optional: true to hang the name tag below it instead
//   narrowLabel  optional: true for a narrower name tag
//   title        heading of the pop-up
//   description  text of the pop-up
//   url          where its link goes (optional: without it there is no link)
//   html         optional content from the regular site. When present,
//                the link opens it in the large reader (reader.js)
//                and the visitor stays in the game
//   linkLabel    the words on the link, e.g. "Read more"
//   newTab       true to open the link in a new browser tab (other websites)
//   image        optional picture shown in the pop-up (portal previews)
//   room         optional name of a room this thing leads into (doors)
//   onReach      optional: something to do each time the player comes
//                up to it (a function)
//   press        optional: something to do when its button is pressed
//                (a function; pets use it for being petted, the fairy
//                for saying her next line), with
//   buttonLabel  the words on that button, e.g. "Pet"

import { TILE, PLAYER_WIDTH, PLAYER_HEIGHT } from "./config.js";
import { drawPerson } from "./people.js";
import { drawPet, drawFrame } from "./pets.js";

// Visitors who have asked their computer to reduce motion get no
// bobbing or wagging.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Which thing (if any) can the player reach from where they stand?
export function thingInReach(player, things) {
  // Use the centre of the player's footprint to decide which tile they are on.
  const col = Math.floor((player.x + PLAYER_WIDTH / 2) / TILE);
  const row = Math.floor((player.y + PLAYER_HEIGHT / 2) / TILE);

  const reachable = things.filter((thing) => {
    // How many tiles sideways the player is from the thing. A thing
    // two tiles wide counts from whichever of its tiles is nearer.
    const rightEdge = thing.col + (thing.wide || 1) - 1;
    const across = Math.max(thing.col - col, col - rightEdge, 0);
    const down = Math.abs(thing.row - row);
    if (thing.reach === "on") return across === 0 && down === 0;
    if (thing.reach === "below") return across === 0 && row === thing.row + 1;
    if (thing.reach === "near") return across <= 1 && down <= 1 && across + down > 0;
    return across + down === 1; // "adjacent": exactly one tile away, not diagonal
  });

  // A portal sits right beside its desk, so standing on the portal
  // also counts as standing next to the desk. The thing the player is
  // standing ON wins; otherwise take the first one found.
  return reachable.find((thing) => thing.reach === "on") || reachable[0] || null;
}

// Draws the things that are objects in a room. (Doors are part of the
// map and are drawn by tiles.js.) PLACEHOLDER art, like the tiles.
// "now" is the current time in milliseconds, for things that animate.
export function drawThings(ctx, things, camera, now) {
  for (const thing of things) {
    const x = thing.col * TILE - camera.x;
    const y = thing.row * TILE - camera.y;

    if (thing.kind === "desk" || thing.kind === "laptop") {
      fill(ctx, "#8a5a2b", x + 1, y + 4, 14, 8); // table top
      fill(ctx, "#6b4420", x + 2, y + 12, 2, 4); // legs
      fill(ctx, "#6b4420", x + 12, y + 12, 2, 4);
    }
    if (thing.kind === "desk") {
      fill(ctx, "#ffffff", x + 5, y + 5, 6, 5); // a sheet of paper
    }
    if (thing.kind === "laptop") {
      fill(ctx, "#444444", x + 4, y + 1, 8, 6); // screen surround
      fill(ctx, "#56b4e9", x + 5, y + 2, 6, 4); // glowing screen
      fill(ctx, "#999999", x + 3, y + 7, 10, 3); // keyboard
    }

    if (thing.kind === "person") drawPerson(ctx, thing, x, y, now); // see people.js

    if (thing.kind === "bubble") {
      // A round soap-bubble shape that bobs gently up and down. Each
      // bubble starts at a different point in the bob (thing.col is
      // added to the time) so they do not all move as one.
      const bob = reduceMotion ? 0 : Math.round(Math.sin(now / 450 + thing.col) * 2);
      const by = y + bob;
      drawGlow(ctx, x, by, now, "#56b4e9");
      fill(ctx, "#56b4e9", x + 4, by + 1, 8, 14); // rows of different widths make a circle
      fill(ctx, "#56b4e9", x + 2, by + 3, 12, 10);
      fill(ctx, "#56b4e9", x + 1, by + 5, 14, 6);
      fill(ctx, "#cfeaf9", x + 4, by + 3, 8, 10); // lighter inside
      fill(ctx, "#cfeaf9", x + 3, by + 5, 10, 6);
      fill(ctx, "#ffffff", x + 5, by + 4, 3, 2); // shine
    }

    if (thing.kind === "fairy") {
      // The helper fairy hovers, bobbing gently up and down. Math.sin
      // swings smoothly between -1 and 1; dividing the time by 350
      // sets the speed. (No bobbing for visitors who asked their
      // computer to reduce motion.)
      const bob = reduceMotion ? 0 : Math.round(Math.sin(now / 350) * 2);
      const fy = y + 2 + bob;
      fill(ctx, "rgba(0, 0, 0, 0.2)", x + 5, y + 14, 6, 2); // shadow on the floor
      fill(ctx, "rgba(255, 255, 255, 0.85)", x + 1, fy + 3, 5, 6); // wings
      fill(ctx, "rgba(255, 255, 255, 0.85)", x + 10, fy + 3, 5, 6);
      fill(ctx, "#f1c9a5", x + 6, fy, 4, 4); // head
      fill(ctx, "#e69f00", x + 6, fy - 1, 4, 2); // hair
      fill(ctx, "#523178", x + 5, fy + 4, 6, 6); // dress, in the site's purple
      fill(ctx, "#523178", x + 4, fy + 8, 8, 2);
      fill(ctx, "#f0e442", x + 12, fy - 1, 2, 2); // a star on a wand
      fill(ctx, "#f0e442", x + 12, fy + 1, 1, 4);
    }

    if (thing.kind === "pedestal") {
      fill(ctx, "#b9b2a3", x + 3, y + 8, 10, 8); // stone plinth
      fill(ctx, "#d9d3c5", x + 2, y + 6, 12, 3); // its top
      drawExhibit(ctx, thing.exhibit || 0, x + 3, y - 3); // what is on show
    }

    if (thing.kind === "sign") {
      fill(ctx, "#6b4a2b", x + 7, y + 8, 2, 8); // post
      fill(ctx, "#523178", x + 1, y + 1, 14, 8); // board
      fill(ctx, "#ffffff", x + 3, y + 3, 10, 1); // lines of writing
      fill(ctx, "#ffffff", x + 3, y + 6, 7, 1);
    }

    if (thing.kind === "frame") drawFrame(ctx, x, y); // see pets.js
    if (thing.kind === "pet") drawPet(ctx, thing, x, y, now); // see pets.js

    if (thing.kind === "portal") {
      // Rings of colour, like a doorway of light on the floor, with a
      // glow around it that slowly brightens and fades.
      drawGlow(ctx, x, y, now, "#f0e442");
      fill(ctx, "#56b4e9", x + 2, y + 1, 12, 14);
      fill(ctx, "#523178", x + 4, y + 3, 8, 10);
      fill(ctx, "#f0e442", x + 6, y + 5, 4, 6);
    }
  }
}

// A soft glow around a tile, for portals and bubbles: two see-through
// layers, the outer one fainter, whose strength pulses over time.
// (With reduced motion the glow is steady.)
function drawGlow(ctx, x, y, now, color) {
  // Math.sin swings between -1 and 1; this turns it into 0.5 to 1.
  const pulse = reduceMotion ? 0.75 : 0.75 + Math.sin(now / 400) * 0.25;
  ctx.globalAlpha = 0.18 * pulse; // globalAlpha is how solid the paint is (1 = fully)
  fill(ctx, color, x - 4, y - 4, 24, 24);
  ctx.globalAlpha = 0.3 * pulse;
  fill(ctx, color, x - 2, y - 2, 20, 20);
  ctx.globalAlpha = 1; // back to normal for everything drawn after
}

// What stands on a museum pedestal: a small statistics picture. There
// are five; each pedestal is given a number and shows that one, so a
// row of pedestals shows a variety.
function drawExhibit(ctx, number, x, y) {
  const which = number % 5;
  if (which === 0) {
    // Bar chart.
    [["#0072b2", 4], ["#e69f00", 8], ["#009e73", 6]].forEach(([color, height], i) => {
      fill(ctx, color, x + 1 + i * 3, y + 9 - height, 2, height);
    });
  } else if (which === 1) {
    // Bell curve, built from columns of different heights.
    [1, 2, 4, 7, 8, 8, 7, 4, 2, 1].forEach((height, i) => fill(ctx, "#cc79a7", x + i, y + 9 - height, 1, height));
  } else if (which === 2) {
    // Scatter plot with its axes.
    fill(ctx, "#333333", x, y + 1, 1, 8);
    fill(ctx, "#333333", x, y + 8, 10, 1);
    for (const [dx, dy] of [[2, 6], [3, 5], [5, 5], [6, 3], [8, 2]]) fill(ctx, "#d55e00", x + dx, y + dy, 1, 1);
  } else if (which === 3) {
    // Box plot: whiskers, box and median line.
    fill(ctx, "#333333", x, y + 5, 10, 1);
    fill(ctx, "#56b4e9", x + 3, y + 2, 5, 7);
    fill(ctx, "#333333", x + 5, y + 2, 1, 7);
  } else {
    // Line chart climbing to the right.
    for (let i = 0; i < 10; i++) fill(ctx, "#009e73", x + i, y + 8 - Math.round(i * 0.5 + Math.sin(i) * 1.2), 1, 2);
  }
}

// Small helper so the drawing code above reads as one line per shape.
function fill(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}
