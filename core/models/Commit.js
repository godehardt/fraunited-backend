/*         .-._
 *       .-| | |
 *     _ | | | |__FRANKFURT
 *   ((__| | | | UNIVERSITY
 *      OF APPLIED SCIENCES
 *
 *   (c) 2022-2023   */
const mongoose = require("mongoose");

const CommitSchema = mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    strict: false,
  }
);

module.exports = mongoose.model("Commit", CommitSchema);
