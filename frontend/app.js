const comicList = document.getElementById("comic-list");

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

loadComics();