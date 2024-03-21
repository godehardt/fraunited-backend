/*         .-._
 *       .-| | |
 *     _ | | | |__FRANKFURT
 *   ((__| | | | UNIVERSITY
 *      OF APPLIED SCIENCES
 *
 *   (c) 2022-2023   */
const mongoose = require("mongoose");

const ProtocolSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    nMatchesPerInstance: {
      type: Number,
      default: 50,
    },
    mode: {
      type: String,
      enum: ["latest", "fixed"],
      default: "latest",
    },
    dateCreated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    strict: false,
  }
);

module.exports = mongoose.model("Protocol", ProtocolSchema);
