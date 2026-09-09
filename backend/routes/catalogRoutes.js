const express = require("express");
const {
  searchIssues,
  getIssueById,
} = require("../services/metronService");

const router = express.Router();

router.get("/search", async (req, res) => {
  try {
    const {
      series,
      number,
      year,
    } = req.query;

    if (!series) {
      return res.status(400).json({
        error: "El parámetro series es obligatorio",
      });
    }

    const data = await searchIssues({
      seriesName: series,
      number,
      year,
    });

    res.json(data);
  } catch (error) {
    console.error("Error consultando Metron:", error);

    res.status(500).json({
      error: "No se pudo consultar el catálogo externo",
    });
  }
});

router.get("/issues/:id", async (req, res) => {
  try {
    const data = await getIssueById(req.params.id);

    res.json(data);
  } catch (error) {
    console.error(
      "Error consultando el detalle de Metron:",
      error
    );

    res.status(500).json({
      error: "No se pudo consultar el cómic",
    });
  }
});

module.exports = router;