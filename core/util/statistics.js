/*         .-._
 *       .-| | |
 *     _ | | | |__FRANKFURT
 *   ((__| | | | UNIVERSITY
 *      OF APPLIED SCIENCES
 *
 *   (c) 2022-2023   */
const Match = require("../models/Match");

createHistogram = async (filter, field, bins) => {
  const histogram = new Array(bins);
  for (i = 0; i < bins; i++) {
    histogram[i] = 0;
  }

  const matches = await Match.find(filter);
  matches.forEach((match) => {
    let values = match[field];
    if (!Array.isArray(values)) {
      console.log(field);
      console.log(values);
      return;
    } else {
      values.forEach((timestamp) => {
        if (0 < timestamp && timestamp <= 6000) {
          histogram[Math.floor(((timestamp - 1) / 6000) * bins)]++;
        }
      });
    }
  });
  return histogram;
};

createStatistics = async (filter) => {
  // console.log("create stats", filter);
  const matches = await Match.find(filter);

  if (matches.length === 0) {
    return {};
  }
  let result = {
    commits: {},
    wins: { l: 0, r: 0, ties: 0 },
    nmatches: matches.length,
    date: new Date("2000-01-01"),
    team_l: matches[0].team_l,
    team_r: matches[0].team_r,
    pass_chains_l: {
      max: 8,
      min: 2,
      q75: 2,
      mad: 0.0,
      avg: 2.1264359941,
      mean: 2,
      q25: 2,
    },
    pass_chains_r: {
      max: 8,
      min: 2,
      q75: 2,
      mad: 0.0,
      avg: 2.1264359941,
      mean: 2,
      q25: 2,
    },
  };

  matches.forEach((match) => {
    result.commits[match.commitID] = !!result.commits[match.commitID]
      ? result.commits[match.commitID] + 1
      : 1;
    if (match.date > result.date) {
      result.date = match.date;
    }
    if (match.goals_l.length > match.goals_r.length) {
      result.wins.l++;
    } else if (match.goals_l.length < match.goals_r.length) {
      result.wins.r++;
    } else {
      result.wins.ties++;
    }
  });

  const elements = [
    "goals_l",
    "goals_r",
    "possession_l",
    "possession_r",
    "ball_on_side_l",
    "ball_on_side_r",
    "corners_l",
    "corners_r",
    "free_kicks_l",
    "free_kicks_r",
    "offsides_l",
    "offsides_r",
    "tackles_l",
    "tackles_r",
    "total_shots_l",
    "total_shots_r",
    "shots_on_target_l",
    "shots_on_target_r",
    "passes_l",
    "passes_r",
    "fouls_l",
    "fouls_r",
    "yellow_cards_l",
    "yellow_cards_r",
    "red_cards_l",
    "red_cards_r",
    "holes_l",
    "holes_r",
  ];
  elements.forEach((e) => {
    result[e] = createStatisticsFor(matches, e);
  });

  // TODO pass_chain_statistics
  return result;
};

createStatisticsFor = (matches, field) => {
  let sum = 0;
  let access;
  if (Array.isArray(matches[0][field])) {
    access = (m) => m.length;
  } else {
    access = (m) => m;
  }

  const values = matches
    .map((match) => {
      const value = access(match[field]);
      sum += value;
      return value;
    })
    .sort((a, b) => a - b);
  const middle = values.length / 2;
  let mean = values[0];
  if (values.length > 1) {
    mean =
      values.length % 2 === 0
        ? (values[middle - 1] + values[middle]) / 2
        : values[Math.floor(middle)];
  }
  let stats = {
    min: values[0],
    max: values[values.length - 1],
    avg: sum / values.length,
    mean: mean,
    q25: values[Math.ceil(0.25 * values.length) - 1],
    q75: values[Math.ceil(0.75 * values.length) - 1],
  };
  return stats;
};

module.exports = { createStatistics, createHistogram };

/*
        new Statistics(
                            min: min,
                            max: max,
                            avg: 1.0d * sum / items.size(),
                            mean: mean,
                            mad: 1.0d * abs_sum / items.size(),
                            q25: q25,
                            q75: q75)
        */
