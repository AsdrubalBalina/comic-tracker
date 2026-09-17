
const express = require("express");
const pool = require("../db");

const {
  getSeriesIssues,
  MetronError,
} = require("../services/metronService");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        series_external_id,
        series,
        series_year_began,
        publisher,
        series_volume,
        COUNT(*)::INTEGER AS owned_count,
        MIN(cover_url) AS cover_url,
        ARRAY_AGG(
          issue_number
          ORDER BY
            CASE
              WHEN issue_number ~ '^[0-9]+$'
              THEN issue_number::INTEGER
              ELSE NULL
            END,
            issue_number
        ) AS owned_issues
      FROM comics
      WHERE series IS NOT NULL
      GROUP BY
        series_external_id,
        series,
        series_year_began,
        series_volume,
        publisher
      ORDER BY series ASC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error(
      "Error obteniendo las series:",
      error
    );

    return res.status(500).json({
      error: "No se pudieron obtener las series",
    });
  }
});

router.get(
  "/:id/issues",
  async (req, res) => {
    try {
      const seriesId =
        Number(req.params.id);

      if (!Number.isInteger(seriesId)) {
        return res.status(400).json({
          error:
            "Identificador de serie no válido",
        });
      }

      const issues =
        await getSeriesIssues(seriesId);

      const localResult =
        await pool.query(
          `
          SELECT
            external_id
          FROM comics
          WHERE series_external_id = $1
            AND external_source = 'metron'
            AND external_id IS NOT NULL
          `,
          [seriesId]
        );

      const ownedIds =
        new Set(
          localResult.rows.map(
            (comic) =>
              Number(comic.external_id)
          )
        );

      const issuesWithOwnership =
        issues.map((issue) => ({
          ...issue,
          owned:
            ownedIds.has(
              Number(issue.externalId)
            ),
        }));

      const ownedCount =
        issuesWithOwnership.filter(
          (issue) => issue.owned
        ).length;

      return res.json({
        seriesId,
        totalCount:
          issuesWithOwnership.length,
        ownedCount,
        issues:
          issuesWithOwnership,
      });

    } catch (error) {
      console.error(
        "Error obteniendo números de la serie:",
        error
      );

      if (error instanceof MetronError) {
        return res.status(error.status).json({
          error: error.message,
        });
      }

      return res.status(500).json({
        error:
          "No se pudieron obtener los números de la serie",
      });
    }
  }
);

module.exports = router;