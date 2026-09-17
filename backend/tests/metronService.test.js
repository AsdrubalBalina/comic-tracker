
const mockFetch = jest.fn();

global.fetch = mockFetch;

const {
  getIssueById,
  getSeriesIssues,
  MetronError,
} = require("../services/metronService");

function mockResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
  };
}

function mockIssue(id) {
  return {
    id,
    series: {
      id: 90001,
      name: "Serie de prueba",
      volume: 1,
      year_began: 2026,
    },
    number: String(id),
    issue: `Número ${id}`,
    cover_date: "2026-01-01",
    store_date: "2026-01-01",
    image: null,
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

afterAll(() => {
  delete global.fetch;
});

describe("Metron: gestión de errores", () => {
  test("identifica el límite de peticiones (429)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({}, 429)
    );

    await expect(
      getIssueById(90001)
    ).rejects.toMatchObject({
      name: "MetronError",
      status: 503,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("identifica un fallo de autenticación (401)", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({}, 401)
    );

    await expect(
      getIssueById(90002)
    ).rejects.toMatchObject({
      name: "MetronError",
      status: 502,
    });
  });

  test("identifica un problema de conexión", async () => {
    mockFetch.mockRejectedValueOnce(
      new TypeError("fetch failed")
    );

    await expect(
      getIssueById(90003)
    ).rejects.toBeInstanceOf(MetronError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("Metron: caché de series", () => {
  test("reutiliza una serie descargada correctamente", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        results: [mockIssue(1)],
        next: null,
      })
    );

    const first = await getSeriesIssues(90001);
    const second = await getSeriesIssues(90001);

    expect(first).toHaveLength(1);
    expect(second).toEqual(first);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("no guarda en caché una descarga incompleta", async () => {
    mockFetch
      .mockResolvedValueOnce(
        mockResponse({
          results: [mockIssue(2)],
          next: "https://metron.cloud/api/issue/?page=2",
        })
      )
      .mockResolvedValueOnce(
        mockResponse({}, 429)
      );

    await expect(
      getSeriesIssues(90002)
    ).rejects.toMatchObject({
      status: 503,
    });

    mockFetch.mockResolvedValueOnce(
      mockResponse({
        results: [mockIssue(2)],
        next: null,
      })
    );

    const issues = await getSeriesIssues(90002);

    expect(issues).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  test("comparte la descarga entre solicitudes simultáneas", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        results: [mockIssue(3)],
        next: null,
      })
    );

    const [first, second] = await Promise.all([
      getSeriesIssues(90003),
      getSeriesIssues(90003),
    ]);

    expect(first).toEqual(second);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});