// page-reader.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// Reads one of the site's ordinary rendered pages (for example
// teaching.html) and pulls out its headings and the content under them.
//
// This is how rooms get their content WITHOUT a second copy of it: the
// Classroom shows whatever the Teaching page says today. The price is
// that the pages need a predictable shape. The rules are:
//
//   - Each thing in a room is one heading on the page (which heading
//     level depends on the room; the Classroom uses ### headings).
//   - Everything under the heading is what "Read more" shows, and its
//     first paragraphs are the short description in the small pop-up.
//   - A picture that links to another website becomes a "door to
//     another world":   [![](img/preview.png)](https://other-site...)

// pageUrl = full address of the rendered page, e.g. ".../teaching.html"
// level   = heading level to collect: 2 for "##", 3 for "###"
// Returns:
//   { html,       the whole page's content, for reading in the game
//     sections }  a list like
//                 [{ title, text, html, url, portal: { url, image } or null }, ...]
export async function readPage(pageUrl, level) {
  const response = await fetch(pageUrl);
  if (!response.ok) throw new Error(`Could not load ${pageUrl} (${response.status})`);

  // Turn the page's HTML text into something we can search, the same
  // way the browser does when it shows a page.
  const page = new DOMParser().parseFromString(await response.text(), "text/html");

  // Addresses on the page are written relative to that page
  // ("img/logo.png", "cv.html"). Shown inside the game they would
  // point to the wrong place, so make every one a full address. Links
  // are also set to open in a new tab, so following one never throws
  // the visitor out of the game.
  for (const picture of page.querySelectorAll("img[src]")) {
    picture.setAttribute("src", new URL(picture.getAttribute("src"), pageUrl).href);
  }
  for (const link of page.querySelectorAll("a[href]")) {
    link.setAttribute("href", new URL(link.getAttribute("href"), pageUrl).href);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener");
  }

  // Quarto wraps each heading and its content in
  // <section class="level3"> (the number is the heading level).
  const sections = [...page.querySelectorAll(`section.level${level}`)].map((section) => {
    const heading = section.querySelector(`h${level}`);

    // The short description: the paragraphs under this heading,
    // skipping any paragraph that is only a picture. Paragraphs under
    // a smaller heading inside this one are left out: "closest" finds
    // the nearest section a paragraph sits in, which must be this one.
    // (Paragraphs inside a column layout still count.)
    const paragraphs = [...section.querySelectorAll("p")]
      .filter((paragraph) => paragraph.closest("section") === section)
      .map((paragraph) => paragraph.textContent.trim())
      .filter((text) => text.length > 0);

    // The full content for "Read more": the section without its
    // heading (the reader shows the title in its own bar). The copy is
    // made so that removing the heading does not disturb the page.
    const copy = section.cloneNode(true);
    const copiedHeading = copy.querySelector(`h${level}`);
    if (copiedHeading) copiedHeading.remove();

    return {
      title: heading ? heading.textContent.trim() : "(untitled)",
      text: paragraphs.join(" "),
      html: copy.innerHTML,
      // The page address plus "#section-name" jumps straight to this heading.
      url: section.id ? `${pageUrl}#${section.id}` : pageUrl,
      portal: findPortal(section),
    };
  });

  // The page's own content, without the navigation bar, title and footer.
  const main = page.querySelector("main");
  const titleBlock = main ? main.querySelector("#title-block-header") : null;
  if (titleBlock) titleBlock.remove();

  return { html: main ? main.innerHTML : "", sections };
}

// Looks for a picture that links to another website.
// Returns { url, image } or null if the section has none.
function findPortal(section) {
  const picture = section.querySelector('a[href^="http"] img');
  if (!picture) return null;
  const link = picture.closest("a");
  // Links to other pages of THIS site also start with "http" by now
  // (see above), so check that the link really goes somewhere else.
  if (new URL(link.href).host === window.location.host) return null;
  return { url: link.getAttribute("href"), image: picture.getAttribute("src") };
}

// Shortens long text for a pop-up, cutting at the end of a word.
export function shorten(text, maxLength = 240) {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}
