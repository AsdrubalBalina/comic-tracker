const pool = require("../db");

const {
  getIssueById,
} = require("../services/metronService");

const getAllComics = async (req, res) => {
  const {
    search,
    publisher,
    status,
    sort,
  } = req.query;

  let query = "SELECT * FROM comics";
  const conditions = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);

    conditions.push(`
      (
        title ILIKE $${values.length}
        OR series ILIKE $${values.length}
        OR main_character ILIKE $${values.length}
      )
    `);
  }

  if (publisher) {
    values.push(publisher);
    conditions.push(`publisher = $${values.length}`);
  }

  if (status) {
    values.push(status);
    conditions.push(`read_status = $${values.length}`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  switch (sort) {
    case "title_asc":
      query += " ORDER BY title ASC";
      break;

    case "title_desc":
      query += " ORDER BY title DESC";
      break;

    case "year_asc":
      query += " ORDER BY publication_year ASC NULLS LAST";
      break;

    case "year_desc":
      query += " ORDER BY publication_year DESC NULLS LAST";
      break;

    case "rating_asc":
      query += " ORDER BY rating ASC NULLS LAST";
      break;

    case "rating_desc":
      query += " ORDER BY rating DESC NULLS LAST";
      break;

    default:
      query += " ORDER BY id";
  }

  try {
    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener los cómics:", error);

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

const getComicById = async (req, res) => {
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
};

const createComic = async (req, res) => {
  const {
    title,
    series,
    issue_number,
    publisher,
    main_character,
    writer,
    artist,
    cover_url,
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
    writer,
    artist,
    cover_url,
    publication_year,
    read_status,
    rating
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  RETURNING *`,
  [
    title,
    series,
    issue_number,
    publisher,
    main_character,
    writer,
    artist,
    cover_url,
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
};

const updateComic = async (req, res) => {
  const { id } = req.params;

  const {
    title,
    series,
    issue_number,
    publisher,
    main_character,
    writer,
    artist,
    cover_url,
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
        writer = $6,
        artist = $7,
        cover_url = $8,
        publication_year = $9,
        read_status = $10,
        rating = $11
    WHERE id = $12
    RETURNING *`,
    [
        title,
        series,
        issue_number,
        publisher,
        main_character,
        writer,
        artist,
        cover_url,
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
};

const deleteComic = async (req, res) => {
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
};

async function importComic(req, res) {
  const client = await pool.connect();

  try {
    const { externalId } = req.body;

    if (!externalId) {
      return res.status(400).json({
        error: "externalId es obligatorio",
      });
    }

    const existingComic = await client.query(
      `
      SELECT id
      FROM comics
      WHERE external_source = $1
        AND external_id = $2
      `,
      ["metron", externalId]
    );

    if (existingComic.rows.length > 0) {
      return res.status(409).json({
        error: "Este cómic ya está en tu colección",
      });
    }

    const issue = await getIssueById(externalId);

    await client.query("BEGIN");

    const writers = issue.creators
      .filter(
        (creator) => creator.role === "Writer"
      )
      .map((creator) => creator.name);

    const artists = issue.creators
      .filter(
        (creator) => creator.role === "Artist"
      )
      .map((creator) => creator.name);

    const comicResult = await client.query(
      `
      INSERT INTO comics (
        title,
        series,
        issue_number,
        publisher,
        writer,
        artist,
        cover_url,
        publication_year,
        read_status,
        external_id,
        external_source,
        description,
        store_date
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13
      )
      RETURNING *
      `,
      [
        issue.series.name,
        issue.series.name,
        issue.issueNumber,
        issue.publisher,
        writers.join(", ") || null,
        artists.join(", ") || null,
        issue.coverUrl,
        issue.publicationYear,
        "pending",
        issue.externalId,
        issue.source,
        issue.description,
        issue.storeDate,
      ]
    );

    const comic = comicResult.rows[0];

    for (const creator of issue.creators) {
      const creatorResult = await client.query(
        `
        INSERT INTO creators (
          name,
          metron_id
        )
        VALUES ($1, $2)

        ON CONFLICT (metron_id)
        DO UPDATE SET
          name = EXCLUDED.name

        RETURNING id
        `,
        [
          creator.name,
          creator.externalId,
        ]
      );

      const creatorId =
        creatorResult.rows[0].id;

      await client.query(
        `
        INSERT INTO comic_creators (
          comic_id,
          creator_id,
          role
        )
        VALUES ($1, $2, $3)

        ON CONFLICT DO NOTHING
        `,
        [
          comic.id,
          creatorId,
          creator.role,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json(comic);
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Error importando cómic:",
      error
    );

    res.status(500).json({
      error: "No se pudo importar el cómic",
    });
  } finally {
    client.release();
  }
}

module.exports = {
  getAllComics,
  getComicById,
  createComic,
  updateComic,
  deleteComic,
  importComic,
};