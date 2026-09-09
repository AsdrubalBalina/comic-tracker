const express = require("express");
const comicsRoutes = require("./routes/comicsRoutes");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Comic Tracker API funcionando");
});

app.use("/api/comics", comicsRoutes);

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});