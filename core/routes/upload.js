/*         .-._
 *       .-| | |
 *     _ | | | |__FRANKFURT
 *   ((__| | | | UNIVERSITY
 *      OF APPLIED SCIENCES
 *
 *   (c) 2022-2023   */
const config = require("../config");
const express = require("express");
const router = express.Router();
const formidable = require("formidable");
const form = formidable({
  uploadDir: config.uploadDir,
  keepExtensions: true,
  allowEmptyFiles: true,
  filename: (name, ext, part, form) => {
    return !!part.name ? part.name + ext : part.originalFilename;
  },
});

/**
 * @openapi
 * /api/upload:
 *   post:
 *     description: upload
 */
router.post("/", (req, res) => {
  // new form.IncomingForm().parse(req)
  form
    .parse(req)
    .on("field", (name, field) => {
      // console.log('Field', name, field)
    })
    .on("file", (name, file) => {
      // console.log('Uploaded file', name) //, file)
      // console.log(file.path)
      // console.log(file.originalFilename)
      // console.log(file.size)
      // console.log(file.mimetype)
    })
    .on("aborted", () => {
      res.status(400);
      console.error("Request aborted by the user");
    })
    .on("error", (err) => {
      res.status(500);
      console.error("Error", err);
    })
    .on("end", () => {
      res.end();
    });
});

module.exports = router;
