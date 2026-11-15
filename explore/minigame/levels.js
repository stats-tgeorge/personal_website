// minigame/levels.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// Everything about Sheet Breaker that is WORDS or LAYOUT, kept apart
// from the code that runs the game, so it can be edited safely:
// the levels, the goals for each mode, and the jokes.
//
// Sheet Breaker is a brick-breaking game in which the bricks are the
// cells of a spreadsheet. Each level has one golden GOAL cell; break
// it to finish the level and earn a skill, which makes the ball bigger.

// ---- The levels ---------------------------------------------------------
// Each level's sheet is drawn as text, 12 characters wide (columns A to
// L), top row first. One character is one cell:
//
//   .  empty
//   c  an ordinary data cell      (1 hit)
//   m  a merged cell              (2 hits; everyone hates merged cells)
//   #  a #REF! error cell         (cannot be broken; go around it)
//   e  a cell with an email       (1 hit, bonus points and a remark)
//   r  a cell with a review       (the same)
//   k  a cell with a coffee       (the same)
//   q  a cell with a question     (the same)
//   G  the goal cell              (gold, 3 hits; breaking it ends the
//                                  level. Its picture shows the goal)
//
// "holes" are gaps in the edges that the ball can fly out through
// (losing a life): missing row numbers at the sides, or a missing
// column letter at the top. They start small (two rows, on level 3)
// and grow from level to level. Each is [wall, from, to]: the wall is "left",
// "right" or "top", and from/to are distances in pixels along that
// wall (down from the top for the side walls, across from the left for
// the top wall). The sheet is 192 pixels wide and 152 tall.
//
// SCROLLING LEVELS. A level may also have a taller version, in which
// the sheet is longer than the screen and the view scrolls up and down
// to follow the ball:
//   extraRows  how many rows taller than the screen it is (a row is 8 pixels)
//   tallSheet  the cells for the tall version, top row first
//   tallHoles  the holes for the tall version (side-wall distances are
//              measured down the whole tall sheet)
// Visitors who ask their computer to reduce motion get the ordinary
// version ("sheet" and "holes") instead, with no scrolling.
export const LEVELS = [
  {
    sheet: [
      "............",
      "...cccGccc..",
      "..cccccccc..",
      "..cekccrcc..",
      "..cccccccc..",
    ],
    holes: [],
  },
  {
    sheet: [
      "ccmmcGccmmcc",
      "cecccmmcccrc",
      "cccckccqcccc",
      "c..cccccc..c",
    ],
    holes: [],
  },
  {
    sheet: [
      "ccccmGmccccc",
      "cc##mmmm##cc",
      "cecccccccckc",
      "ccrc....cqcc",
      "cccc....cccc",
    ],
    holes: [
      ["left", 96, 112],
      ["right", 96, 112],
    ],
  },
  {
    sheet: [
      "mmmmmGmmmmmm",
      "ccc#cccc#ccc",
      "cecccrrccckc",
      "cc#cccccc#cc",
      "cqccc..cccqc",
    ],
    holes: [
      ["left", 72, 96],
      ["right", 104, 128],
    ],
    // The scrolling version: 10 more rows than fit on screen.
    extraRows: 10,
    tallSheet: [
      "mmmmmGmmmmmm",
      "cccccccccccc",
      "c#cccccccc#c",
      "cecccrrccckc",
      "cccccccccccc",
      "............",
      "............",
      "ccc#cccc#ccc",
      "cqcccccccqcc",
      "cc#cccccc#cc",
      "cccc....cccc",
    ],
    tallHoles: [
      ["left", 150, 174],
      ["right", 184, 208],
    ],
  },
  {
    sheet: [
      "##mmmGmmmm##",
      "mmccccccccmm",
      "c#cecccrc#cc",
      "ccccc##ccccc",
      "ckcccccccqcc",
      "cc..cccc..cc",
    ],
    holes: [
      ["left", 64, 80],
      ["left", 112, 128],
      ["right", 64, 80],
      ["right", 112, 128],
      ["top", 88, 104],
    ],
    // The scrolling version: 16 more rows than fit on screen.
    extraRows: 16,
    tallSheet: [
      "##mmmGmmmm##",
      "mmccccccccmm",
      "cccccccccccc",
      "c#cecccrc#cc",
      "cccccccccccc",
      "............",
      "ccccc##ccccc",
      "ckcccccccqcc",
      "cccccccccccc",
      "............",
      "mmcc....ccmm",
      "cc#cccccc#cc",
      "cc..cccc..cc",
    ],
    tallHoles: [
      ["left", 120, 136],
      ["left", 204, 220],
      ["right", 156, 172],
      ["right", 236, 252],
      ["top", 88, 104],
    ],
  },
];

// ---- The two ways to play -------------------------------------------------
// For each mode, one entry per level (in the same order as LEVELS):
//   goal   what the player is trying to get done. Breaking the gold
//          cell does it.
//   icon   the little picture on the gold cell (drawn in draw.js):
//          "page", "envelope", "bug", "people", "grade", "clock" or "coin"
//   done   what is said when it is done
//   skill  what the player has learned by doing it. Each skill makes
//          the ball bigger.
// The goal, picture and skill are meant to belong together: the skill
// is what doing that task really teaches.
//
// "remarks" is what is said when one of the four bonus cells is
// broken. The four pictures mean the same thing in both modes:
//   e  envelope       an email dealt with
//   r  star           a piece of feedback
//   k  mug            a coffee
//   q  question mark  a question asked
export const MODES = {
  student: {
    name: "Student",
    goals: [
      { goal: "Finish the statistics homework", icon: "page", done: "Every answer has units.", skill: "Data Moves" },
      { goal: "Email the professor before the deadline", icon: "envelope", done: "Sent at 11:58 pm.", skill: "Asking for Help" },
      { goal: "Find the bug in your R code", icon: "bug", done: "It was a missing parenthesis.", skill: "Debugging" },
      { goal: "Finish the group project", icon: "people", done: "Everyone did their part. Eventually.", skill: "Teamwork" },
      { goal: "Pass the final exam", icon: "grade", done: "You checked the conditions first.", skill: "Statistical Thinking" },
    ],
    remarks: {
      e: "Email: you wrote 'Did I miss anything important on Tuesday?' +50",
      r: "Feedback: 'Good graph. Label the axes next time.' +50",
      k: "Coffee: awake for the 8 am class. +50",
      q: "Question: you asked one in class, and three classmates silently thanked you. +50",
    },
    endOfTerm: "Semester complete! You may now forget everything until August.",
  },
  instructor: {
    name: "Instructor",
    goals: [
      { goal: "Clear the inbox", icon: "envelope", done: "Zero unread. It will not last.", skill: "Time Management" },
      { goal: "Grade the stack of exams", icon: "grade", done: "The rubric held up.", skill: "Rubric Design" },
      { goal: "Respond to Reviewer 2", icon: "page", done: "'We thank the reviewer for this comment.'", skill: "Revising" },
      { goal: "Run the committee meeting", icon: "clock", done: "It ended on time. A first.", skill: "Running a Meeting" },
      { goal: "Submit the grant on time", icon: "coin", done: "Uploaded with four minutes to spare.", skill: "Grant Writing" },
    ],
    remarks: {
      e: "Email: you replied 'As stated in the syllabus...' +50",
      r: "Feedback: a course evaluation says 'Too much statistics for a statistics course.' +50",
      k: "Coffee: the real instructor of record. +50",
      q: "Question: 'Will this be on the exam?' Yes. Everything is on the exam. +50",
    },
    endOfTerm: "Semester complete! Grades are in. Sabbatical is only six years away.",
  },
};

// Said when a life is lost. One is picked at random.
export const LOST_REMARKS = [
  "The ball scrolled off the bottom of the sheet. Did you save?",
  "#N/A. That one got away.",
  "The ball was last seen heading for column ZZ.",
  "Missing value. Imputing a new ball.",
];

// Said when the ball leaves through a hole in a wall.
export const HOLE_REMARK = "The ball slipped out through a hidden column.";

// Said when the game ends.
export const GAME_OVER_REMARKS = [
  "The leaderboard is not graded on a curve.",
  "Remember: one bad semester is an outlier, not a trend.",
  "Your residuals were large, but your effort was significant.",
];

// Points.
// "bounce" is taken OFF the score every time the ball bounces off an
// edge or the paddle, so finishing quickly scores better.
export const POINTS = { cell: 10, merged: 20, picture: 50, goal: 300, levelBonus: 200, bounce: 1 };
