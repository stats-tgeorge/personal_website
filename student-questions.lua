-- student-questions.lua
-- Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
--
-- This small file gives Quarto one new "shortcode":
--
--     {{< student-questions >}}
--
-- Wherever that line is written in a page (it is used on the Student
-- Support page), Quarto reads student-questions.csv and writes one
-- box per row: the question is the box's title, and clicking it shows
-- the answer.
--
-- TO CHANGE THE QUESTIONS: edit student-questions.csv (it opens in
-- RStudio, Excel or any text editor) and render the site as usual.
-- Nothing in this file needs to change. Explore mode's Support Trail
-- reads the finished page, so it picks up the same changes.
--
-- The CSV has two columns, "question" and "answer". An answer that
-- contains a comma must be inside "double quotes" (Excel and R's
-- write.csv() do this for you). Answers may use Markdown, such as
-- [a link](https://example.com).
--
-- This is written in Lua, the language Quarto itself uses for
-- add-ons like this. Lines starting with two dashes are comments.

-- Splits one line of a CSV file into its fields. A field in double
-- quotes may contain commas; two double quotes inside one ("") mean
-- a single quotation mark.
local function split_csv_line(line)
  local fields = {}
  local field = ""
  local in_quotes = false
  local i = 1
  while i <= #line do
    local char = line:sub(i, i)
    if in_quotes then
      if char == '"' and line:sub(i + 1, i + 1) == '"' then
        field = field .. '"'
        i = i + 1
      elseif char == '"' then
        in_quotes = false
      else
        field = field .. char
      end
    elseif char == '"' then
      in_quotes = true
    elseif char == "," then
      table.insert(fields, field)
      field = ""
    else
      field = field .. char
    end
    i = i + 1
  end
  table.insert(fields, field)
  return fields
end

return {
  ["student-questions"] = function(args, kwargs)
    -- collapse="true" (the default): each answer is hidden until its
    -- question is clicked. Write {{< student-questions collapse="false" >}}
    -- in the page to have every answer showing from the start.
    local collapse = pandoc.utils.stringify(kwargs["collapse"] or "")
    if collapse == "" then collapse = "true" end

    -- The CSV sits in the site's main folder.
    local folder = quarto.project.directory or "."
    local file = io.open(folder .. "/student-questions.csv", "r")
    if not file then
      return pandoc.Para({ pandoc.Str("(student-questions.csv was not found.)") })
    end

    -- Make one box per row. "quarto.Callout" is Quarto's own way of
    -- making the coloured boxes it calls callouts: the same thing as
    -- typing ::: {.callout-note collapse="true" title="..."} in a page.
    local boxes = pandoc.List()
    local first_line = true
    for line in file:lines() do
      line = line:gsub("\r$", "") -- files saved on Windows end lines differently
      if first_line then
        first_line = false -- the header row: "question,answer"
      elseif line:match("%S") then -- skip blank lines
        local fields = split_csv_line(line)
        local box = quarto.Callout({
          type = "note",
          title = pandoc.Inlines(pandoc.Str(fields[1] or "")),
          collapse = (collapse == "true"),
          -- The answer may contain Markdown (a link, say), so it is
          -- read as Markdown and not as plain text.
          content = pandoc.read(fields[2] or "", "markdown").blocks,
        })
        boxes:insert(box)
      end
    end
    file:close()

    return boxes
  end,
}
