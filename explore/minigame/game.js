// minigame/game.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The rules and movement of Sheet Breaker: the ball, the paddle, the
// cells, lives and score. Drawing is in draw.js; the levels and all
// the words are in levels.js; the leaderboard is in scores.js.
//
// Everything here is measured in pixels from the top-left corner of
// the sheet (the play area), which is 192 wide and 160 tall:
//
//      0 ......................... 192
//    0 [ header: A B C ... L        ]   8 pixels tall
//    8 [ cells, 16 wide and 8 tall  ]
//      [                            ]
//      [          (ball)            ]
//  150 [        ==paddle==          ]
//  160 ....... bottom: ball lost ....
//
// main.js tells this file when to start, passes it the keys each
// frame, and is told (through "game.on...") when there is something to
// say or when the game ends.

import { LEVELS, MODES, LOST_REMARKS, HOLE_REMARK, GAME_OVER_REMARKS, POINTS } from "./levels.js";

// ---- Sizes and speeds: the knobs ------------------------------------------
export const SHEET_WIDTH = 192;
export const SHEET_HEIGHT = 160;
export const HEADER_HEIGHT = 8; // the "A B C" bar; its bottom edge is the top wall
export const CELL_WIDTH = 16;
export const CELL_HEIGHT = 8;
export const PADDLE_Y = 150; // top edge of the paddle
export const PADDLE_WIDTH = 34;
export const PADDLE_HEIGHT = 4;
const PADDLE_SPEED = 170; // pixels per second
const BALL_START_SIZE = 2; // radius in pixels
const BALL_BIGGEST = 7; // skills stop making it bigger at this radius
const BALL_SPEED = 115; // pixels per second on level 1
const SPEED_PER_LEVEL = 10; // added for each level completed
const LIVES = 3;

// ---- The game's state: everything that changes while playing --------------
export const game = {
  // "idle"  nobody is playing; the sheet is a still display
  // "serve" the ball is sitting on the paddle, waiting to be launched
  // "play"  the ball is moving
  // "wait"  a message is on screen (between levels, or at game over)
  state: "idle",
  mode: "student",
  level: 0, // which of LEVELS, counting from 0
  levelsCleared: 0, // total so far; keeps counting when the levels repeat
  score: 0,
  lives: LIVES,
  paddleX: SHEET_WIDTH / 2, // centre of the paddle
  ball: { x: 0, y: 0, speedX: 0, speedY: 0, size: BALL_START_SIZE },
  cells: [], // rows of cells; see buildCells
  holes: [],
  remark: "", // the latest message, shown in the sheet's formula bar
  remarkChanged: true, // set whenever the message needs re-writing
  hudChanged: true, // set whenever the score line needs re-writing

  // main.js replaces these two. onMessage shows lines of text and
  // calls "then" when the player has read them; onGameOver is told the
  // final score.
  onMessage: (lines, then) => then(),
  onGameOver: () => {},
};

// Sets the still display shown when nobody is playing.
resetToStill();

function resetToStill() {
  game.state = "idle";
  game.remark = "Walk up to the front of the sheet to play.";
  game.remarkChanged = true;
  game.level = 0;
  game.paddleX = SHEET_WIDTH / 2;
  game.ball.size = BALL_START_SIZE;
  loadLevel();
  ballOntoPaddle();
}

// ---- Starting, launching and quitting -------------------------------------
export function startGame(mode) {
  game.mode = mode;
  game.level = 0;
  game.levelsCleared = 0;
  game.score = 0;
  game.lives = LIVES;
  game.ball.size = BALL_START_SIZE;
  game.paddleX = SHEET_WIDTH / 2;
  loadLevel();
  ballOntoPaddle();
  game.state = "serve";
  say("Press Space to launch the ball.");
  game.hudChanged = true;
}

// Enter or Space: launch the ball if it is waiting on the paddle.
export function gameAction() {
  if (game.state !== "serve") return;
  const speed = ballSpeed();
  // Launch up and slightly to one side, so it does not go straight
  // up and down for ever. Math.random() < 0.5 is a coin toss.
  const sideways = (Math.random() < 0.5 ? -1 : 1) * 0.35;
  game.ball.speedX = speed * sideways;
  game.ball.speedY = -speed * Math.sqrt(1 - sideways * sideways);
  game.state = "play";
  say(`Break the gold cell to: ${currentGoal().goal.toLowerCase()}.`);
}

// Escape: stop playing. The score so far still counts.
export function quitGame() {
  if (game.state === "idle") return;
  endGame("You closed the spreadsheet without saving.");
}

export function gameIsActive() {
  return game.state !== "idle";
}

// The score line shown in the strip above the map.
export function hudText() {
  const hearts = "♥".repeat(game.lives) + "♡".repeat(LIVES - game.lives);
  return {
    title: `Sheet Breaker · ${MODES[game.mode].name} · Level ${game.levelsCleared + 1} · Score ${game.score.toLocaleString()} · ${hearts}`,
    description: `Goal: ${game.state === "idle" ? "" : currentGoal().goal}. Arrow keys or A and D move, Space launches, Esc quits. Each bounce costs a point.`,
  };
}

// ---- One frame of the game -------------------------------------------------
// seconds = time since the last frame; input = the keys held (input.js)
export function updateGame(seconds, input) {
  if (game.state !== "serve" && game.state !== "play") return;

  // The paddle follows the left and right keys, staying on the sheet.
  game.paddleX += input.horizontal() * PADDLE_SPEED * seconds;
  const half = PADDLE_WIDTH / 2;
  game.paddleX = Math.max(half, Math.min(SHEET_WIDTH - half, game.paddleX));

  if (game.state === "serve") {
    ballOntoPaddle(); // the waiting ball rides on the paddle
    return;
  }

  // Move the ball in small steps of at most 2 pixels. One big step
  // could carry a fast ball right through a thin cell without the
  // game ever seeing them touch.
  const distance = Math.hypot(game.ball.speedX, game.ball.speedY) * seconds;
  const steps = Math.max(1, Math.ceil(distance / 2));
  for (let i = 0; i < steps && game.state === "play"; i++) {
    stepBall(seconds / steps);
  }
}

function stepBall(seconds) {
  const ball = game.ball;

  // Sideways first, then up/down, checking for a hit after each. Doing
  // them separately tells us which way to bounce: a hit while moving
  // sideways turns the ball back sideways, and so on.
  ball.x += ball.speedX * seconds;
  if (hitSomething("sideways")) {
    ball.x -= ball.speedX * seconds; // step back out
    ball.speedX = -ball.speedX; // and bounce
  }

  ball.y += ball.speedY * seconds;
  if (hitSomething("vertical")) {
    ball.y -= ball.speedY * seconds;
    ball.speedY = -ball.speedY;
  }
  if (game.state !== "play") return; // that hit finished the level

  bounceOffPaddle();

  // Gone? Off the bottom, or out through a hole in a wall.
  const margin = ball.size + 6;
  const offBottom = ball.y > SHEET_HEIGHT + margin;
  const outOfHole = ball.x < -margin || ball.x > SHEET_WIDTH + margin || ball.y < HEADER_HEIGHT - margin;
  if (offBottom || outOfHole) loseLife(outOfHole);
}

// Is the ball touching a wall or a cell? If it is a cell, the cell is
// hit. "direction" says which way the ball was just moved.
function hitSomething(direction) {
  const ball = game.ball;
  const left = ball.x - ball.size;
  const right = ball.x + ball.size;
  const top = ball.y - ball.size;
  const bottom = ball.y + ball.size;

  // Walls. A wall does not stop the ball where it has a hole.
  // Bouncing off an edge costs a point (see bouncePenalty).
  if (direction === "sideways") {
    if (left < 0 && ball.speedX < 0 && !inHole("left", ball.y)) return bouncePenalty();
    if (right > SHEET_WIDTH && ball.speedX > 0 && !inHole("right", ball.y)) return bouncePenalty();
  } else if (top < HEADER_HEIGHT && ball.speedY < 0 && !inHole("top", ball.x)) {
    return bouncePenalty();
  }

  // Once the ball is part-way through a hole it is outside the sheet,
  // where there are no cells to hit.
  if (left < 0 || right > SHEET_WIDTH || top < HEADER_HEIGHT) return false;

  // Cells: look only at the few the ball's square overlaps.
  const firstCol = Math.floor(left / CELL_WIDTH);
  const lastCol = Math.floor(right / CELL_WIDTH);
  const firstRow = Math.floor((top - HEADER_HEIGHT) / CELL_HEIGHT);
  const lastRow = Math.floor((bottom - HEADER_HEIGHT) / CELL_HEIGHT);
  for (let row = firstRow; row <= lastRow; row++) {
    for (let col = firstCol; col <= lastCol; col++) {
      const cell = (game.cells[row] || [])[col];
      if (cell) {
        hitCell(cell, row, col);
        return true;
      }
    }
  }
  return false;
}

// Every bounce off an edge or the paddle takes a point off the score
// (never below zero), so a quick, well-aimed game beats a long one.
// Returns true so it can be used where "yes, the ball hit" is needed.
function bouncePenalty() {
  if (game.score > 0) {
    game.score = Math.max(0, game.score - POINTS.bounce);
    game.hudChanged = true;
  }
  return true;
}

// Is this position along a wall inside one of the level's holes?
function inHole(wall, position) {
  return game.holes.some(([holeWall, from, to]) => holeWall === wall && position >= from && position <= to);
}

function hitCell(cell, row, col) {
  if (cell.kind === "#") return; // a #REF! cell: it bounces the ball and that is all

  cell.hits--;
  if (cell.hits > 0) return; // cracked but still there

  game.cells[row][col] = null; // broken: remove it

  if (cell.kind === "G") {
    game.score += POINTS.goal;
    completeLevel();
  } else if (cell.kind === "m") {
    game.score += POINTS.merged;
  } else if (cell.kind === "c") {
    game.score += POINTS.cell;
  } else {
    // A cell with a picture: bonus points and a remark.
    game.score += POINTS.picture;
    say(MODES[game.mode].remarks[cell.kind]);
  }
  game.hudChanged = true;
}

// The paddle sends the ball back up. Where the ball lands on the
// paddle decides the angle: the middle sends it straight up, the ends
// send it off to that side. This is what lets the player aim.
function bounceOffPaddle() {
  const ball = game.ball;
  if (ball.speedY <= 0) return; // only when the ball is coming down
  const touching =
    ball.y + ball.size >= PADDLE_Y &&
    ball.y - ball.size <= PADDLE_Y + PADDLE_HEIGHT &&
    Math.abs(ball.x - game.paddleX) <= PADDLE_WIDTH / 2 + ball.size;
  if (!touching) return;

  // -1 at the left end of the paddle, 0 in the middle, +1 at the right end.
  const where = Math.max(-1, Math.min(1, (ball.x - game.paddleX) / (PADDLE_WIDTH / 2)));
  const angle = where * (Math.PI / 3); // up to 60 degrees from straight up
  const speed = ballSpeed();
  ball.speedX = speed * Math.sin(angle);
  ball.speedY = -speed * Math.cos(angle);
  ball.y = PADDLE_Y - ball.size; // sit exactly on top, so it cannot stick
  bouncePenalty();
}

// ---- Losing a life, finishing a level, and the end -------------------------
function loseLife(throughHole) {
  game.lives--;
  game.hudChanged = true;
  if (game.lives <= 0) {
    endGame("That was your last ball.");
    return;
  }
  say(`${throughHole ? HOLE_REMARK : pickOne(LOST_REMARKS)} Press Space to launch.`);
  ballOntoPaddle();
  game.state = "serve";
}

function completeLevel() {
  const done = currentGoal();
  game.score += POINTS.levelBonus * (game.levelsCleared + 1);
  game.levelsCleared++;

  // Every skill makes the ball bigger, up to a limit.
  const grew = game.ball.size < BALL_BIGGEST;
  if (grew) game.ball.size++;

  const lines = [
    `Goal complete: ${done.goal}!`,
    `New skill: ${done.skill}. ${grew ? "Your ball grows." : "Your ball is already as big as it gets."}`,
  ];

  // After the last level the levels start again, faster.
  game.level++;
  if (game.level >= LEVELS.length) {
    game.level = 0;
    game.score += 2000;
    lines.push(`${MODES[game.mode].endOfTerm} Bonus: 2,000 points. A new, faster semester begins.`);
  }

  game.state = "wait";
  game.onMessage(lines, () => {
    loadLevel();
    ballOntoPaddle();
    game.state = "serve";
    say("Press Space to launch the ball.");
    game.hudChanged = true;
  });
}

function endGame(why) {
  const finalScore = game.score;
  const mode = game.mode;
  game.state = "wait";
  game.onMessage([`${why} Game over.`, `Final score: ${finalScore.toLocaleString()}. ${pickOne(GAME_OVER_REMARKS)}`], () => {
    resetToStill();
    game.onGameOver(finalScore, mode);
  });
}

// ---- Small helpers -----------------------------------------------------------
// Puts a message in the formula bar.
function say(message) {
  game.remark = message;
  game.remarkChanged = true;
}

function currentGoal() {
  return MODES[game.mode].goals[game.level];
}

function ballSpeed() {
  return BALL_SPEED + SPEED_PER_LEVEL * game.levelsCleared;
}

function ballOntoPaddle() {
  game.ball.x = game.paddleX;
  game.ball.y = PADDLE_Y - game.ball.size;
  game.ball.speedX = 0;
  game.ball.speedY = 0;
}

// Turns the current level's text (see levels.js) into cells:
// game.cells[row][col] is null for an empty space, or
// { kind: the letter from the text, hits: how many more hits it takes }.
function loadLevel() {
  const level = LEVELS[game.level];
  const hitsNeeded = { m: 2, G: 3 }; // everything else takes 1
  game.cells = level.sheet.map((rowText) =>
    [...rowText].map((letter) => (letter === "." ? null : { kind: letter, hits: hitsNeeded[letter] || 1 }))
  );
  game.holes = level.holes;
}

function pickOne(list) {
  return list[Math.floor(Math.random() * list.length)];
}
