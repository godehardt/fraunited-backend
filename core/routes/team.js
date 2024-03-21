/*         .-._
 *       .-| | |
 *     _ | | | |__FRANKFURT
 *   ((__| | | | UNIVERSITY
 *      OF APPLIED SCIENCES
 *
 *   (c) 2022-2023   */
const config = require("../config");
const fs = require("fs");
const fsPromises = require("fs").promises;
const express = require("express");
const router = express.Router();
const Team = require("../models/Team");
const formidable = require("formidable");
const { uploadDir } = require("../config");
uploadDirectory = config.uploadDir + "/zip"
const form = formidable({
  uploadDir: uploadDirectory,
  keepExtensions: true,
  allowEmptyFiles: false,
});
fs.mkdirSync(uploadDirectory, {recursive: true})

/**
 * @openapi
 * /api/team:
 *   get:
 *     description: Get list of last 42 teames
 *     responses:
 *       200:
 *         description: Returns all details of team.
 */
router.get("/", async (req, res) => {
  // console.log("GET All Teams", req.originalUrl);
  try {
    const teams = await Team.find({}, { __v: 0 }).sort({ name: 1 });
    // const teamNames = teams.map((t) => t.name);
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/team:
 *   post:
 *     description: Create new team with name
 *     responses:
 *       201:
 *         description: Returns created team.
 */
router.post("/", async (req, res) => {
  // console.log("POST Team", req.originalUrl);
  try {
    let teamName = undefined;
    let zipPath = undefined;
    let scriptPath = undefined;
    await new Promise((resolve, reject) => {
      form
        .parse(req)
        .on("field", (name, field) => {
          console.log("Field-name:", field);
          if (name === "name") {
            teamName = field;
          }
        })
        .on("file", (name, file) => {
          console.log("Uploaded file:", name, file.filepath);
          switch (name) {
            case "zip":
              zipPath = file.filepath;
              break;
            case "setupScript":
              scriptPath = file.filepath;
              break;
            default:
              console.error(`Unhandled file ${name}`);
          }
          // console.log(file);
        })
        .on("aborted", () => {
          res.status(400);
          console.error("Request aborted by the user");
          reject("Request aborted by the user");
        })
        .on("error", (err) => {
          res.status(500);
          console.error("Error", err);
          reject(err);
        })
        .on("end", () => {
          resolve();
        });
    });
    const zipFilepath = form.uploadDir + "/" + teamName + ".zip";
    await fsPromises.rename(zipPath, zipFilepath);
    let teamData = { name: teamName, filepath: zipFilepath };
    if (!!scriptPath) {
      const scriptFilepath = form.uploadDir + "/" + teamName + ".sh";
      await fsPromises.rename(scriptPath, scriptFilepath);
      teamData.scriptpath = scriptFilepath;
    }
    const team = new Team(teamData);
    let result = await team.save();

    result = await Team.findById(result.id, { _id: 0, __v: 0 }); // just to get rid of __v

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err });
  }
});

/**
 * @openapi
 * /api/team/{name}/zip:
 *   get:
 *     description: Get all details about team with id
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Name of the team to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns all details of team.
 */
router.get("/:name/zip", async (req, res) => {
  // console.log("Get Zip File", req.originalUrl);
  try {
    const team = await Team.find({ name: req.params.name });
    if (!!team && team.length > 0) {
      res.download(team[0].filepath);
    } else {
      res.status(400).send(`Team "${req.params.name}" not found`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/team/{name}/sh:
 *   get:
 *     description: Get all details about team with id
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Name of the team to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns all details of team.
 */
router.get("/:name/sh", async (req, res) => {
  // console.log("Get Shell Script", req.originalUrl);
  try {
    const team = await Team.find({ name: req.params.name });
    if (!!team && team.length > 0) {
      res.download(team[0].scriptpath);
    } else {
      res.status(400).send(`Team "${req.params.name}" not found`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/team/{name}:
 *   get:
 *     description: Get all details about team
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Name of the team to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns all details of team.
 */
router.get("/:name", async (req, res) => {
  // console.log("Get Team", req.originalUrl);
  try {
    const data = await Team.find({ name: req.params.name });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});

/**
 * @openapi
 * /api/team/{name}:
 *   delete:
 *     description: Get all details about team with id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Name of the team to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns all details of team.
 */
router.delete("/:name", async (req, res) => {
  // console.log("DELETE Team", req.originalUrl);
  try {
    const team = await Team.findOneAndDelete({ name: req.params.name });
    // console.log(team);
    await fsPromises.rm(team.filepath);
    if (!!team.scriptpath) {
      await fsPromises.rm(team.scriptpath);
    }
    res.json({ message: "Team named '" + team.name + "' deleted." });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err });
  }
});

module.exports = router;
