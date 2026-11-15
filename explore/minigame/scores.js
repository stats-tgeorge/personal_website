// minigame/scores.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// Sheet Breaker's scores: a record of every finished game, from which
// come the two leaderboards (students, instructors), the histogram of
// all scores, and the CSV download.
//
// WHERE THE SCORES LIVE. This site is plain files with no server of
// its own, so there are two possibilities:
//   - Shared: if scores-config.js holds the address of the Google
//     Sheet web app (see google-sheet/README.md), every finished game
//     is sent there and the boards show everyone's games.
//   - Local: otherwise (or if Google cannot be reached) scores are
//     kept in the visitor's own browser, and the boards show only the
//     games played on that device.

import { SCORES_URL } from "./scores-config.js";

const STORAGE_NAME = "sheetBreakerGames3";
const TOP_HOW_MANY = 5; // each leaderboard shows this many
const KEEP_LOCALLY = 1000; // remember at most this many games in the browser

// One finished game is { mode, code, score, when }:
//   mode   "student" or "instructor"
//   code   the three letters or numbers the player gave ("" if none)
//   score  the final score
//   when   the date and time it finished (text)
let games = loadLocal(); // the games being shown: local at first, shared once fetched
let shared = false; // true once the shared list has been fetched

function loadLocal() {
  // Browser storage can be switched off or full, and using it then
  // fails. A game should shrug that off, so every use is wrapped in
  // try/catch and falls back to "no scores".
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_NAME));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveLocal(game) {
  try {
    const mine = loadLocal();
    mine.push(game);
    window.localStorage.setItem(STORAGE_NAME, JSON.stringify(mine.slice(-KEEP_LOCALLY)));
  } catch (error) {
    // Could not save (storage off or full). The game carries on.
  }
}

// Fetches everyone's games from the Google Sheet, if one is set up.
// The stall calls this when the page opens and after each game. If it
// fails, the local games carry on being used.
export async function refreshScores() {
  if (!SCORES_URL) return;
  try {
    const response = await fetch(SCORES_URL);
    const data = await response.json();
    if (Array.isArray(data.games)) {
      games = data.games;
      shared = true;
    }
  } catch (error) {
    console.warn("Sheet Breaker: could not fetch the shared scores; showing this browser's.", error);
  }
}

// Records a finished game: here, in the browser, and (if set up) in
// the Google Sheet. Games that end with nothing scored are left out.
// It returns a "promise", so the caller can wait until the sheet has
// the score before fetching the shared list again.
export async function recordGame(mode, code, score) {
  if (score <= 0) return;
  const game = { mode, code, score, when: new Date().toISOString() };
  games.push(game);
  saveLocal(game);

  if (SCORES_URL) {
    // Sent as plain text because that is the kind of message a browser
    // will post to another website without asking it first; the
    // script on the other end reads it as JSON all the same.
    try {
      await fetch(SCORES_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ mode, code, score }),
      });
    } catch (error) {
      console.warn("Sheet Breaker: could not send the score to the shared sheet.", error);
    }
  }
}

// One mode's games, best first.
function ranked(mode) {
  return games.filter((game) => game.mode === mode).sort((a, b) => b.score - a.score);
}

// Would this score make it onto that mode's leaderboard?
export function isHighScore(mode, score) {
  const top = ranked(mode).slice(0, TOP_HOW_MANY);
  return score > 0 && (top.length < TOP_HOW_MANY || score > top[top.length - 1].score);
}

// A leaderboard as lines of text, for the board beside the game.
export function leaderboardLines(mode) {
  const top = ranked(mode).slice(0, TOP_HOW_MANY);
  if (top.length === 0) return ["No scores yet.", "Be the first!"];
  return top.map((game, i) => `${i + 1}. ${game.code || "---"} ${Number(game.score).toLocaleString()}`);
}

// A sentence saying whose games these are.
function whoseGames() {
  return shared
    ? "These are the games of everyone who has played on this site."
    : "Scores are kept in this browser only, so this shows the games played on this device.";
}

// A histogram of every recorded score for a mode, as HTML for the
// large reader: one bar per range of scores, with the counts written
// above the bars so it can be read without seeing them. It ends with
// a button that downloads the same scores (see scoresAsCsv).
export function histogramHtml(mode) {
  const scores = ranked(mode).map((game) => Number(game.score));
  const note = `<p class="poster-source">${whoseGames()}</p>`;
  if (scores.length === 0) return `<p>No games have been finished yet. Yours could be the first bar.</p>${note}`;

  // Eight equal ranges from 0 up to a round number above the best score.
  const BINS = 8;
  const highest = scores[0];
  const binWidth = Math.max(100, Math.ceil((highest + 1) / BINS / 100) * 100); // a multiple of 100
  const counts = new Array(BINS).fill(0);
  for (const score of scores) counts[Math.min(BINS - 1, Math.floor(score / binWidth))]++;
  const tallest = Math.max(...counts);

  // The middle score: half of the games scored more, half less.
  const median = scores[Math.floor(scores.length / 2)];

  const bars = counts
    .map((count, i) => {
      const from = (i * binWidth).toLocaleString();
      const to = ((i + 1) * binWidth).toLocaleString();
      const height = Math.round((count / tallest) * 100); // percent of the tallest bar
      return `<div class="histogram-bin" title="${from} to ${to}: ${count}">
          <span class="histogram-count">${count}</span>
          <span class="histogram-bar" style="height: ${height}%"></span>
          <span class="histogram-label">${from}</span>
        </div>`;
    })
    .join("");

  return `
    <p>${scores.length} finished game${scores.length === 1 ? "" : "s"}. Middle score (median): ${median.toLocaleString()}. Best: ${highest.toLocaleString()}.</p>
    <div class="histogram" role="img" aria-label="Histogram of final scores">${bars}</div>
    <p class="histogram-axis">Final score (each bar covers ${binWidth.toLocaleString()} points, starting at the number shown)</p>
    <p><button class="btn download-scores" type="button" data-mode="${mode}">Download these scores (CSV)</button></p>
    ${note}`;
}

// One mode's games as the text of a CSV file (a table that opens in
// R, Excel or Google Sheets): a header row, then one row per game.
export function scoresAsCsv(mode) {
  const rows = ranked(mode).map((game) => [game.mode, game.code || "", game.score, game.when || ""].join(","));
  return ["mode,code,score,when", ...rows].join("\n") + "\n";
}
