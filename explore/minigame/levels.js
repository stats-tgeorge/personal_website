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
//   G  the goal cell              (3 hits; breaking it ends the level)
//
// "holes" are gaps in the edges that the ball can fly out through
// (losing a life): missing row numbers at the sides, or a missing
// column letter at the top. They start small (two rows, on level 3)
// and grow from level to level. Each is [wall, from, to]: the wall is "left",
// "right" or "top", and from/to are distances in pixels along that
// wall (down from the top for the side walls, across from the left for
// the top wall). The sheet is 192 pixels wide and 152 tall.
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
  },
];

// ---- The two ways to play -------------------------------------------------
// For each mode: its name, the goal and the skill earned on each level
// (in the same order as LEVELS), and what is said when a cell with a
// picture on it is broken.
export const MODES = {
  student: {
    name: "Student",
    goals: [
      { goal: "Finish the statistics homework", skill: "Data Moves" },
      { goal: "Email the professor before the deadline", skill: "Polite Persistence" },
      { goal: "Find the missing parenthesis in your R code", skill: "Debugging Eyes" },
      { goal: "Survive the group project", skill: "Diplomacy" },
      { goal: "Pass the final exam", skill: "Sampling Distribution Zen" },
    ],
    remarks: {
      e: "Email sent: 'Did I miss anything important on Tuesday?'",
      r: "Online review posted. Five stars for the dog photos.",
      k: "Coffee acquired. Probability of sleeping tonight: not significant.",
      q: "You asked a question in class. Three classmates silently thank you.",
    },
    endOfTerm: "Semester complete! You may now forget everything until August.",
  },
  instructor: {
    name: "Instructor",
    goals: [
      { goal: "Clear the inbox", skill: "Inbox Zero (it will not last)" },
      { goal: "Grade the stack of exams", skill: "Rubric Vision" },
      { goal: "Respond to Reviewer 2", skill: "Thick Skin" },
      { goal: "Sit through the committee meeting", skill: "This Could Have Been an Email" },
      { goal: "Submit the grant on time", skill: "Budget Justification" },
    ],
    remarks: {
      e: "Email sent: 'As stated in the syllabus...'",
      r: "Course evaluation received: 'Too much statistics for a statistics course.'",
      k: "Coffee. The real instructor of record.",
      q: "'Will this be on the exam?' Yes. Everything is on the exam.",
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
