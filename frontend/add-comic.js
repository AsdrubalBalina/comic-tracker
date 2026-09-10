const comicForm = document.getElementById("comic-form");
const formMessage = document.getElementById("form-message");
const pageDescription = document.getElementById("page-description");
const pageTitle = document.querySelector("h1");
const submitButton = comicForm.querySelector(
  'button[type="submit"]'
);

const params = new URLSearchParams(window.location.search);
const comicId = params.get("id");

const catalogSearchForm =
  document.getElementById("catalog-search-form");

const catalogQuery =
  document.getElementById("catalog-query");

const catalogNumber =
  document.getElementById("catalog-number");

const catalogYear =
  document.getElementById("catalog-year");

const catalogResults =
  document.getElementById("catalog-results");

const catalogMessage =
  document.getElementById("catalog-message");

const catalogPagination =
  document.getElementById("catalog-pagination");

const catalogPrevious =
  document.getElementById("catalog-previous");

const catalogNext =
  document.getElementById("catalog-next");

const catalogPageInfo =
  document.getElementById("catalog-page-info");

let currentCatalogPage = 1;

let currentCatalogSearch = {
  series: "",
  number: "",
  year: "",
};

async function loadComicForEditing() {
  if (!comicId) {
    return;
  }

  try {
    const response = await fetch(`/api/comics/${comicId}`);

    if (!response.ok) {
      throw new Error("No se pudo obtener el cómic");
    }

    const comic = await response.json();

    document.getElementById("title").value =
      comic.title || "";

    document.getElementById("series").value =
      comic.series || "";

    document.getElementById("issue_number").value =
      comic.issue_number || "";

    document.getElementById("publisher").value =
      comic.publisher || "";

    document.getElementById("main_character").value =
      comic.main_character || "";

    document.getElementById("writer").value =
      comic.writer || "";

    document.getElementById("artist").value =
      comic.artist || "";

    document.getElementById("cover_url").value =
      comic.cover_url || "";

    document.getElementById("publication_year").value =
      comic.publication_year || "";

    document.getElementById("read_status").value =
      comic.read_status || "pending";

    document.getElementById("rating").value =
      comic.rating || "";

    pageTitle.textContent = "Editar cómic";
    submitButton.textContent = "Guardar cambios";
    pageDescription.textContent =
      "Modifica los datos de tu cómic";
  } catch (error) {
    console.error(error);

    formMessage.textContent =
      "Error al cargar el cómic.";
  }
}

comicForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const comic = {
    title:
      document.getElementById("title").value,

    series:
      document.getElementById("series").value || null,

    issue_number:
      document.getElementById("issue_number").value || null,

    publisher:
      document.getElementById("publisher").value || null,

    main_character:
      document.getElementById("main_character").value || null,

    writer:
      document.getElementById("writer").value || null,

    artist:
      document.getElementById("artist").value || null,

    cover_url:
      document.getElementById("cover_url").value || null,

    publication_year:
      Number(
        document.getElementById("publication_year").value
      ) || null,

    read_status:
      document.getElementById("read_status").value,

    rating:
      Number(
        document.getElementById("rating").value
      ) || null,
  };

  try {
    let response;

    if (comicId) {
      response = await fetch(`/api/comics/${comicId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(comic),
      });
    } else {
      response = await fetch("/api/comics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(comic),
      });
    }

    if (!response.ok) {
      throw new Error("No se pudo guardar el cómic");
    }

    window.location.href = "/";
  } catch (error) {
    console.error(error);

    formMessage.textContent =
      "Error al guardar el cómic.";
  }
});

function createCatalogResult(issue, collectionIds) {
  const article = document.createElement("article");
  article.classList.add("catalog-result");

  const coverContainer = document.createElement("div");
  coverContainer.classList.add("catalog-result-cover");

  if (issue.coverUrl) {
    const image = document.createElement("img");

    image.src = issue.coverUrl;
    image.alt = `Portada de ${
      issue.displayName ||
      issue.series?.name ||
      "cómic"
    }`;

    image.loading = "lazy";

    image.addEventListener("error", () => {
      image.remove();

      const placeholder = document.createElement("span");
      placeholder.textContent = "Sin portada";

      coverContainer.appendChild(placeholder);
    });

    coverContainer.appendChild(image);
  } else {
    const placeholder = document.createElement("span");
    placeholder.textContent = "Sin portada";

    coverContainer.appendChild(placeholder);
  }

  const info = document.createElement("div");
  info.classList.add("catalog-result-info");

  const title = document.createElement("h3");

  title.textContent =
    issue.series?.name ||
    issue.displayName ||
    "Cómic sin título";

  const metadata = document.createElement("p");
  metadata.classList.add("catalog-result-metadata");

  const issueYear = issue.coverDate
    ? issue.coverDate.slice(0, 4)
    : "Año desconocido";

  const issueNumber = issue.issueNumber
    ? `#${issue.issueNumber}`
    : "Número desconocido";

  metadata.textContent =
    `${issueNumber} · ${issueYear}`;

  const button =
    document.createElement("button");

  button.type = "button";

  button.classList.add(
    "catalog-select-button"
  );

  const alreadyAdded =
    collectionIds.has(
      Number(issue.externalId)
    );

  if (alreadyAdded) {
    button.textContent =
      "Ya en tu colección";

    button.disabled = true;
  } else {
    button.textContent =
      "Añadir a mi colección";

    button.addEventListener(
      "click",
      async () => {
        const imported =
          await importComicFromCatalog(
            issue.externalId,
            button
          );

        if (imported) {
          collectionIds.add(
            Number(issue.externalId)
          );
        }
      }
    );
  }

  info.appendChild(title);
  info.appendChild(metadata);
  info.appendChild(button);

  article.appendChild(coverContainer);
  article.appendChild(info);

  return article;
}

async function getCollectionExternalIds() {
  const response = await fetch("/api/comics");

  if (!response.ok) {
    throw new Error(
      "No se pudo consultar la colección"
    );
  }

  const comics = await response.json();

  return new Set(
    comics
      .filter(
        (comic) =>
          comic.external_source === "metron" &&
          comic.external_id !== null
      )
      .map(
        (comic) => Number(comic.external_id)
      )
  );
}

async function searchCatalog(
  series,
  number,
  year,
  page = 1
) {
  catalogResults.replaceChildren();
  catalogPagination.hidden = true;

  catalogMessage.textContent =
    "Buscando en el catálogo...";

  try {
    const params =
      new URLSearchParams();

    params.append(
      "series",
      series
    );

    if (number) {
      params.append(
        "number",
        number
      );
    }

    if (year) {
      params.append(
        "year",
        year
      );
    }

    params.append(
      "page",
      page
    );

    const response = await fetch(
      `/api/catalog/search?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(
        "No se pudo consultar el catálogo"
      );
    }

    const data =
      await response.json();

    const collectionIds =
      await getCollectionExternalIds();

    if (!data.results.length) {
      catalogMessage.textContent =
        "No se encontraron resultados.";

      return;
    }

    currentCatalogPage = Number(page);

    currentCatalogSearch = {
      series,
      number,
      year,
    };

    catalogMessage.textContent =
      `${data.count} resultados encontrados`;

    data.results.forEach((issue) => {
      catalogResults.appendChild(
        createCatalogResult(
          issue,
          collectionIds
        )
      );
    });

    catalogPageInfo.textContent =
      `Página ${currentCatalogPage}`;

    catalogPrevious.disabled =
    data.previous === null;

    catalogNext.disabled =
    data.next === null;

    catalogPagination.hidden =
    data.previous === null && data.next === null;
    
    catalogResults.scrollIntoView({
      behavior: "auto",
      block: "start",
    });
    

  } catch (error) {
    console.error(error);

    catalogMessage.textContent =
      "No se pudo consultar Metron.";

    catalogPagination.hidden = true;
  }
}

async function loadCatalogIssue(id) {
  catalogMessage.textContent =
    "Cargando datos del cómic...";

  try {
    const response = await fetch(
      `/api/catalog/issues/${id}`
    );

    if (!response.ok) {
      throw new Error(
        "No se pudo obtener el detalle del cómic"
      );
    }

    const issue =
      await response.json();

    fillFormFromCatalog(issue);

    catalogMessage.textContent =
      "Datos cargados. Puedes revisarlos antes de guardar.";

    document
      .getElementById("comic-form")
      .scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  } catch (error) {
    console.error(error);

    catalogMessage.textContent =
      "No se pudieron cargar los datos del cómic.";
  }
}

function getCreatorNamesByRole(
  creators,
  role
) {
  return [
    ...new Set(
      creators
        .filter(
          (creator) =>
            creator.role === role
        )
        .map(
          (creator) =>
            creator.name
        )
    ),
  ];
}

function fillFormFromCatalog(issue) {
  const writers =
    getCreatorNamesByRole(
      issue.creators,
      "Writer"
    );

  const artists =
    getCreatorNamesByRole(
      issue.creators,
      "Artist"
    );

  document.getElementById("title").value =
    issue.series?.name || "";

  document.getElementById("series").value =
    issue.series?.name || "";

  document.getElementById("issue_number").value =
    issue.issueNumber || "";

  document.getElementById("publisher").value =
    issue.publisher || "";

  document.getElementById("writer").value =
    writers.join(", ");

  document.getElementById("artist").value =
    artists.join(", ");

  document.getElementById("cover_url").value =
    issue.coverUrl || "";

  document.getElementById(
    "publication_year"
  ).value =
    issue.publicationYear || "";
}

catalogSearchForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const query =
      catalogQuery.value.trim();

    const number =
      catalogNumber.value.trim();

    const year =
      catalogYear.value.trim();

    if (!query) {
      return;
    }

    searchCatalog(
      query,
      number,
      year,
      1
    );
  }
);

catalogPrevious.addEventListener(
  "click",
  () => {
    if (currentCatalogPage <= 1) {
      return;
    }

    searchCatalog(
      currentCatalogSearch.series,
      currentCatalogSearch.number,
      currentCatalogSearch.year,
      currentCatalogPage - 1
    );
  }
);

catalogNext.addEventListener(
  "click",
  () => {
    searchCatalog(
      currentCatalogSearch.series,
      currentCatalogSearch.number,
      currentCatalogSearch.year,
      currentCatalogPage + 1
    );
  }
);

async function importComicFromCatalog(
  externalId,
  button
) {
  if (
    button.dataset.importing === "true"
  ) {
    return false;
  }

  button.dataset.importing =
    "true";

  const originalText =
    button.textContent;

  button.disabled = true;

  button.textContent =
    "Añadiendo...";

  catalogMessage.textContent =
    "Añadiendo cómic a tu colección...";

  try {
    const response = await fetch(
      "/api/comics/import",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          externalId,
        }),
      }
    );

    const data =
      await response.json();

    if (response.status === 409) {
      catalogMessage.textContent =
        "Este cómic ya está en tu colección.";

      button.textContent =
        "Ya en tu colección";

      button.disabled = true;

      return true;
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        "No se pudo importar el cómic"
      );
    }

    catalogMessage.textContent =
      "Cómic añadido correctamente.";

    button.textContent =
      "Ya en tu colección";

    button.disabled = true;

    return true;
  } catch (error) {
    console.error(error);

    catalogMessage.textContent =
      "No se pudo añadir el cómic.";

    button.disabled = false;

    button.textContent =
      originalText;

    button.dataset.importing =
      "false";

    return false;
  }
}

loadComicForEditing();