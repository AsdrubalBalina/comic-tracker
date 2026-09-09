const request = require("supertest");
const app = require("../app");
const pool = require("../db");

describe("Comics API", () => {
  let testComicId;

  test("GET /api/comics should return an array", async () => {
    const response = await request(app)
      .get("/api/comics")
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test("GET /api/comics/999999 should return 404", async () => {
    const response = await request(app)
      .get("/api/comics/999999")
      .expect(404);

    expect(response.body).toEqual({
      error: "Cómic no encontrado",
    });
  });

  test("POST /api/comics without title should return 400", async () => {
    const response = await request(app)
      .post("/api/comics")
      .send({
        publisher: "DC Comics",
        read_status: "read",
      })
      .expect(400);

    expect(response.body).toEqual({
      error: "El título es obligatorio",
    });
  });

  test("POST /api/comics should create a comic", async () => {
    const response = await request(app)
      .post("/api/comics")
      .send({
        title: "Test Comic",
        series: "Test Series",
        issue_number: "1",
        publisher: "Test Publisher",
        main_character: "Test Character",
        publication_year: 2026,
        read_status: "pending",
        rating: null,
      })
      .expect(201);

    expect(response.body.title).toBe("Test Comic");
    expect(response.body.publisher).toBe("Test Publisher");

    testComicId = response.body.id;
  });

  test("GET /api/comics/:id should return the created comic", async () => {
    const response = await request(app)
      .get(`/api/comics/${testComicId}`)
      .expect(200);

    expect(response.body.id).toBe(testComicId);
    expect(response.body.title).toBe("Test Comic");
  });

  test("PUT /api/comics/:id should update the comic", async () => {
    const response = await request(app)
      .put(`/api/comics/${testComicId}`)
      .send({
        title: "Updated Test Comic",
        series: "Test Series",
        issue_number: "1",
        publisher: "Test Publisher",
        main_character: "Test Character",
        publication_year: 2026,
        read_status: "read",
        rating: 5,
      })
      .expect(200);

    expect(response.body.title).toBe("Updated Test Comic");
    expect(response.body.read_status).toBe("read");
    expect(response.body.rating).toBe(5);
  });

  test("DELETE /api/comics/:id should delete the comic", async () => {
    const response = await request(app)
      .delete(`/api/comics/${testComicId}`)
      .expect(200);

    expect(response.body.message).toBe(
      "Cómic eliminado correctamente"
    );

    expect(response.body.comic.id).toBe(testComicId);
  });

  test("Deleted comic should no longer exist", async () => {
    await request(app)
      .get(`/api/comics/${testComicId}`)
      .expect(404);
  });

  afterAll(async () => {
    // Limpieza de seguridad por si un test anterior falla
    if (testComicId) {
      await pool.query(
        "DELETE FROM comics WHERE id = $1",
        [testComicId]
      );
    }

    await pool.end();
  });
});