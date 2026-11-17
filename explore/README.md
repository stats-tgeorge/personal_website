# Explore mode: maintenance guide

*Written by Claude (an AI model made by Anthropic) at Tyler George's
direction. All the code in this folder, and the placeholder art it
draws, was also written by Claude.*

Explore mode is the optional game on `explore.qmd`: a small campus you
walk around, where each building holds one page of the regular site.
This guide is for keeping it running and changing it without having to
read all the code.

## The idea in one paragraph

**The game holds no content of its own.** Every word in a room is read,
while the game runs, from the ordinary rendered pages of the site. Edit
`teaching.qmd` and the Classroom changes. So most upkeep is just the
upkeep of the regular site, with one catch: rooms find their content by
the pages' **headings**, so the pages have to keep a predictable shape
(next section).

There is no build step and no server. The folder is plain JavaScript and
CSS files that the browser loads as they are. `_quarto.yml` copies the
folder into the rendered site (`resources: explore/**`).

## What each room reads

| Building (door) | Page | What the room makes from it |
|---|---|---|
| Professor George's Office (1) | `about.qmd` | The desk reads the page's first paragraph. Each captioned picture becomes a framed photo; a caption containing Mocha, Jennabell or Macchiato also gets a dog to pet |
| Classroom and Teaching (2) | `teaching.qmd` | One desk per `###` heading, most recently taught at the front. A linked logo in the section becomes a portal to that site |
| Student Support Center (3) | `course-support.qmd` | One helper per `##` heading. The helper's look comes from words in the heading (below) |
| Achievements and Activities (4) | `cv.qmd` | One museum wing per `##` heading, one pedestal per `###` heading inside it |
| Newsstand (5) | `Blog.qmd` | One bubble per blog post in the listing |
| Support Trail (the park) | `course-support.qmd` | One person per question in the "Questions students ask" section, which comes from `student-questions.csv` |

Rules that follow from this:

- **Renaming a heading renames the thing** in the room. That is fine.
- **Removing a heading removes the thing.** Also fine.
- **Adding a heading adds a thing**, until the room runs out of spots.
  Then the browser's console (press F12) prints a message saying which
  map file needs more spots.
- **Support Center looks** are chosen by these words in the `##`
  heading: "lecture" or "lab" gives the lecturer; "academic", "tutor"
  or "studio" the two tutors; "health" or "wellbeing" the nurse; "tech"
  or "computer" the technician. Anything else gets an ordinary person.
  The list is `SUPPORT_LOOKS` in `rooms.js`.
- **Keep the label `{#student-questions}`** on the "Questions students
  ask" heading. The game finds the questions by it.
- **A section the Classroom should ignore** must not be a `###` heading.
  ("Courses at a Glance" is a `##` heading for this reason.)

## Common jobs

**Change a building's name, blurb or page.** Edit `explore-world.yml`
in the main folder. Nothing else.

**Change a map.** Maps are text, one character per tile, in `maps/`.
Each file starts with a key to its characters. Every row must be the
same length. Edit, save, refresh the preview.

**Add a building.** Add an entry to `explore-world.yml` with an unused
digit as its `door`, then draw the building in `maps/outdoor.js` with
that digit where its door is (copy an existing building's rows). With a
`room:` line the door offers "Go inside"; without one it simply opens
the page. A new kind of room needs a map file and a function in
`rooms.js`, which is a bigger job.

**More desks in the Classroom.** Copy one `"#__op__op__op__op__#"` row
and the three floor rows above it in `maps/classroom.js`.

**More people on the Support Trail.** Add `Q` (standing) or `Z` (on a
bench) to the park in `maps/outdoor.js`. People are given questions in
reading order: left to right, top to bottom.

**Change how fast the player walks, or the tile size.** `config.js`.

**Sheet Breaker's levels, goals and jokes.** `minigame/levels.js`. It
is all words and layouts, kept apart from the game's code on purpose.

**Sheet Breaker's scores.** They go to a Google Sheet whose address is
in `minigame/scores-config.js`. Set-up, and how to clear or turn off
the scores, is in `minigame/google-sheet/README.md`. To remove a score,
delete its row in the sheet.

**The wall posters.** The tiny wall versions are drawn by `posters.js`.
The full-size graphs shown by "Look closer" are PNG files made by
`posters/make-posters.R`. That script has not been run yet, so the
PNGs do not exist yet: run it once in RStudio, check the plots, and
commit the PNGs. Its header says which packages it needs. The "Did you
know" facts in `posters.js` were written from Claude's general
knowledge and have not been checked against sources; please review
them, the Galton one especially.

**The tree remarks.** `TREE_REMARKS` near the end of `places.js`.

## The files

Start at `main.js`: it is loaded by `explore.qmd` and its opening
comment lists the others. Every file begins with a comment saying what
it is for.

| File | Job |
|---|---|
| `main.js` | The starting point and the game loop: move, draw, repeat |
| `config.js` | Numbers you can tune |
| `maps/` | The maps as text: `outdoor.js` and one file per room |
| `map.js` | Questions about the map in use (what tile is here? can it be walked on?) |
| `tiles.js` | Draws one map tile |
| `things.js` | Everything the player can walk up to: what a "thing" is, which one is in reach, how each is drawn |
| `places.js` | The outdoor map's things: doors, signs, the Support Trail, the trees, the portal |
| `rooms.js` | Sets up each room from its page |
| `page-reader.js` | Reads a rendered page and pulls out its headings and content |
| `player.js`, `character.js`, `creator.js` | The player; how any person is drawn; the "Change your look" box |
| `people.js`, `pets.js`, `posters.js` | Drawing the helpers and trail staff, the dogs, the wall posters |
| `camera.js` | Which part of a big map is on screen |
| `input.js`, `touch.js` | Keyboard; the arrow pad and Go button on phones |
| `panel.js` | The strip above the map that describes whatever is in reach |
| `labels.js` | The name tags and thought bubbles over the map |
| `dialogue.js` | The conversation box |
| `reader.js` | The large pop-up for reading a section of a page |
| `layout.js` | Makes the game fill the window; the "All places" list |
| `warp.js` | The zoom-and-fade when stepping through a portal |
| `minigame/` | Sheet Breaker: `game.js` (rules), `draw.js`, `levels.js` (words and layouts), `scores.js`, `scores-config.js`, `stall.js` (joins it to the map) |
| `explore.css` | All of explore mode's styling |
| `chooser.css` | Styling for the landing page only |
| `vendor/js-yaml.js` | A library (not Claude's) that reads `explore-world.yml`. Do not edit |
| `img/Rlogo.svg` | The R logo shown when all the sheets are collected |

The page itself, `explore.qmd`, holds the HTML the game is built on
(the bar, the strip, the pop-up boxes) and the plain list of places
shown to visitors without JavaScript.

## How a "thing" works

Almost everything in the game is a "thing": a plain object with a
position and a few optional properties. `things.js` lists them all at
the top. The ones used most:

- `kind`: how it is drawn (`"door"`, `"desk"`, `"sign"`, `"person"`...).
- `col`, `row`: its tile on the map.
- `reach`: where the player must stand to use it. `"adjacent"` (beside
  it), `"near"` (beside or diagonal), `"below"`, `"on"`, or `"none"`
  for something that is only decoration.
- `title`, `description`: what the strip above the map says.
- `label`: the name tag floating over it.
- `press` and `buttonLabel`: what Enter does there, and the button's
  wording.
- `url` and `linkLabel`: a link to offer instead.

To add something new outdoors, copy a similar block in `places.js`.

## When something looks wrong

1. **Press F12 and read the Console.** The game reports what it could
   not do in plain words: a room with more headings than spots, a page
   it could not load.
2. **Preview through Quarto**, not by opening the HTML file directly.
   Browsers refuse to load the game's files from a `file://` address.
3. **A room is empty or has the wrong things.** A heading on its page
   was probably changed to a different level (`##` to `###`, say).
4. **A map looks sheared or the game stops at load.** A map row is a
   different length from the others.
5. **Nothing has changed after an edit.** Refresh with the cache
   bypassed (Cmd+Shift+R on a Mac).
6. **Roll back.** Each step was its own commit; in GitHub Desktop,
   History, right-click a commit and choose Revert.

## Accessibility, and what is still to do

Done:

- The "Traditional site" link is always on screen, and the landing page
  offers the regular site first.
- Without JavaScript, `explore.qmd` is a plain list of links to every
  place.
- Everything works by keyboard. Phones get an arrow pad and a Go button.
- All text is real HTML, not drawn on the canvas, so it stays sharp and
  can be read by screen readers. The strip above the map announces what
  the player has reached.
- With "reduce motion" switched on in the visitor's system settings,
  the bobbing, the glow, the portal zoom and Sheet Breaker's scrolling
  levels are switched off.

Not yet done:

- A proper test with a screen reader, and a full check of every
  animation against "reduce motion". Neither has been done.
- The phone layout was tested in an emulated iPhone, not on real
  devices.
- The Google Sheet script (`minigame/google-sheet/Code.gs`) was never
  run by Claude. It was set up by Tyler.
- The art is placeholder. Tyler intends to draw the final art; a list
  of what to draw, with sizes, is still to be written.

## Credits

- Designed by Tyler George; code and placeholder art written by Claude,
  an AI model made by Anthropic. Each file says so at the top.
- The art is drawn by the code as coloured rectangles. No image files
  were taken from elsewhere. Claude cannot list the material it learned
  from, so if clearly sourced art matters, replace the placeholder art
  with your own or with an openly licensed set and credit it here.
- R logo: © 2016 The R Foundation, CC-BY-SA 4.0.
- js-yaml: MIT licence.
