/*         .-._
 *       .-| | |
 *     _ | | | |__FRANKFURT
 *   ((__| | | | UNIVERSITY
 *      OF APPLIED SCIENCES
 *
 *   (c) 2022-2023   */
const express = require("express");
const router = express.Router();
const Protocol = require("../models/Protocol");
const Match = require("../models/Match");
const { createHistogram, createStatistics } = require("../util/statistics");
const yaml = require("js-yaml");

/**
 * @openapi
 * /api/protocol/:
 *   get:
 *     description: Get list of all protocols
 *     responses:
 *       200:
 *         description: Returns list of protocols.
 */
router.get("/", async (req, res) => {
  try {
    let protocols = await Protocol.find({}, { __v: 0 }).sort({
      dateCreated: -1,
    });
    /*
protocols.map (async(protocol) => {
    if (!protocol.statistics) {
        return await updateStatistics(protocol);
    }
    return protocol
})
*/
    let changes = false;
    for (protocol of protocols) {
      if (!protocol.statistics) {
        await updateStatistics(protocol);
        changes = true;
      }
    }
    if (changes) {
      protocols = await Protocol.find({}, { __v: 0 }).sort({
        dateCreated: -1,
      });
    }
    res.json(protocols);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/protocol/:
 *   post:
 *     description: Create new protocol
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/models/Protocol"
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/models/Protocol"
 *       400:
 *         description: Error message in case of failure
 */
router.post("/", async (req, res) => {
  try {
    const protocol = new Protocol(req.body);
    // Check if new protocol creation is required
    let similar_protocol = await findSimilarProtocol(protocol);
    let msg;
    let result;
    if (similar_protocol.length !== 0) {
      result = await Protocol.findByIdAndUpdate(
        similar_protocol[0]['_id'],
        { dateCreated: protocol['dateCreated'], nMatchesPerInstance: protocol['nMatchesPerInstance'] }
      )
      msg = "Old protocol reset";
    }
    else {
      result = protocol.save();
      msg="New protocol created";
    }
    
    res.status(201).json({message: msg});
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

/**
 * @openapi
 * /api/protocol/current/id:
 *   get:
 *     description: Get all details about current protocol
 *     responses:
 *       200:
 *         description: Returns all details of protocol.
 */
router.get("/current/id", async (req, res) => {
  try {
    let id = await getCurrentProtocolID(res);
    if (id === -1) {
      res.send;
      return;
    }
    res.status(200).send(id);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/protocol/current/teams:
 *   get:
 *     description: Get list of involved teams in current protocol
 *     responses:
 *       200:
 *         description: Redirect to list of teams of current protocol.
 */
router.get("/current/teams", async (req, res) => {
  try {
    let id = await getCurrentProtocolID(res);
    if (id === -1) {
      res.send;
      return;
    }
    res.redirect(req.baseUrl + "/" + id + "/teams");
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/protocol/current/yaml:
 *   get:
 *     description: Get yaml hlm config file for current protocol
 *     responses:
 *       200:
 *         description: Redirect to yaml of current protocol.
 */
router.get("/current/yaml", async (req, res) => {
  try {
    let id = await getCurrentProtocolID(res);
    if (id === -1) {
      res.send;
      return;
    }
    res.redirect(req.baseUrl + "/" + id + "/yaml");
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/protocol/current:
 *   get:
 *     description: Get all details about current protocol
 *     responses:
 *       200:
 *         description: Returns all details of protocol.
 */
router.get("/current", async (req, res) => {
  try {
    let id = await getCurrentProtocolID(res);
    if (id === -1) {
      res.send;
      return;
    }
    res.redirect(req.baseUrl + "/" + id);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/protocol/{id}/histogram/{field}.{bins?}/{commit?}:
 *   get:
 *     description: Get histogram data for protocol
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID (mongoDB) of the protocol to retrieve.
 *         type: string
 *       - in: path
 *         name: field
 *         required: true
 *         description: Field of match data, e.g., goals_l.
 *         type: string
 *       - in: path
 *         name: bins
 *         required: false
 *         description: Number of buckets.
 *         type: number
 *         minimum: 2
 *         default: 60
 *       - in: path
 *         name: commit
 *         required: false
 *         description: Restrict histogram to given commit
 *         type: string
 *     responses:
 *       200:
 *         description: Returns all details of protocol.
 */
router.get("/:id/histogram/:field.:bins?/:commit?", async (req, res, next) => {
  const field = req.params.field;
  const bins = req.params.bins || 60;
  const commit = req.params.commit || "protocol";
  try {
    let protocol = await Protocol.findById(req.params.id, {
      __v: 0,
    });
    if (!protocol) {
      res
        .status(404)
        .json({ error: "No protcol found with id:" + req.params.id });
      return;
    }

    // New code
    let filter;
    if (!req.params.commit) {
      filter = { protocolID: req.params.id };
    } else {
      filter = { protocolID: req.params.id, commitID: req.params.commit };
    }
    let histogram_l = await createHistogram(filter, `${field}_l`, bins);
    let histogram_r = await createHistogram(filter, `${field}_r`, bins);
    res.json([histogram_l, histogram_r]);

    //Old code (cache)
    /*let histogram;
    if (!protocol.histograms) {
      protocol.histograms = {};
    }
    if (!protocol.histograms[commit]) {
      protocol.histograms[commit] = {};
    }
    histogram = protocol.histograms[commit][field];
    if (!histogram) {
      protocol.histograms[commit][field] = [];
      let filter;
      if (!req.params.commit) {
        filter = { protocolID: req.params.id };
      } else {
        filter = { protocolID: req.params.id, commitID: req.params.commit };
      }

      histogram = await createHistogram(filter, `${field}_l`, bins);
      console.log(field, histogram);
      protocol.histograms[commit][field].push(histogram);
      histogram = await createHistogram(filter, `${field}_r`, bins);
      console.log(field, histogram);
      protocol.histograms[commit][field].push(histogram);

      console.log(protocol.histograms);
      await Protocol.findByIdAndUpdate(req.params.id, {
        histograms: protocol.histograms,
      });
    }
    res.json(protocol.histograms[commit][field]);*/
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/protocol/{id}/teams:
 *   get:
 *     description: Get list of involved teams in current protocol
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID (mongoDB) of the protocol to retrieve.
 *         type: string
 *     responses:
 *       200:
 *         description: Returns list of teams.
 */
router.get("/:id/teams", async (req, res, next) => {
  try {
    let protocol = await Protocol.findById(req.params.id, {
      __v: 0,
      statistics: 0,
    });
    if (!protocol) {
      res
        .status(404)
        .json({ error: "No protcol found with id:" + req.params.id });
      return;
    }
    const doc = protocol._doc;
    let teams = [];
    for (matchup of doc.matchups) {
      if (!teams.includes(matchup.team_l.name)) {
        teams.push(matchup.team_l.name);
      }
      if (!teams.includes(matchup.team_r.name)) {
        teams.push(matchup.team_r.name);
      }
    }
    res.json(teams);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/protocol/{id}/yaml:
 *   get:
 *     description: Get HLM yaml config file
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID (mongoDB) of the protocol to retrieve.
 *         type: string
 *     responses:
 *       200:
 *         description: Returns all details of protocol.
 *         content:
 *           text/yaml
 */
router.get("/:id/yaml", async (req, res, next) => {
  try {
    let protocol = await Protocol.findById(req.params.id, {
      __v: 0,
      statistics: 0,
    });
    if (!protocol) {
      res
        .status(404)
        .json({ error: "No protcol found with id:" + req.params.id });
      return;
    }
    const doc = protocol._doc;
    let config = {
      protocol_id: doc._id.toString(),
      mode: "matchlist",
      title: doc.name.toString(),
      server_conf: "./config/rcssserver/server_official.conf",
      player_conf: "./config/rcssserver/player_official.conf",
      teams_dir: "/tmp/robocup/hlm/teams/",
      agent_range: "1..12",
      game_log_extension: ".rcg",
      text_log_extension: ".rcl",
      match_sleep: 10,
      stylesheet_url: "results.xsl",
      server: "localhost",
      rcssserver_bin: "/usr/local/bin/rcssserver",
      statistics: true,
      statistics_bin: "/tmp/robocup/robocup_log_analyzer/RoboCup_main.py",
      statistics_dir: "/tmp/robocup/logs",
      hosts: ["localhost", "localhost"],
    };
    let matches = [];
    for (matchup of doc.matchups) {
      for (i = 0; i < doc.nMatchesPerInstance / doc.matchups.length; i++) {
        matches.push([matchup.team_l.name, matchup.team_r.name]);
      }
    }
    config.matches = matches;

    // res.status(200).type("text/yaml").send(yaml.dump(protocol)) // or application/yaml or application/x-yaml
    res
      .status(200)
      .type("text/plain")
      .send(
        yaml.dump(config, {
          flowLevel: 2,
          styles: {
            "!!null": "camelcase",
          },
        })
      );
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

//Function to create a csv string out of a array of matches
//Expects a array of matches in json format
//Outputs a String containing the input matches as CSV
async function toCSV(matches) {
  let myCSV = []
  let header = ["_id", "commitID", "protocolID", "date"]
  //Clean up Json Arrays and filter out unwanted keys
  const row = matches[0]
  for (let key in row) {
    if (!key.startsWith("$") && key !== "_doc" && row.hasOwnProperty(key)) {
      header.push(key)
    }
  }

  //Create the header of the csv
  let stringBuilder = ""
  for (let item of header) {
    stringBuilder += item + ";"
  }
  myCSV.push(stringBuilder + "\n")

  //Create the body of the csv with the acutal values
  for (let row of matches) {
    stringBuilder = ""
    for (var key of header) {
      var item = row[key]
      if (typeof item === "object" && key !== 'date' && key !== '_id') {
        item = item.length
      }
      stringBuilder += item + ";"
    }
    myCSV.push(stringBuilder + "\n")
  }

  //Make the Array to one string
  stringBuilder = ""
  for (item of myCSV) {
    stringBuilder += item
  }
  return stringBuilder
}

/**
 * @openapi
 * /api/protocol/{id}/matches.csv/last:
 *   get:
 *     description: Get the last match of a Protocol in CSV format
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID (mongoDB) of the protocol to retrieve.
 *         type: string
 *     responses:
 *       200:
 *         description: Returns a single CSV as a String.
 */
router.get("/:id/matches.csv/last", async (req, res) => {
  try {
    let filter = { "protocolID": req.params.id }
    const matches = await Match.find(filter)
      .sort({ date: -1 })
      .limit(1);

    if (!matches || matches.length === 0) {
      res.status(404).json({ error: "No matches found" });
      return;
    }
    //convert json to csv
    const matches_as_csv = await toCSV(matches)
    res.type("text/csv").send(matches_as_csv)

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/protocol/{id}/matches.json/last:
 *   get:
 *     description: Get the last match of a Protocol in json format
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID (mongoDB) of the protocol to retrieve.
 *         type: string
 *     responses:
 *       200:
 *         description: Returns a single json as a Array
 */
router.get("/:id/matches.json/last", async (req, res) => {
  try {
    let filter = { "protocolID": req.params.id }
    const matches = await Match.find(filter)
      .sort({ date: -1 })
      .limit(1);

    if (!matches || matches.length === 0) {
      res.status(404).json({ error: "No matches found" });
      return;
    }
    res.status(200).json(matches)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/protocol/{id}/matches.csv/{index}:
 *   get:
 *     description: Get a specific match of a Protocol in CSV format
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID (mongoDB) of the protocol to retrieve.
 *         type: string
 *       - in: path
 *         name: index
 *         required: true
 *         description: ID (mongoDB) of the match of a protocol to retrieve.
 *         type: number
 *     responses:
 *       200:
 *         description: Returns a spesific CSV as a String.
 */
router.get("/:id/matches.csv/:index", async (req, res) => {
  try{
    const index = req.params.index
    let filter = {"protocolID" : req.params.id}
    let matches = await Match.find(filter)
      .sort({ date: -1 })

    if (!matches || matches.length === 0) {
      res.status(404).json({ error: "No matches found" });
      return;
    }
    if (matches.length < index || index < 0){
      res.status(404).json({ error: "No valid index entered" });
      return;
    }
    //take only a single match
    matches = [matches[index]]
    const matches_as_csv = await toCSV(matches)
    res.type("text/csv").send(matches_as_csv)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/protocol/{id}/matches.json/{index}:
 *   get:
 *     description: Get the last match of a Protocol in json format
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID (mongoDB) of the protocol to retrieve.
 *         type: string
 *       - in: path
 *         name: index
 *         required: true
 *         description: ID (mongoDB) of the match of a protocol to retrieve.
 *         type: number
 *     responses:
 *       200:
 *         description: Returns a single json as a Array
 */
router.get("/:id/matches.json/:index", async (req, res) => {
  try{
    const index = req.params.index
    let filter = {"protocolID" : req.params.id}
    let matches = await Match.find(filter)
    .sort({ date: -1 })
    .lean()

    if (!matches || matches.length === 0) {
      res.status(404).json({ error: "No matches found" });
      return;
    }
    if (matches.length < index || index < 0){
      res.status(404).json({ error: "No valid index entered" });
      return;
    }
    let match = matches[index]
    match['n_matches'] = matches.length.toString()
    match['hasNext'] =  matches.length > index ? true : false
    match['index'] = index

    res.status(200).json(match)

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/protocol/{id}/matches.csv:
 *   get:
 *     description: Get all matches of a Protocol in CSV format
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID (mongoDB) of the protocol to retrieve.
 *         type: string
 *     responses:
 *       200:
 *         description: Returns all matches in csv format.
 */
router.get("/:id/matches.csv", async (req, res) => {
  try {
    let filter = { "protocolID": req.params.id }
    let matches = await Match.find(filter)
      .sort({ date: -1 })

    if (!matches || matches.length === 0) {
      res.status(404).json({ error: "No matches found" });
      return;
    }

    //convert json to csv
    const matches_as_csv = await toCSV(matches)
    res.type("text/csv").send(matches_as_csv)

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/protocol/{id}/matches.json:
 *   get:
 *     description: Get all matches from a Protocol in json format
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID (mongoDB) of the protocol to retrieve.
 *         type: string
 *     responses:
 *       200:
 *         description: Returns a list of matches in json format
 */
router.get("/:id/matches.json", async (req, res) => {
  try {
    let filter = { "protocolID": req.params.id }
    const matches = await Match.find(filter)
      .sort({ date: -1 })

    if (!matches || matches.length === 0) {
      res.status(404).json({ error: "No matches found" });
      return;
    }

    res.status(200).json(matches)

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/protocol/{id}:
 *   get:
 *     description: Get all details about protocol with id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID (mongoDB) of the protocol to retrieve.
 *         type: string
 *     responses:
 *       200:
 *         description: Returns all details of protocol.
 */
router.get("/:id", async (req, res) => {
  // console.log(req.originalUrl);
  try {
    let protocol = await Protocol.findById(req.params.id, {
      __v: 0,
    });
    console.log("get protocol: ", req.params.id);
    // console.log("protocol: ", protocol);
    if (!protocol) {
      res
        .status(404)
        .json({ error: "No protcol found with id:" + req.params.id });
      return;
    }
    // console.log("protocol.statistics: ", !protocol.statistics);
    // console.log("protocol.statistics.commits: ", !protocol.statistics || !protocol.statistics.commits);
    // console.log("protocol.statistics: ", protocol.statistics);
    // console.log("protocol.statistics.hasOwnProperty: ", protocol.hasOwnProperty(statistics));
    // console.log("protocol.statistics in: ", statistics in protocol);
    // console.log("protocol.statistics !== undefined: ", protocol.statistics !== undefined);
    if (!protocol.statistics || !protocol.statistics.commits) {
      await updateStatistics(protocol);
      protocol = await Protocol.findById(req.params.id, { __v: 0 }); // just to get rid of __v
    }
    res.json(protocol);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

module.exports = router;

async function updateStatistics(protocol) {
  console.log("updateStatistics: ", protocol._doc._id.toString());
  const id = protocol._doc._id.toString();
  const filter = { protocolID: id };
  const statistics = await createStatistics(filter);
  // console.log("statistics", statistics);

  protocol = await Protocol.findByIdAndUpdate(
    id,
    { statistics: statistics },
    {
      returnDocument: "after",
    }
  );
  return protocol;
}

async function getCurrentProtocolID(res) {
  let protocol = await Protocol.find({}, { __v: 0, statistics: 0 })
    .sort({ dateCreated: -1 })
    .limit(1);
  if (!protocol || protocol.length === 0) {
    res.status(404).json({ error: "Current protcol not found" });
    return -1;
  }
  return protocol[0].id;
}

async function findSimilarProtocol(protocol) {
  let properies = Object.assign({}, protocol['_doc']);
  delete properies['_id'];
  delete properies['nMatchesPerInstance'];
  delete properies['dateCreated'];
  let similar_protocol = await Protocol.find(properies).sort({ dateCreated: -1 }).limit(1);;
  return similar_protocol;
}


/**
 * @openapi
 * /api/protocol/{id}:
 *   delete:
 *     description: Remove a protocol by using its ID (mongodb ID) and receive information about the protocol that was removed.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID (mongoDB) of the protocol to retrieve.
 *         type: string
 *     responses:
 *       200:
 *         description: Returns all information about the deleted protocol.
 */
router.delete("/:id", async (req, res) => {
  try {
    const protocol = await Protocol.findByIdAndDelete(req.params.id);
    // res.json({ message: `Document with ${protocol.name} has been deleted.` });
    res.json(protocol);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err });
  }
});
