/*         .-._
 *       .-| | |
 *     _ | | | |__FRANKFURT
 *   ((__| | | | UNIVERSITY
 *      OF APPLIED SCIENCES
 *
 *   (c) 2022-2023   */
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
// The init function is imported from our `db.js` file, as well as the routes
// we created in `routes.js`

require('dotenv-flow').config({
  path: './core',
  node_env: process.env.NODE_ENV ? process.env.NODE_ENV.trim() : '',
  purge_dotenv: true,
  //debug: true
});

//require("dotenv/config");
//require('dotenv-flow/config');
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
var cors = require("cors");

const PORT = process.env.PORT || 80;

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "FraUNIted RoboCup CI",
      description: "Backend API für CI/CD",
      version: "1.9.0a",
      contact: {
        email: "godehardt@fb2.fra-uas.de",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
  },
  apis: ["./routes/*.js", "./models/*.js"], // files containing annotations as above
};

const openapiSpec = swaggerJsdoc(options);

const app = express();

// Middleswares

const whitelist = ["http://localhost:3000", "http://localhost:80"];
const corsOptions = {
  origin: function (origin, callback) {
    if (true || !origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors()); // corsOptions

app.use(express.json()); //Used to parse JSON bodies
// app.use(express.urlencoded()); //Parse URL-encoded bodies
// app.use(routes)

const commitsRoute = require("./routes/commit");
app.use("/api/commit", commitsRoute);

const protocolsRoute = require("./routes/protocol");
app.use("/api/protocol", protocolsRoute);

const matchRoute = require("./routes/match");
app.use("/api/match", matchRoute);

const teamRoute = require("./routes/team");
app.use("/api/team", teamRoute);

const uploadRoute = require("./routes/upload");
app.use("/api/upload", uploadRoute);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

/*
app.use(
    /^\/app\/((?:[^\/]+\/?)*)/,
    express.static(path.join(__dirname, "public"))
);
*/
// This code makes sure that any request that does not matches a static file
// in the build folder, will just serve index.html. Client side routing is
// going to make sure that the correct content will be loaded.
app.use((req, res, next) => {
  if (/(.ico|.js|.css|.jpg|.png|.map)$/i.test(req.path)) {
    next();
  } else {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});
app.use(express.static("public"));

/*
// Routes
app.get('/', (req, res) => {
    console.log('catch ////////', req.originalUrl);
    res.json({ foo: "bar" });
    //    res.status(200).end()
})

app.get('*', function(req, res) {
    console.log('caaaaaatch all', req.originalUrl);
    res.status(404).end()
});
*/


mongoose.connect(

  process.env.MONGO_URL,
  {
    dbName: process.env.DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    user: process.env.ROBO_USER,
    pass: process.env.ROBO_PASS
  },
  () => {
    console.log("Connected to MongoDB");
  }
);
const database = mongoose.connection;
database.on("error", (error) => {
  console.log(error);
});

database.once("connected", () => {
  console.log("Database Connected");
});

app.listen(PORT, () => console.log(`Server Started at ${PORT}`));
