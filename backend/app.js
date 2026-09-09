const dotenv = require("dotenv");

if (process.env.NODE_ENV === "test") {
  dotenv.config({ path: ".env.test" });
} else {
  dotenv.config({ path: ".env" });
}

const express = require("express");
const path = require("path");
const catalogRoutes = require("./routes/catalogRoutes");
const comicsRoutes = require("./routes/comicsRoutes");

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.use("/api/comics", comicsRoutes);
app.use("/api/catalog", catalogRoutes);

module.exports = app;