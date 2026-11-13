// minigame/scores.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The Sheet Breaker scores: a leaderboard for each way of playing
// (student, instructor), and a record of every finished game's score
// so the spread of scores can be shown as a histogram.
//
// IMPORTANT: this site is made of plain files with no server behind
// it, so there is nowhere shared to keep scores. They are kept in the
// visitor's own browser ("localStorage"), which means each visitor
// sees only the games played on that device. Scores shared between
// all visitors would need a small online service to hold them.

const STORAGE_NAME = "sheetBreakerScores2";
const TOP_HOW_MANY = 5; // each leaderboard keeps this many
const ALL_HOW_MANY = 1000; // remember at most this many past scores per mode

// What is stored, for each mode:
//   top  the leaderboard, best first: [{ code: "ABC", score: 1240 }, ...]
//   all  every finished game's score, oldest first: [320, 1240, ...]
function emptyRecord() {
  return { student: { top: [], all: [] }, instructor: { top: [], all: [] } };
}

function load() {
  // Browser storage can be switched off or full, and using it then
  // fails. A game should shrug that off, so every use is wrapped in
  // try/catch and falls back to "no scores".
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_NAME));
    return saved && saved.student && saved.instructor ? saved : emptyRecord();
  } catch (error) {
    return emptyRecord();
  }
}

function save(record) {
  try {
    window.localStorage.setItem(STORAGE_NAME, JSON.stringify(record));
  } catch (error) {
    // Could not save (storage off or full). The game carries on.
  }
}

// Notes a finished game's score, for the histogram. (Games that end
// with nothing scored are left out.)
export function recordFinalScore(mode, score) {
  if (score <= 0) return;
  const record = load();
  record[mode].all.push(score);
  record[mode].all = record[mode].all.slice(-ALL_HOW_MANY); // keep the most recent
  save(record);
}

// Would this score make it onto that mode's leaderboard?
export function isHighScore(mode, score) {
  const top = load()[mode].top;
  return score > 0 && (top.length < TOP_HOW_MANY || score > top[top.length - 1].score);
}

// Adds a score to a leaderboard.
// code = the three letters or numbers the player typed.
export function saveHighScore(mode, code, score) {
  const record = load();
  record[mode].top.push({ code, score });
  record[mode].top.sort((a, b) => b.score - a.score); // best first
  record[mode].top = record[mode].top.slice(0, TOP_HOW_MANY);
  save(record);
}

// A leaderboard as lines of text, for the board beside the game.
export function leaderboardLines(mode) {
  const top = load()[mode].top;
  if (top.length === 0) return ["No scores yet.", "Be the first!"];
  return top.map((entry, i) => `${i + 1}. ${entry.code}  ${entry.score.toLocaleString()}`);
}

// A histogram of every recorded score for a mode, as HTML for the
// large reader: one bar per range of scores, with the counts written
// underneath so it can be read without seeing the bars.
export function histogramHtml(mode) {
  const scores = load()[mode].all;
  const note = `<p class="poster-source">Scores are kept in this browser only, so this shows the games played on this device.</p>`;
  if (scores.length === 0) return `<p>No games have been finished yet. Yours could be the first bar.</p>${note}`;

  // Eight equal ranges from 0 up to a round number above the best score.
  const BINS = 8;
  const highest = Math.max(...scores);
  const binWidth = Math.max(100, Math.ceil(highest / BINS / 100) * 100); // a multiple of 100
  const counts = new Array(BINS).fill(0);
  for (const score of scores) counts[Math.min(BINS - 1, Math.floor(score / binWidth))]++;
  const tallest = Math.max(...counts);

  // The middle score: half of the games scored more, half less.
  const sorted = [...scores].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

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
    ${note}`;
}
