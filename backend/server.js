const express = require("express");
const pool = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Comic Tracker API funcionando");
});

app.get("/api/comics", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM comics ORDER BY id");

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener los cómics:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
});

app.post("/api/comics", async (req, res) => {
  const {
    title,
    series,
    issue_number,
    publisher,
    main_character,
    publication_year,
    read_status,
    rating,
  } = req.body;

  if (!title) {
    return res.status(400).json({
      error: "El título es obligatorio",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO comics (
        title,
        series,
        issue_number,
        publisher,
        main_character,
        publication_year,
        read_status,
        rating
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        title,
        series,
        issue_number,
        publisher,
        main_character,
        publication_year,
        read_status || "pending",
        rating,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear el cómic:", error);

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
});

app.get("/api/comics/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM comics WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Cómic no encontrado",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener el cómic:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
});

app.put("/api/comics/:id", async (req, res) => {
  const { id } = req.params;

  const {
    title,
    series,
    issue_number,
    publisher,
    main_character,
    publication_year,
    read_status,
    rating,
  } = req.body;

  if (!title) {
    return res.status(400).json({
      error: "El título es obligatorio",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE comics
       SET title = $1,
           series = $2,
           issue_number = $3,
           publisher = $4,
           main_character = $5,
           publication_year = $6,
           read_status = $7,
           rating = $8
       WHERE id = $9
       RETURNING *`,
      [
        title,
        series,
        issue_number,
        publisher,
        main_character,
        publication_year,
        read_status,
        rating,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Cómic no encontrado",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar el cómic:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
});

app.delete("/api/comics/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM comics WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Cómic no encontrado",
      });
    }

    res.json({
      message: "Cómic eliminado correctamente",
      comic: result.rows[0],
    });
  } catch (error) {
    console.error("Error al eliminar el cómic:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});