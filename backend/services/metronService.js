const METRON_BASE_URL = "https://metron.cloud/api";

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.METRON_API_TOKEN}`,
    Accept: "application/json",
  };
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
  page = 1
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

  params.append("page", String(page) );

  const response = await fetch(
    `${METRON_BASE_URL}/issue/?${params.toString()}`,
    {
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Metron API error ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  return {
    count: data.count,
    next: data.next,
    previous: data.previous,
    results: data.results.map(normalizeIssueSummary),
  };
}

async function getIssueById(id) {
  const response = await fetch(
    `${METRON_BASE_URL}/issue/${id}/`,
    {
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Metron API error ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  return normalizeIssueDetail(data);
}

module.exports = {
  searchIssues,
  getIssueById,
};