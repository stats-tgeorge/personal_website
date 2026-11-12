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
//     sections,   a list like
//                 [{ title, text, html, url, portal, children }, ...]
//                 where portal is { url, image } or null, and children
//                 is the same kind of list for the next heading level
//     pictures }  the page's captioned pictures: [{ caption, image }, ...]
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
  const sections = [...page.querySelectorAll(`section.level${level}`)].map((section) =>
    describeSection(section, level, pageUrl)
  );

  // Pictures that have a caption, anywhere on the page (the family
  // photos on the About page). Quarto wraps each in a <figure>.
  const pictures = [...page.querySelectorAll("figure")]
    .map((figure) => {
      const picture = figure.querySelector("img");
      const caption = figure.querySelector("figcaption");
      return {
        caption: caption ? caption.textContent.trim() : "",
        image: picture ? picture.getAttribute("src") : null,
      };
    })
    .filter((picture) => picture.caption && picture.image);

  // The page's own content, without the navigation bar, title and footer.
  const main = page.querySelector("main");
  const titleBlock = main ? main.querySelector("#title-block-header") : null;
  if (titleBlock) titleBlock.remove();

  return { html: main ? main.innerHTML : "", sections, pictures };
}

// Describes one heading and what is under it. Also describes the
// next-smaller headings inside it, as "children" (the Hall uses this:
// each "##" category of the CV has "###" sections inside).
function describeSection(section, level, pageUrl) {
  const heading = section.querySelector(`h${level}`);

  // Does this piece of text sit directly under THIS heading, and not
  // under a smaller heading inside it? "closest" finds the nearest
  // section an element is in, which must be this one.
  const isOwn = (element) => element.closest("section") === section;

  // The short description comes from paragraphs and list items. A
  // list item inside another list item is skipped, because its text is
  // already part of the outer one; so is a paragraph inside a list item.
  const readText = (elements) =>
    elements
      .filter((element) => !element.parentElement.closest("li"))
      .map((element) => element.textContent.trim().replace(/\s+/g, " "))
      .filter((text) => text.length > 0);

  const everything = [...section.querySelectorAll("p, li")];
  const ownText = readText(everything.filter(isOwn));
  // Some headings have nothing directly under them, only smaller
  // headings ("## Academic support" on the Student Support page).
  // For those, fall back to the text under the smaller headings.
  const text = (ownText.length > 0 ? ownText : readText(everything)).join(" ");

  // The full content for "Read more": the section without its heading
  // (the reader shows the title in its own bar). The copy is made so
  // that removing the heading does not disturb the page.
  const copy = section.cloneNode(true);
  const copiedHeading = copy.querySelector(`h${level}`);
  if (copiedHeading) copiedHeading.remove();

  // The next-smaller headings directly inside this one.
  const children = [...section.children]
    .filter((child) => child.matches(`section.level${level + 1}`))
    .map((child) => describeSection(child, level + 1, pageUrl));

  return {
    title: heading ? heading.textContent.trim() : "(untitled)",
    text,
    html: copy.innerHTML,
    // The page address plus "#section-name" jumps straight to this heading.
    url: section.id ? `${pageUrl}#${section.id}` : pageUrl,
    portal: findPortal(section),
    children,
  };
}

// Reads a Quarto LISTING page (the Blog page) and returns its posts in
// the order the page shows them:
//   { html,    the whole page's content, for reading in the game
//     posts }  [{ title, text, date, url, image or null }, ...]
// It depends on the Blog page using Quarto's default listing layout,
// where each post is a box with the class "quarto-post".
export async function readListing(pageUrl) {
  const response = await fetch(pageUrl);
  if (!response.ok) throw new Error(`Could not load ${pageUrl} (${response.status})`);
  const page = new DOMParser().parseFromString(await response.text(), "text/html");

  const posts = [...page.querySelectorAll(".quarto-post")].map((post) => {
    const link = post.querySelector(".listing-title a, a[href]");
    const picture = post.querySelector("img");
    // Quarto sometimes keeps a picture's address in "data-src" so it
    // can load it late; use whichever is there.
    const pictureAddress = picture ? picture.getAttribute("src") || picture.getAttribute("data-src") : null;
    const textOf = (selector) => {
      const element = post.querySelector(selector);
      return element ? element.textContent.trim() : "";
    };
    return {
      title: textOf(".listing-title") || (link ? link.textContent.trim() : "(untitled)"),
      text: textOf(".listing-description"),
      date: textOf(".listing-date"),
      url: link ? new URL(link.getAttribute("href"), pageUrl).href : pageUrl,
      image: pictureAddress ? new URL(pictureAddress, pageUrl).href : null,
    };
  });

  // The same tidying as readPage: full addresses, links in a new tab.
  for (const picture of page.querySelectorAll("img")) {
    const address = picture.getAttribute("src") || picture.getAttribute("data-src");
    if (address) picture.setAttribute("src", new URL(address, pageUrl).href);
  }
  for (const link of page.querySelectorAll("a[href]")) {
    link.setAttribute("href", new URL(link.getAttribute("href"), pageUrl).href);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener");
  }
  const main = page.querySelector("main");
  const titleBlock = main ? main.querySelector("#title-block-header") : null;
  if (titleBlock) titleBlock.remove();

  return { html: main ? main.innerHTML : "", posts };
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
