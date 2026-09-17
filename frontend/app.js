
const comicList = document.getElementById("comic-list");

const comicsView =
  document.getElementById("comics-view");

const comicsViewButton =
  document.getElementById("comics-view-button");

const seriesViewButton =
  document.getElementById("series-view-button");

const seriesView =
  document.getElementById("series-view");

const seriesGrid =
  document.getElementById("series-grid");

async function loadComics() {
  try {
    const search = document.getElementById("search")?.value.trim() || "";
    const publisher =
      document.getElementById("publisher-filter")?.value.trim() || "";
    const status =
      document.getElementById("status-filter")?.value || "";
    const sort =
      document.getElementById("sort")?.value || "";

    const params = new URLSearchParams();

    if (search) {
      params.append("search", search);
    }

    if (publisher) {
      params.append("publisher", publisher);
    }

    if (status) {
      params.append("status", status);
    }

    if (sort) {
      params.append("sort", sort);
    }

    const queryString = params.toString();

    const url = queryString
      ? `/api/comics?${queryString}`
      : "/api/comics";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("No se pudieron obtener los cómics");
    }

    const comics = await response.json();

    comicList.innerHTML = "";

    if (comics.length === 0) {
      comicList.innerHTML = `
        <p>No se encontraron cómics.</p>
      `;

      return;
    }

    comics.forEach((comic) => {
      const comicElement = document.createElement("article");

      comicElement.style.cursor = "pointer";

      comicElement.addEventListener("click", (event) => {
        if (event.target.closest(".comic-actions")) {
          return;
        }

        window.location.assign(`/comic.html?id=${comic.id}`);
      });

      const statusLabels = {
        pending: "Pendiente",
        reading: "Leyendo",
        read: "Leído",
        };

        const ratingStars = comic.rating
        ? "★".repeat(comic.rating) +
            "☆".repeat(5 - comic.rating)
        : "Sin valorar";

        comicElement.innerHTML = `
        <div class="comic-cover-container">

            ${
            comic.cover_url
                ? `
                <img
                    class="comic-cover"
                    src="${comic.cover_url}"
                    alt="Portada de ${comic.title}"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >
                `
                : `
                <div class="comic-cover-placeholder">
                    <span>Sin portada</span>
                </div>
                `
            }

            <span class="comic-status comic-status-${comic.read_status}">
            ${statusLabels[comic.read_status] || comic.read_status}
            </span>

        </div>

        <div class="comic-info">

            <div class="comic-main-info">

            <h3>${comic.title}</h3>

            <p class="comic-series">
                ${comic.series || "Sin serie"}
                ${
                comic.publication_year
                    ? ` · ${comic.publication_year}`
                    : ""
                }
            </p>

            </div>

            <div class="comic-creators">

            ${
                comic.writer
                ? `
                    <p>
                    <span>Guion</span>
                    ${comic.writer}
                    </p>
                `
                : ""
            }

            ${
                comic.artist
                ? `
                    <p>
                    <span>Dibujo</span>
                    ${comic.artist}
                    </p>
                `
                : ""
            }

            </div>

            <div class="comic-rating">
            ${ratingStars}
            </div>

            <div class="comic-actions">

            <button
                class="edit-button"
                data-id="${comic.id}"
            >
                Editar
            </button>

            <button
                class="delete-button"
                data-id="${comic.id}"
            >
                Eliminar
            </button>

            </div>

        </div>
        `;

      comicList.appendChild(comicElement);
    });

    addComicActionListeners();
  } catch (error) {
    console.error(error);

    comicList.innerHTML = `
      <p>No se pudieron cargar los cómics.</p>
    `;
  }
}

function createSeriesCard(series) {
  const article =
    document.createElement("article");

  article.classList.add(
    "series-card"
  );


  // Portada
  const cover =
    document.createElement("div");

  cover.classList.add(
    "series-card-cover"
  );

  if (series.cover_url) {
    const image =
      document.createElement("img");

    image.src =
      series.cover_url;

    image.alt =
      `Portada de ${series.series}`;

    image.loading = "lazy";

    image.addEventListener(
      "error",
      () => {
        image.remove();
        cover.textContent =
          "Sin portada";
      }
    );

    cover.appendChild(image);
  } else {
    cover.textContent =
      "Sin portada";
  }


  // Contenido
  const content =
    document.createElement("div");

  content.classList.add(
    "series-card-content"
  );


  // Título y volumen
  const title =
    document.createElement("h2");

  title.textContent =
    series.series_volume != null
      ? `${series.series} (Vol. ${series.series_volume})`
      : series.series;


  // Editorial y año
  const metadata =
    document.createElement("p");

  const metadataParts = [];

  if (series.publisher) {
    metadataParts.push(
      series.publisher
    );
  }

  if (series.series_year_began) {
    metadataParts.push(
      series.series_year_began
    );
  }

  metadata.textContent =
    metadataParts.join(" · ");


  // Cantidad de números en la colección
  const count =
    document.createElement("p");

  count.classList.add(
    "series-owned-count"
  );

  count.textContent =
    `${series.owned_count} ` +
    `${
      series.owned_count === 1
        ? "número"
        : "números"
    } en tu colección`;


  // Botón para acceder al volumen
  const viewButton =
    document.createElement("a");

  viewButton.className =
    "series-view-button";

  viewButton.textContent =
    "Ver volumen";

  if (series.series_external_id) {
    viewButton.href =
      `/series.html?id=${series.series_external_id}`;
  } else {
    viewButton.textContent =
      "Sin datos de Metron";

    viewButton.classList.add(
      "disabled"
    );
  }


  // Construcción de la tarjeta
  content.appendChild(title);
  content.appendChild(metadata);
  content.appendChild(count);
  content.appendChild(viewButton);

  article.appendChild(cover);
  article.appendChild(content);

  return article;
}

async function loadSeries() {
  seriesGrid.replaceChildren();

  try {
    const response =
      await fetch("/api/series");

    if (!response.ok) {
      throw new Error(
        "No se pudieron cargar las series"
      );
    }

    const series =
      await response.json();

    if (!series.length) {
      const message =
        document.createElement("p");

      message.textContent =
        "Todavía no tienes series en tu colección.";

      seriesGrid.appendChild(
        message
      );

      return;
    }

    series.forEach((item) => {
      seriesGrid.appendChild(
        createSeriesCard(item)
      );
    });
  } catch (error) {
    console.error(error);

    const message =
      document.createElement("p");

    message.textContent =
      "No se pudieron cargar las series.";

    seriesGrid.appendChild(
      message
    );
  }
}

function addComicActionListeners() {
  const editButtons = document.querySelectorAll(".edit-button");
  const deleteButtons = document.querySelectorAll(".delete-button");

  editButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const comicId = button.dataset.id;
    editComic(comicId);
    });
  });
  

  deleteButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const comicId = button.dataset.id;

      await deleteComic(comicId);
    });
  });
}

function editComic(id) {
  window.location.assign(`/add-comic.html?id=${id}`);
}

async function deleteComic(id) {
  const confirmed = confirm(
    "¿Seguro que quieres eliminar este cómic?"
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/comics/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("No se pudo eliminar el cómic");
    }

    window.location.reload();

  } catch (error) {
    console.error(error);
    alert("Error al eliminar el cómic.");
  }
}

const applyFiltersButton =
  document.getElementById("apply-filters");

const clearFiltersButton =
  document.getElementById("clear-filters");

applyFiltersButton.addEventListener("click", () => {
  loadComics();
});

clearFiltersButton.addEventListener("click", () => {
  document.getElementById("search").value = "";
  document.getElementById("publisher-filter").value = "";
  document.getElementById("status-filter").value = "";
  document.getElementById("sort").value = "";

  loadComics();
});

const collectionImportFeedback =
  document.getElementById("collection-import-feedback");

const pendingImportFeedback =
  sessionStorage.getItem("comicTrackerImportFeedback");

if (pendingImportFeedback) {
  collectionImportFeedback.textContent =
    pendingImportFeedback;

  collectionImportFeedback.hidden = false;

  sessionStorage.removeItem(
    "comicTrackerImportFeedback"
  );
}

loadComics();

comicsViewButton.addEventListener(
  "click",
  () => {
    seriesView.hidden = true;
    comicsView.hidden = false;

    comicsViewButton.classList.add(
      "active"
    );

    seriesViewButton.classList.remove(
      "active"
    );
  }
);

seriesViewButton.addEventListener(
  "click",
  async () => {
    comicsView.hidden = true;
    seriesView.hidden = false;

    seriesViewButton.classList.add(
      "active"
    );

    comicsViewButton.classList.remove(
      "active"
    );

    await loadSeries();
  }
);