/*         .-._
 *       .-| | |
 *     _ | | | |__FRANKFURT
 *   ((__| | | | UNIVERSITY
 *      OF APPLIED SCIENCES
 *
 *   (c) 2022-2023   */
const express = require("express");
const router = express.Router();
const Match = require("../models/Match");
const Commit = require("../models/Commit");

/**
 * @openapi
 * /api/commit/:
 *   get:
 *     description: Get list of all commits
 *     responses:
 *       200:
 *         description: Returns list of commits.
 */
router.get("/", async (req, res) => {
  try {
    const commits = await Commit.find({}, { __v: 0 }).sort({ date: 1 }); //.limit(1);
    res.json(commits);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/commit/{id}:
 *   get:
 *     description: Get all details about commit with id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID (from mongoDB) of the commit to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns all details of commit.
 */
router.get("/:id", async (req, res) => {
  try {
    //let commit = await Commit.find({ _id: req.params.id }, { __v: 0 }); // .sort({ date: 1 }).limit(1);
    let commit = await Commit.findById(req.params.id, { __v: 0 });

    if (!commit) {
      res
        .status(404)
        .json({ error: "No commit found with id:" + req.params.id });
      return;
    }

    if (!commit.statistics || Object.keys(commit.statistics).length === 0) {
      const filter = { commitID: req.params.id };
      let updatedCommit = { ...commit._doc };
      const statistics = await createStatistics(filter);

      updatedCommit.statistics = statistics;
      commit = await Commit.findByIdAndUpdate(req.params.id, updatedCommit, {
        returnDocument: "after",
      });
      commit = await Commit.findById(req.params.id, { __v: 0 }); // just to get rid of __v
    }

    res.json(commit);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

module.exports = router;

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
