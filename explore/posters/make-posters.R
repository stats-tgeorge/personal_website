# make-posters.R
# Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
# NOTE: Claude could not run R when writing this, so it has not been
# test-run. Please run it once and check the printed summaries and plots.
#
# Makes the full-size graphs for the wall posters in explore mode, from
# real teaching data sets, and saves each as a PNG in this folder
# (explore/posters/). The game shows these when a visitor stands below
# a poster and chooses "Look closer".
#
# HOW TO RUN: open the project in RStudio and run this whole script
# (Source), or in the terminal:  Rscript explore/posters/make-posters.R
# Then render and commit the PNG files like any other change.
#
# The file names below must match the "file:" entries in
# explore/posters.js. The script also prints the summary numbers that
# the tiny wall versions of the posters were drawn from (the pixel
# heights in posters.js), so the two can be compared.
#
# Packages: tidyverse, palmerpenguins, HistData
#   install.packages(c("tidyverse", "palmerpenguins", "HistData"))

library(tidyverse)
library(palmerpenguins)
library(HistData)

# Where to save: the folder this script lives in. When run from the
# project folder (the usual case) that is explore/posters.
out_dir <- "explore/posters"
if (!dir.exists(out_dir)) out_dir <- "."

# Colours: the Okabe-Ito palette, chosen to be distinguishable by
# people with colour-blindness. The same colours are used in the game.
blue   <- "#0072B2"
orange <- "#D55E00"
yellow <- "#E69F00"
green  <- "#009E73"
pink   <- "#CC79A7"

# One look for every poster.
theme_set(
  theme_minimal(base_size = 16) +
    theme(
      plot.title.position = "plot",
      plot.title = element_text(face = "bold"),
      panel.grid.minor = element_blank()
    )
)

# Saves the most recent plot at a size that suits the game's reader.
save_poster <- function(file) {
  ggsave(file.path(out_dir, file), width = 8, height = 6, dpi = 150, bg = "white")
}

# ---- Old Faithful eruptions (poster "h") --------------------------------
faithful_tbl <- as_tibble(faithful)

# The wall version: 12 bins of 0.3 minutes from 1.5 to 5.1.
faithful_tbl |>
  mutate(bin = cut(eruptions, breaks = seq(1.5, 5.1, by = 0.3), include.lowest = TRUE)) |>
  count(bin) |>
  print()

# The "Did you know?": average wait after short and long eruptions.
faithful_tbl |>
  mutate(kind = if_else(eruptions < 3, "short", "long")) |>
  summarise(n = n(), mean_wait = mean(waiting), .by = kind) |>
  print()

ggplot(faithful_tbl, aes(x = eruptions)) +
  geom_histogram(breaks = seq(1.5, 5.1, by = 0.3), fill = blue, colour = "white") +
  labs(
    title = "Old Faithful: how long eruptions last",
    subtitle = "272 eruptions, Yellowstone National Park",
    x = "Eruption length (minutes)", y = "Number of eruptions"
  )
save_poster("old-faithful.png")

# ---- Galton's heights (poster "q") --------------------------------------
galton_tbl <- as_tibble(Galton)

galton_tbl |> count(child) |> print(n = Inf)

ggplot(galton_tbl, aes(x = child)) +
  geom_histogram(binwidth = 1, fill = pink, colour = "white") +
  labs(
    title = "Galton's heights of 928 adult children",
    subtitle = "Collected by Francis Galton, published 1886",
    x = "Height (inches)", y = "Number of people"
  )
save_poster("galton-heights.png")

# ---- Car weight and fuel economy (poster "s") ---------------------------
cars_tbl <- mtcars |> rownames_to_column("car") |> as_tibble()

cars_tbl |> summarise(correlation = cor(wt, mpg)) |> print()
cars_tbl |> slice_max(mpg, n = 1) |> select(car, mpg) |> print()
cars_tbl |> slice_min(mpg, n = 2) |> select(car, mpg) |> print()

ggplot(cars_tbl, aes(x = wt * 1000, y = mpg)) +
  geom_smooth(method = "lm", se = TRUE, colour = "grey40", fill = "grey85") +
  geom_point(colour = orange, size = 3) +
  scale_x_continuous(labels = scales::label_comma()) +
  labs(
    title = "Heavier cars go fewer miles on a gallon",
    subtitle = "32 cars from Motor Trend magazine, 1974",
    x = "Weight (pounds)", y = "Miles per gallon"
  )
save_poster("car-weight-mpg.png")

# ---- Surviving the Titanic (poster "b") ---------------------------------
titanic_tbl <- as_tibble(Titanic) |>
  summarise(n = sum(n), .by = c(Class, Survived)) |>
  mutate(share = n / sum(n), .by = Class)

print(titanic_tbl)

titanic_tbl |>
  filter(Survived == "Yes") |>
  mutate(Class = fct_inorder(Class)) |>
  ggplot(aes(x = Class, y = share, fill = Class)) +
  geom_col(show.legend = FALSE) +
  geom_text(aes(label = scales::label_percent(accuracy = 1)(share)), vjust = -0.4, size = 6) +
  scale_y_continuous(labels = scales::label_percent(), limits = c(0, 1)) +
  scale_fill_manual(values = c(blue, yellow, green, pink)) +
  labs(
    title = "Who survived the Titanic?",
    subtitle = "Share of people aboard who survived, by class",
    x = NULL, y = "Survived"
  )
save_poster("titanic-survival.png")

# ---- Penguin flippers (poster "x") --------------------------------------
penguins |>
  drop_na(flipper_length_mm) |>
  summarise(
    n = n(),
    minimum = min(flipper_length_mm),
    lower_quartile = quantile(flipper_length_mm, 0.25),
    median = median(flipper_length_mm),
    upper_quartile = quantile(flipper_length_mm, 0.75),
    maximum = max(flipper_length_mm),
    .by = species
  ) |>
  print()

penguins |>
  drop_na(flipper_length_mm) |>
  ggplot(aes(x = species, y = flipper_length_mm, fill = species)) +
  geom_boxplot(show.legend = FALSE) +
  scale_fill_manual(values = c(blue, yellow, green)) +
  labs(
    title = "Penguin flipper length by species",
    subtitle = "Palmer Archipelago, Antarctica, 2007 to 2009",
    x = NULL, y = "Flipper length (mm)"
  )
save_poster("penguin-flippers.png")

# ---- Airline passengers (poster "t") ------------------------------------
air_tbl <- tibble(
  date = seq(as.Date("1949-01-01"), by = "month", length.out = length(AirPassengers)),
  passengers = as.numeric(AirPassengers)
)

# The wall version: one point per year, the average month.
air_tbl |>
  mutate(year = year(date)) |>
  summarise(mean_passengers = mean(passengers), .by = year) |>
  print()

ggplot(air_tbl, aes(x = date, y = passengers)) +
  geom_line(colour = blue, linewidth = 1) +
  labs(
    title = "International airline passengers, 1949 to 1960",
    subtitle = "Monthly totals: growing every year, peaking every summer",
    x = NULL, y = "Passengers (thousands)"
  )
save_poster("airline-passengers.png")

# ---- Four things about a car: correlations (poster "c") -----------------
car_cor <- mtcars |>
  select(`Miles per gallon` = mpg, Horsepower = hp, Weight = wt, `Quarter-mile time` = qsec) |>
  cor()

print(round(car_cor, 2))

car_cor |>
  as_tibble(rownames = "first") |>
  pivot_longer(-first, names_to = "second", values_to = "correlation") |>
  mutate(across(c(first, second), fct_inorder)) |>
  ggplot(aes(x = second, y = fct_rev(first), fill = correlation)) +
  geom_tile(colour = "white") +
  geom_text(aes(label = sprintf("%.2f", correlation)), size = 6) +
  scale_fill_gradient2(low = orange, mid = "white", high = blue, limits = c(-1, 1)) +
  labs(
    title = "How four measurements of a car move together",
    subtitle = "Correlations for 32 cars from Motor Trend, 1974",
    x = NULL, y = NULL, fill = "Correlation"
  ) +
  theme(panel.grid = element_blank(), axis.text.x = element_text(angle = 20, hjust = 1))
save_poster("car-correlations.png")

# ---- Two kinds of penguin: body mass (poster "k") -----------------------
mass_tbl <- penguins |>
  filter(species %in% c("Adelie", "Gentoo")) |>
  drop_na(body_mass_g)

mass_tbl |> summarise(n = n(), mean_mass = mean(body_mass_g), .by = species) |> print()

ggplot(mass_tbl, aes(x = body_mass_g, fill = species, colour = species)) +
  geom_density(alpha = 0.4, linewidth = 1) +
  scale_fill_manual(values = c(Adelie = blue, Gentoo = orange)) +
  scale_colour_manual(values = c(Adelie = blue, Gentoo = orange)) +
  scale_x_continuous(labels = scales::label_comma()) +
  labs(
    title = "Adelie and Gentoo penguins barely overlap in weight",
    subtitle = "Body mass, Palmer Archipelago, Antarctica",
    x = "Body mass (grams)", y = "Density", fill = NULL, colour = NULL
  ) +
  theme(legend.position = "top")
save_poster("penguin-mass.png")

message("Done. Posters saved in ", normalizePath(out_dir))
