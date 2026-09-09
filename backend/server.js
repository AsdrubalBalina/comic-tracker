const express = require("express");
const path = require("path");
const comicsRoutes = require("./routes/comicsRoutes");

const app = express();
const PORT = 3000;

app.use(express.json());


app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.use("/api/comics", comicsRoutes);

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});