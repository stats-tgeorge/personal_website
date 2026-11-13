// posters.js
// Written by Claude (an AI model made by Anthropic) at Tyler George's direction.
//
// The statistics posters on the walls. Every one is drawn from REAL
// data: a well-known teaching data set, summarised down to the dozen
// or so pixels a poster has room for.
//
// Each poster has:
//   title    shown when the player stands below it
//   caption  one or two sentences saying what the picture shows
//   fact     a "Did you know?" about the data
//   source   where the data and the fact come from
//   file     the full-size picture shown when the player looks closer.
//            These are made with ggplot by posters/make-posters.R and
//            saved in the posters/ folder. Until that script has been
//            run the picture is simply left out.
//   type     how tiles.js draws the tiny version on the wall
//   ...plus the numbers to draw. Heights are in pixels (the drawing
//   area of a poster is 12 pixels wide and 10 tall), already worked
//   out from the data as described in each comment. The summaries
//   printed in the comments are the real figures the pixels come from.
//
// The data came from the R packages named below, by way of the
// Rdatasets collection (https://vincentarelbundock.github.io/Rdatasets/).
// To put a poster in a room, type its letter on a wall in that room's
// map file.

export const POSTERS = {
  // datasets::faithful, eruptions (272 eruptions, 1.6 to 5.1 minutes).
  // Twelve bins of 0.3 minutes from 1.5 to 5.1. Counts:
  // 12 51 24 7 3 1 10 19 38 42 44 21. Tallest bar = 9 pixels.
  h: {
    title: "Old Faithful eruptions",
    caption:
      "A histogram of how long 272 eruptions of the Old Faithful geyser lasted. Two humps: eruptions are either short (about 2 minutes) or long (about 4.5), rarely in between.",
    fact:
      "After a short eruption the next one arrives sooner: in these data the average wait is about 54 minutes after a short eruption and about 80 after a long one. Park staff use the same idea to post predicted eruption times.",
    source:
      "Azzalini, A. and Bowman, A. W. (1990). A look at some data on the Old Faithful geyser. Applied Statistics, 39, 357-365. Data: faithful, in R's datasets package.",
    file: "old-faithful.png",
    type: "histogram",
    color: "#0072b2",
    heights: [2, 9, 4, 1, 1, 0, 2, 3, 7, 7, 8, 4],
  },

  // HistData::Galton, child (928 adult children, 61.7 to 73.7 inches),
  // in one-inch groups. Counts: 12 32 59 48 117 138 120 167 99 64 41 31.
  q: {
    title: "Galton's heights",
    caption:
      "A histogram of the heights of 928 adult children measured by Francis Galton in the 1880s, the data behind the phrase 'regression to the mean'. Roughly bell-shaped, centred near 68 inches.",
    fact:
      "Francis Galton, who collected these heights, also coined the word 'eugenics' in 1883. In 1904 he funded a Eugenics Record Office at University College London, which became the Galton Laboratory of National Eugenics under Karl Pearson. Many founding methods of statistics grew up alongside that movement. After an inquiry into this history, UCL removed Galton's and Pearson's names from its buildings in 2020 and issued a formal apology in 2021.",
    source:
      "Galton, F. (1886). Regression towards mediocrity in hereditary stature. Journal of the Anthropological Institute, 15, 246-263. University College London (2020). Inquiry into the History of Eugenics at UCL: Final Report. Data: Galton, in the HistData package for R.",
    file: "galton-heights.png",
    type: "histogram",
    color: "#cc79a7",
    heights: [1, 2, 3, 3, 6, 7, 6, 9, 5, 3, 2, 2],
  },

  // datasets::mtcars (32 cars from a 1974 issue of Motor Trend).
  // Across: weight, 1,500 to 5,500 lb. Up: miles per gallon, 10 to 34.
  // Each car is one pixel (cars that land on the same pixel share it).
  // Correlation: -0.87.
  s: {
    title: "Car weight and fuel economy",
    caption:
      "A scatter plot of 32 cars from 1974: weight across, miles per gallon up. Heavier cars go fewer miles on a gallon (correlation -0.87).",
    fact:
      "The 32 cars come from a 1974 issue of Motor Trend magazine. The most economical is the Toyota Corolla at 33.9 miles per gallon; the thirstiest are the Cadillac Fleetwood and the Lincoln Continental, both at 10.4.",
    source:
      "Henderson, H. V. and Velleman, P. F. (1981). Building multiple regression models interactively. Biometrics, 37, 391-411. Data: mtcars, in R's datasets package.",
    file: "car-weight-mpg.png",
    type: "scatter",
    color: "#d55e00",
    // [pixels across, pixels up]
    points: [
      [0, 7], [1, 6], [1, 8], [2, 4], [2, 5], [2, 7], [3, 3], [3, 4], [4, 4], [5, 2],
      [5, 3], [5, 4], [5, 5], [6, 1], [6, 2], [6, 3], [7, 2], [10, 0], [11, 0], [11, 2],
    ],
  },

  // datasets::Titanic. Survivors out of everyone aboard, by class:
  // 1st 203 of 325 (62%), 2nd 118 of 285 (41%), 3rd 178 of 706 (25%),
  // crew 212 of 885 (24%). The full poster height (10 pixels) = 100%.
  b: {
    title: "Surviving the Titanic",
    caption:
      "The share of people who survived the sinking of the Titanic, by class: 62% of first class, 41% of second, 25% of third, and 24% of the crew.",
    fact:
      "For years this table was used in classrooms as 'the unusual episode': students were shown the counts without being told what event they described, and had to work it out from the numbers alone.",
    source:
      "Dawson, R. J. MacG. (1995). The 'unusual episode' data revisited. Journal of Statistics Education, 3(3). Data: Titanic, in R's datasets package, from the British Board of Trade inquiry report of 1912.",
    file: "titanic-survival.png",
    type: "bars",
    colors: ["#0072b2", "#e69f00", "#009e73", "#cc79a7"],
    heights: [6, 4, 3, 2],
  },

  // palmerpenguins::penguins, flipper_length_mm by species.
  // Minimum, lower quartile, median, upper quartile, maximum:
  //   Adelie    172 186 190 195 210   (151 penguins)
  //   Chinstrap 178 191 196 201 212   (68)
  //   Gentoo    203 212 216 221 231   (123)
  // The poster's height runs from 170 mm (bottom) to 232 mm (top).
  x: {
    title: "Penguin flippers",
    caption:
      "Box plots of flipper length for three penguin species on the Palmer Archipelago, Antarctica: Adelie, Chinstrap and Gentoo. Gentoo flippers are clearly the longest.",
    fact:
      "These measurements were made by Dr Kristen Gorman and the Palmer Station research programme in Antarctica between 2007 and 2009, on 344 penguins. They were released as an R package in 2020.",
    source:
      "Gorman, K. B., Williams, T. D. and Fraser, W. R. (2014). Ecological sexual dimorphism and environmental variability within a community of Antarctic penguins (genus Pygoscelis). PLoS ONE, 9(3), e90081. Data: penguins, in the palmerpenguins package for R.",
    file: "penguin-flippers.png",
    type: "boxes",
    colors: ["#0072b2", "#e69f00", "#009e73"],
    // [minimum, lower quartile, median, upper quartile, maximum], in pixels up
    boxes: [
      [0, 2, 3, 4, 6],
      [1, 3, 4, 4, 6],
      [5, 6, 7, 7, 9],
    ],
  },

  // datasets::AirPassengers: monthly airline passengers, in thousands.
  // One point per year, the average month: 1949 to 1960 =
  // 127 140 170 197 225 239 284 328 368 381 428 476.
  // The poster's height runs from 100 (bottom) to 480 (top).
  t: {
    title: "Airline passengers, 1949 to 1960",
    caption:
      "A time series: the average number of international airline passengers per month, year by year. It climbs from about 127,000 in 1949 to 476,000 in 1960.",
    fact:
      "Statisticians know this series simply as 'the airline data'. It gave its name to the 'airline model', a way of forecasting seasonal data that is still a standard starting point.",
    source:
      "Box, G. E. P. and Jenkins, G. M. (1976). Time Series Analysis: Forecasting and Control (revised edition). Holden-Day. Data: AirPassengers, in R's datasets package.",
    file: "airline-passengers.png",
    type: "line",
    color: "#0072b2",
    heights: [1, 1, 1, 2, 3, 3, 4, 5, 6, 6, 7, 8],
  },

  // datasets::mtcars again: correlations between four measurements,
  // in this order: miles per gallon, horsepower, weight, quarter-mile time.
  // Blue = they rise together; orange = one rises as the other falls;
  // stronger colour = stronger relationship.
  c: {
    title: "Four things about a car",
    caption:
      "A correlation heat map for 32 cars: miles per gallon, horsepower, weight and quarter-mile time. Blue squares rise together, orange squares move in opposite directions. Fuel economy and weight are the strongest pair (-0.87).",
    fact:
      "This small table of 32 cars may be the most-used example in statistics teaching: it comes built into every copy of the R language, under the name mtcars.",
    source:
      "Henderson, H. V. and Velleman, P. F. (1981). Building multiple regression models interactively. Biometrics, 37, 391-411. R Core Team, the datasets package for R.",
    file: "car-correlations.png",
    type: "heatmap",
    correlations: [
      [1.0, -0.78, -0.87, 0.42],
      [-0.78, 1.0, 0.66, -0.71],
      [-0.87, 0.66, 1.0, -0.17],
      [0.42, -0.71, -0.17, 1.0],
    ],
  },

  // palmerpenguins::penguins, body_mass_g, for two species. Twelve
  // bins of 300 g from 2,700 to 6,300 g; each curve shows the share of
  // that species in each bin.
  //   Adelie (151, mean 3,701 g): 7 21 39 31 26 19 8 0 0 0 0 0
  //   Gentoo (123, mean 5,076 g): 0 0 0 0 3 13 24 25 19 22 13 4
  k: {
    title: "Two kinds of penguin",
    caption:
      "The body mass of Adelie penguins (blue) and Gentoo penguins (orange). The two distributions barely overlap: a typical Gentoo weighs about 5.1 kg, a typical Adelie about 3.7 kg.",
    fact:
      "The penguin data were offered as a replacement for a much older classroom favourite, the iris flower measurements, which the statistician Ronald Fisher published in 1936 in a journal called the Annals of Eugenics.",
    source:
      "Horst, A. M., Hill, A. P. and Gorman, K. B. (2020). palmerpenguins: Palmer Archipelago (Antarctica) penguin data. R package. Fisher, R. A. (1936). The use of multiple measurements in taxonomic problems. Annals of Eugenics, 7(2), 179-188.",
    file: "penguin-mass.png",
    type: "curves",
    colors: ["#0072b2", "#d55e00"],
    curves: [
      [1, 4, 8, 6, 5, 4, 2, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 3, 6, 6, 5, 6, 3, 1],
    ],
  },
};

// The map letters that are posters: "hqsbxtck".
export const POSTER_LETTERS = Object.keys(POSTERS).join("");
