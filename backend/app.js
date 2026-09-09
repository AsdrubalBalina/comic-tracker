const express = require("express");
const path = require("path");
const comicsRoutes = require("./routes/comicsRoutes");

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.use("/api/comics", comicsRoutes);

module.exports = app;