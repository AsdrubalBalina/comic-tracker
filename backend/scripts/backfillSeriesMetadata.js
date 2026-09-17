
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

const pool = require("../db");
const {
  getIssueById,
} = require("../services/metronService");

async function backfillSeriesMetadata() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        issue_number,
        external_id,
        series_external_id,
        series_year_began,
        series_volume
      FROM comics
      WHERE external_source = 'metron'
        AND external_id IS NOT NULL
        AND (
          series_external_id IS NULL
          OR series_year_began IS NULL
          OR series_volume IS NULL
        )
      ORDER BY id
    `);

    const comics = result.rows;

    console.log(
      `Cómics pendientes de actualizar: ${comics.length}`
    );

    for (const comic of comics) {
      try {
        console.log(
          `Actualizando ${comic.title} #${comic.issue_number}...`
        );

        const issue =
          await getIssueById(comic.external_id);

        await pool.query(
          `
          UPDATE comics
          SET
            series_external_id = $1,
            series_year_began = $2,
            series_volume = $3
          WHERE id = $4
          `,
          [
            issue.series?.externalId ?? null,
            issue.series?.yearBegan ?? null,
            issue.series?.volume ?? null,
            comic.id,
          ]
        );

        console.log(
          `✓ ${issue.series?.name ?? comic.title} ` +
          `— Vol. ${issue.series?.volume ?? "?"} ` +
          `(${issue.series?.yearBegan ?? "?"})`
        );
      } catch (error) {
        console.error(
          `✗ No se pudo actualizar el cómic ID ${comic.id}:`,
          error.message
        );
      }
    }

    console.log("Backfill terminado.");
  } catch (error) {
    console.error(
      "Error realizando el backfill:",
      error
    );
  } finally {
    await pool.end();
  }
}

backfillSeriesMetadata();