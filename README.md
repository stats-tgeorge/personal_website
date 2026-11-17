# personal_website

Tyler George's professional website: courses, student support, blog and CV.
Live at <https://stats-tgeorge.github.io/personal_website/>.

The site has two ways in, offered on the landing page:

- **The regular website**: ordinary Quarto pages.
- **Explore mode**: an optional small game in which you walk around a
  campus to reach the same content. It adds nothing that the regular
  site lacks; every room reads its words from the regular pages.

*This README was written by Claude (an AI model made by Anthropic) at
Tyler George's direction. Explore mode's code and its placeholder art
were also written by Claude; see [explore/README.md](explore/README.md).*

## Updating the site

The routine is the same as for any Quarto site:

1. Edit the `.qmd` files in RStudio.
2. Preview with `quarto preview` (or render with `quarto render`) in the
   terminal.
3. Commit and push with GitHub Desktop.

Pushing to the `main` branch publishes the site. A GitHub Action
(`.github/workflows/publish.yml`) renders it and puts the result on the
`gh-pages` branch, which is what GitHub Pages serves. Two settings must
stay as they are for that to work: the repository is public, and
**Settings > Pages** publishes from the `gh-pages` branch, `/ (root)`.

Larger changes have been made on a separate branch and merged into
`main` by pull request on github.com, so that `main` only ever holds
work that has been checked.

## What is where

| File or folder | What it is |
|---|---|
| `index.qmd` | The landing page: the choice between the two routes, and the line for students |
| `about.qmd` | About page: bio, contact links, office |
| `teaching.qmd` | One `###` section per course, and the "Courses at a Glance" table at the end |
| `course-support.qmd` | Student Support page |
| `student-questions.csv` | The "Questions students ask" (see below) |
| `student-questions.lua` | The small add-on that turns that CSV into boxes on the Student Support page |
| `Blog.qmd`, `blogs/` | The blog's list page and its posts |
| `cv.qmd` | The CV. Renders as a web page and as `cv.pdf` |
| `Tyler_George_CV_23.pdf`, `Tyler_George_CV_25.pdf` | Older CVs, kept as they were |
| `explore.qmd` | The page explore mode lives on |
| `explore-world.yml` | The buildings in explore mode: name, page and blurb for each |
| `explore/` | Explore mode's code. Its own README explains it |
| `_quarto.yml` | Site settings: the navbar, theme and link colour |
| `styles.css` | Site-wide styles (link underlines, the Bluesky icon) |
| `img/` | Pictures used by the pages |
| `_extensions/` | The Font Awesome icons add-on for Quarto |
| `_freeze/` | Quarto's saved results of code in pages. Leave it alone and commit it |
| `_talks.qmd`, `_student_work_showcase.qmd`, `_teaching_ped.qmd` | Unfinished pages. The leading underscore stops Quarto publishing them; remove it to publish one |

## Things that are easy to forget

**Questions students ask.** Edit `student-questions.csv` (two columns,
`question` and `answer`; an answer containing a comma must be in double
quotes, which Excel and R's `write.csv()` do for you) and render. The
Student Support page and the people on explore mode's Support Trail
both update. `student-questions.lua` should not need opening.

**Office hours.** The sentence "See your course syllabus for current
office hours..." is written in three places: `index.qmd`, `about.qmd`
and `course-support.qmd`. It is also the first answer in
`student-questions.csv`. Change all four together.

**A new course.** Add a `###` section to `teaching.qmd` and a row to the
table at the end. In explore mode the Classroom gains a desk on its own.
A course whose section has a logo that links to its website
(`[![](img/logo.png)](https://...)`) also gets a portal.

**Headings matter to explore mode.** Rooms are filled from the headings
of the regular pages, so renaming or removing a heading changes a room.
The rules are in [explore/README.md](explore/README.md). The regular
site is never affected by anything in `explore/`.

**Unpublishing a page.** Rename it with a leading underscore.

## Credits and licences

- Site content and design: Tyler George.
- Explore mode code and placeholder art: written by Claude, an AI model
  made by Anthropic, at Tyler George's direction. The art is drawn by
  the code; no image files were taken from elsewhere.
- The R logo (`explore/img/Rlogo.svg`) is © 2016 The R Foundation, used
  under the [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
  licence.
- `explore/vendor/js-yaml.js` is the js-yaml library, MIT licence.
- Icons: Bootstrap Icons (shipped with Quarto, MIT) and Font Awesome
  Free (in `_extensions/`).
