/*         .-._
 *       .-| | |
 *     _ | | | |__FRANKFURT
 *   ((__| | | | UNIVERSITY
 *      OF APPLIED SCIENCES
 *
 *   (c) 2022-2023   */
const mongoose = require("mongoose");

const TeamSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    filepath: {
      type: String,
      required: true,
    },
    scriptpath: {
      type: String,
      required: false,
    },
  },
  {
    strict: false,
  }
);

module.exports = mongoose.model("Team", TeamSchema);
