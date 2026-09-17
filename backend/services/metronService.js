const METRON_BASE_URL = "https://metron.cloud/api";
const SERIES_CACHE_TTL_MS = 15 * 60 * 1000;

const seriesIssuesCache = new Map();
const pendingSeriesRequests = new Map();

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.METRON_API_TOKEN}`,
    Accept: "application/json",
  };
}

class MetronError extends Error {
  constructor(status, message) {
    super(message);

    this.name = "MetronError";
    this.status = status;
  }
}

async function fetchMetron(url) {
  let response;

  try {
    response = await fetch(url, {
      headers: getHeaders(),
    });
  } catch (error) {
    throw new MetronError(
      503,
      "No se pudo conectar con Metron. Inténtalo de nuevo más tarde."
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new MetronError(
        502,
        "No se pudo autenticar la aplicación con Metron."
      );
    }

    if (response.status === 429) {
      throw new MetronError(
        503,
        "Metron ha alcanzado su límite de peticiones. Inténtalo de nuevo más tarde."
      );
    }

    if (response.status === 404) {
      throw new MetronError(
        404,
        "El recurso solicitado no existe en Metron."
      );
    }

    if (response.status >= 500) {
      throw new MetronError(
        503,
        "Metron no está disponible temporalmente."
      );
    }

    throw new MetronError(
      502,
      "Metron ha rechazado la solicitud."
    );
  }

  try {
    return await response.json();
  } catch (error) {
    throw new MetronError(
      502,
      "Metron ha devuelto una respuesta no válida."
    );
  }
}

function normalizeIssueSummary(issue) {
  return {
    externalId: issue.id,
    source: "metron",

    series: {
      externalId: issue.series.id,
      name: issue.series.name,
      volume: issue.series.volume,
      yearBegan: issue.series.year_began,
    },

    issueNumber: issue.number,
    displayName: issue.issue,

    coverDate: issue.cover_date,
    storeDate: issue.store_date,
    coverUrl: issue.image,
  };
}

function normalizeIssueDetail(issue) {
  return {
    externalId: issue.id,
    source: "metron",

    series: {
      externalId: issue.series.id,
      name: issue.series.name,
      volume: issue.series.volume,
      yearBegan: issue.series.year_began,
      type: issue.series.series_type?.name || null,
      language: issue.series.language || null,
    },

    issueNumber: issue.number,

    storyTitles: issue.name || [],

    publisher: issue.publisher?.name || null,

    coverDate: issue.cover_date,
    storeDate: issue.store_date,

    publicationYear: issue.cover_date
      ? Number(issue.cover_date.slice(0, 4))
      : null,

    description: issue.desc || null,
    coverUrl: issue.image || null,

    creators: (issue.credits || []).flatMap((credit) =>
      credit.role.map((role) => ({
        externalId: credit.id,
        name: credit.creator,
        role: role.name,
      }))
    ),

    characters: (issue.characters || []).map((character) => ({
      externalId: character.id,
      name: character.name,
    })),

    teams: (issue.teams || []).map((team) => ({
      externalId: team.id,
      name: team.name,
    })),

    universes: (issue.universes || []).map((universe) => ({
      externalId: universe.id,
      name: universe.name,
    })),
  };
}

async function searchIssues({
  seriesName,
  number,
  year,
  page = 1,
}) {
  const params = new URLSearchParams();

  if (seriesName) {
    params.append("series_name", seriesName);
  }

  if (number) {
    params.append("number", number);
  }

  if (year) {
    params.append("cover_year", year);
  }

  params.append("page", String(page));


  const data = await fetchMetron(
    `${METRON_BASE_URL}/issue/?${params.toString()}`
  );

  return {
    count: data.count,
    next: data.next,
    previous: data.previous,
    results: data.results.map(normalizeIssueSummary),
  };
}

async function getIssueById(id) {
  const data = await fetchMetron(
    `${METRON_BASE_URL}/issue/${id}/`
  );

  return normalizeIssueDetail(data);
}

async function getSeriesIssues(seriesId) {

  const cacheKey = String(seriesId);
  const cached = seriesIssuesCache.get(cacheKey);

  if (cached) {
    if (Date.now() < cached.expiresAt) {
      return cached.issues;
    }

    seriesIssuesCache.delete(cacheKey);
  }

  // Si ya se está descargando esta serie, reutilizamos
  // la misma petición en lugar de iniciar otra.
  if (pendingSeriesRequests.has(cacheKey)) {
    return pendingSeriesRequests.get(cacheKey);
  }

  const request = (async () => {
    const issues = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const params = new URLSearchParams();

      params.append("series_id", cacheKey);
      params.append("page", String(page));

      const data = await fetchMetron(
        `${METRON_BASE_URL}/issue/?${params.toString()}`
      );

      issues.push(
        ...data.results.map(normalizeIssueSummary)
      );

      hasNextPage = data.next !== null;
      page++;
    }


    // Solo guardamos la serie si se ha descargado
    // completamente y sin errores.
    seriesIssuesCache.set(cacheKey, {
      issues,
      expiresAt: Date.now() + SERIES_CACHE_TTL_MS,
    });

    return issues;
  })();

  pendingSeriesRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    pendingSeriesRequests.delete(cacheKey);
  }
}

module.exports = {
  searchIssues,
  getIssueById,
  getSeriesIssues,
  MetronError,
};