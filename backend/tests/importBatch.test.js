
const request = require("supertest");

// Simulamos PostgreSQL antes de cargar la aplicación.
jest.mock("../db", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

// Simulamos el servicio de Metron, incluido su tipo de error.
jest.mock("../services/metronService", () => {
  class MetronError extends Error {
    constructor(status, message) {
      super(message);
      this.name = "MetronError";
      this.status = status;
    }
  }

  return {
    getIssueById: jest.fn(),
    getSeriesIssues: jest.fn(),
    searchIssues: jest.fn(),
    MetronError,
  };
});

const pool = require("../db");

const {
  getIssueById,
  MetronError,
} = require("../services/metronService");

const app = require("../app");

describe("POST /api/comics/import-batch", () => {
  let client;

  beforeEach(() => {
    jest.clearAllMocks();

    client = {
      query: jest.fn(),
      release: jest.fn(),
    };

    pool.connect.mockResolvedValue(client);

    // Ninguno de los cómics existe todavía.
    pool.query.mockResolvedValue({
      rows: [],
    });

    client.query.mockImplementation(async (sql) => {
      if (sql.includes("INSERT INTO comics")) {
        return {
          rows: [{ id: 101 }],
        };
      }

      if (sql.includes("INSERT INTO creators")) {
        return {
          rows: [{ id: 201 }],
        };
      }

      return { rows: [] };
    });
  });

  test(
    "conserva los importados y detiene el lote ante un 429",
    async () => {
      getIssueById
        .mockResolvedValueOnce({
          externalId: 90001,
          source: "metron",
          series: {
            externalId: 80001,
            name: "Serie de prueba",
            volume: 1,
            yearBegan: 2026,
          },
          issueNumber: "1",
          publisher: "Editorial de prueba",
          creators: [],
          coverUrl: null,
          publicationYear: 2026,
          description: null,
          storeDate: null,
        })
        .mockRejectedValueOnce(
          new MetronError(
            503,
            "Metron ha alcanzado su límite de peticiones."
          )
        );

      const response = await request(app)
        .post("/api/comics/import-batch")
        .send({
          externalIds: [90001, 90002, 90003],
        })
        .expect(200);

      expect(response.body.imported).toEqual([
        90001,
      ]);

      expect(response.body.duplicates).toEqual([]);

      expect(response.body.failed).toEqual([
        90002,
        90003,
      ]);

      expect(response.body.summary).toEqual({
        imported: 1,
        duplicates: 0,
        failed: 2,
      });

      expect(response.body.error).toMatch(
        /límite de peticiones/
      );

      // Metron no debe recibir una petición para
      // el tercer cómic.
      expect(getIssueById).toHaveBeenCalledTimes(2);

      expect(getIssueById).toHaveBeenNthCalledWith(
        1,
        90001
      );

      expect(getIssueById).toHaveBeenNthCalledWith(
        2,
        90002
      );

      // La importación completada debe confirmarse.
      expect(client.query).toHaveBeenCalledWith(
        "COMMIT"
      );

      expect(client.release).toHaveBeenCalledTimes(1);
    }
  );

  test(
    "devuelve 503 si Metron falla antes de importar ninguno",
    async () => {
      getIssueById.mockRejectedValueOnce(
        new MetronError(
          503,
          "Metron ha alcanzado su límite de peticiones."
        )
      );

      const response = await request(app)
        .post("/api/comics/import-batch")
        .send({
          externalIds: [90004, 90005],
        })
        .expect(503);

      expect(response.body.summary).toEqual({
        imported: 0,
        duplicates: 0,
        failed: 2,
      });

      expect(response.body.failed).toEqual([
        90004,
        90005,
      ]);

      expect(getIssueById).toHaveBeenCalledTimes(1);

      // No debe abrirse ninguna transacción.
      expect(pool.connect).not.toHaveBeenCalled();
    }
  );
});