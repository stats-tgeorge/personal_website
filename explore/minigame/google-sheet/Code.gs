// google-sheet/Code.gs
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
// NOTE: Claude could not run Google Apps Script when writing this, so
// it has not been test-run. See README.md in this folder for how to
// set it up and how to check it works.
//
// This is NOT part of the website's own code. It is a small script to
// paste into a Google Sheet (Extensions > Apps Script) so that the
// sheet can receive Sheet Breaker scores from the site and hand them
// back. The site never sees the sheet itself, only this script.
//
// The sheet gets one row per finished game: when, mode, code, score.

// The name of the tab the scores go in. The script creates it if needed.
var TAB_NAME = "scores";

// The most games to send back to the site in one go (the newest ones).
var MOST_TO_SEND = 5000;

// Finds the scores tab, creating it (with a header row) the first time.
function scoresTab() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var tab = book.getSheetByName(TAB_NAME);
  if (!tab) {
    tab = book.insertSheet(TAB_NAME);
    tab.appendRow(["when", "mode", "code", "score"]);
  }
  return tab;
}

// Wraps something as the JSON text the site expects.
function asJson(something) {
  return ContentService.createTextOutput(JSON.stringify(something)).setMimeType(ContentService.MimeType.JSON);
}

// The site ASKS for the scores (when the page opens, and after a game).
// Sends back { games: [{ mode, code, score, when }, ...] }.
function doGet() {
  var rows = scoresTab().getDataRange().getValues();
  rows.shift(); // drop the header row
  var games = rows.slice(-MOST_TO_SEND).map(function (row) {
    return { when: row[0], mode: row[1], code: String(row[2]), score: Number(row[3]) };
  });
  return asJson({ games: games });
}

// The site SENDS a finished game: { mode, code, score }.
// Anything that does not look like a real score is ignored, because
// this address is public and anyone could send anything to it.
function doPost(request) {
  var game;
  try {
    game = JSON.parse(request.postData.contents);
  } catch (error) {
    return asJson({ ok: false, why: "not JSON" });
  }

  var mode = String(game.mode);
  var code = String(game.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
  var score = Math.round(Number(game.score));

  var modeIsKnown = mode === "student" || mode === "instructor";
  var scoreIsSensible = score > 0 && score <= 1000000;
  if (!modeIsKnown || !scoreIsSensible) return asJson({ ok: false, why: "not a valid score" });

  // The lock stops two games that finish at the same moment from
  // writing over each other.
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    scoresTab().appendRow([new Date(), mode, code, score]);
  } finally {
    lock.releaseLock();
  }
  return asJson({ ok: true });
}
