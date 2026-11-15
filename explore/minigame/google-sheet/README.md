# Shared scores for Sheet Breaker (Google Sheet)

*Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
Claude could not run Google Apps Script, so these steps and `Code.gs` have not
been test-run. Step 5 is how to check they work.*

Out of the box, Sheet Breaker keeps scores in each visitor's own browser.
Follow these steps once and every finished game is added to a Google Sheet
instead, so the leaderboards, the histogram and the CSV download show
everyone's games.

## What gets stored

One row per finished game: the date and time, the mode (student or
instructor), the three-character code the player typed (blank if they did not
make the top five and gave no initials), and the score. Nothing else.

## Set-up (about ten minutes, once)

1. **Make the sheet.** In Google Drive, create a new Google Sheet. Name it
   something like "Sheet Breaker scores".
2. **Add the script.** In the sheet, choose **Extensions > Apps Script**.
   Delete whatever is in the editor, paste in the whole of `Code.gs` from this
   folder, and click the save icon.
3. **Publish it.** Click **Deploy > New deployment**. Click the gear icon and
   choose **Web app**. Set:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**

   Click **Deploy**. Google will ask you to authorise the script to edit this
   spreadsheet; allow it. (You may see an "unverified app" screen, because the
   script is your own: choose Advanced, then continue.)
4. **Copy the web app address.** It ends in `/exec`. Open
   `explore/minigame/scores-config.js` and paste it between the quotation
   marks:

   ```js
   export const SCORES_URL = "https://script.google.com/macros/s/.../exec";
   ```

   Render, commit and push as usual.
5. **Check it.** Paste the address into a browser. You should see
   `{"games":[]}`. Then play a game on the site to the end: a row should
   appear in the sheet's `scores` tab within a few seconds.

## Things to know

- **The address is public.** It is in the site's code, so someone determined
  could send made-up scores. The script ignores anything that is not a
  plausible score, and you can delete rows from the sheet at any time: the
  site shows whatever the sheet holds.
- **If Google cannot be reached,** the game still works and falls back to the
  scores kept in the visitor's browser.
- **Changing the script later.** After editing `Code.gs` in the Apps Script
  editor, choose **Deploy > Manage deployments**, edit the deployment and pick
  **New version**. The address stays the same.
- **Starting over.** Delete the rows below the header in the `scores` tab.
- **Turning it off.** Set `SCORES_URL` back to `""`.
