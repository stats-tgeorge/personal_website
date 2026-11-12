// things.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// A "thing" is anything the player can walk up to and get a pop-up
// from: a building's door, a desk, a portal, a notice board.
//
// Every thing is a plain object with these properties:
//   kind         "door", "desk", "portal", "bubble", "board", "laptop" or
//                "person" (decides how it is drawn)
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

import { TILE, PLAYER_WIDTH, PLAYER_HEIGHT } from "./config.js";
import { drawPerson } from "./people.js";

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
      // A round soap-bubble shape: rows of different widths make a circle.
      fill(ctx, "#56b4e9", x + 4, y + 1, 8, 14);
      fill(ctx, "#56b4e9", x + 2, y + 3, 12, 10);
      fill(ctx, "#56b4e9", x + 1, y + 5, 14, 6);
      fill(ctx, "#cfeaf9", x + 4, y + 3, 8, 10); // lighter inside
      fill(ctx, "#cfeaf9", x + 3, y + 5, 10, 6);
      fill(ctx, "#ffffff", x + 5, y + 4, 3, 2); // shine
    }

    if (thing.kind === "board") {
      // A chalkboard on wheels.
      fill(ctx, "#6b4a2b", x + 1, y + 1, 14, 11); // wooden frame
      fill(ctx, "#2f5d50", x + 2, y + 2, 12, 9); // green board
      fill(ctx, "#ffffff", x + 4, y + 4, 6, 1); // chalk lines
      fill(ctx, "#ffffff", x + 4, y + 7, 8, 1);
      fill(ctx, "#6b4a2b", x + 3, y + 12, 1, 2); // legs
      fill(ctx, "#6b4a2b", x + 12, y + 12, 1, 2);
      fill(ctx, "#222222", x + 2, y + 14, 3, 2); // wheels
      fill(ctx, "#222222", x + 11, y + 14, 3, 2);
    }

    if (thing.kind === "portal") {
      // Rings of colour, like a doorway of light on the floor.
      fill(ctx, "#56b4e9", x + 2, y + 1, 12, 14);
      fill(ctx, "#523178", x + 4, y + 3, 8, 10);
      fill(ctx, "#f0e442", x + 6, y + 5, 4, 6);
    }
  }
}

// Small helper so the drawing code above reads as one line per shape.
function fill(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}
