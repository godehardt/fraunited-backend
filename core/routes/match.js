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
const Protocol = require("../models/Protocol");
const Commit = require("../models/Commit");

/**
 * @openapi
 * /api/match:
 *   get:
 *     description: Get list of last 10 matches
 *     responses:
 *       200:
 *         description: Returns all details of commit.
 */
router.get("/", async (req, res) => {
  try {
    const matches = await Match.find({}, { __v: 0 })
      .sort({ date: -1 })
      .limit(10);
    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/match:
 *   post:
 *     description: Create new match
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/models/Match"
 *     responses:
 *       201:
 *         description: Returns all details of very last match.
 */
router.post("/", async (req, res) => {
  try {
    // console.log("req.body: ", req.body);
    const match = new Match(req.body);
    const result = await match.save();

    // console.log("delete commit: ", req.body.commitID);
    await Commit.deleteOne({ _id: req.body.commitID });
    await new Commit({ _id: req.body.commitID }).save();

    // clean up statistics and histogram of protocol
    await Protocol.findByIdAndUpdate(req.body.protocolID, {
      $unset: { statistics: 1, histograms: 1 },
    });

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err });
  }
});

/**
 * @openapi
 * /api/match/last:
 *   get:
 *     description: Get all details about last match
 *     responses:
 *       200:
 *         description: Returns all details of very last match.
 */
router.get("/last", async (req, res) => {
  try {
    const matches = await Match.find({}, { __v: 0 })
      .sort({ date: -1 })
      .limit(1);
    if (!matches || matches.length === 0) {
      res.status(404).json({ error: "No matches found" });
      return;
    }
    res.json(matches[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/match/{id}:
 *   get:
 *     description: Get all details about commit with id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID (mongoDB) of the commit to retrieve.
 *         type: string
 *     responses:
 *       200:
 *         description: Returns all details of match.
 */
router.get("/:id", async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      res
        .status(404)
        .json({ error: "No match found with id:" + req.params.id });
      return;
    }
    res.json(match);
  } catch (err) {
    // console.error(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/match/{id}:
 *   delete:
 *     description: Get all details about commit with id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID (mongoDB) of the commit to retrieve.
 *         type: string
 *     responses:
 *       200:
 *         description: Returns all details of match.
 */
router.delete("/:id", async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    // res.json({ message: `Document with ${match.name} has been deleted.` });
    res.json(match);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err });
  }
});

module.exports = router;
