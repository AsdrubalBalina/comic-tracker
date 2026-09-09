const comicList = document.getElementById("comic-list");

let editingComicId = null;

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

      comicElement.innerHTML = `
        ${
            comic.cover_url
            ? `
                <img
                class="comic-cover"
                src="${comic.cover_url}"
                alt="Portada de ${comic.title}"
                >
            `
            : `
                <div class="comic-cover-placeholder">
                Sin portada
                </div>
            `
        }

        <h3>${comic.title}</h3>

        <p>
            <strong>Serie:</strong>
            ${comic.series || "Sin especificar"}
        </p>

        <p>
            <strong>Número:</strong>
            ${comic.issue_number || "Sin especificar"}
        </p>

        <p>
            <strong>Editorial:</strong>
            ${comic.publisher || "Sin especificar"}
        </p>

        <p>
            <strong>Guionista:</strong>
            ${comic.writer || "Sin especificar"}
        </p>

        <p>
            <strong>Dibujante:</strong>
            ${comic.artist || "Sin especificar"}
        </p>

        <p>
            <strong>Personaje:</strong>
            ${comic.main_character || "Sin especificar"}
        </p>

        <p>
            <strong>Año:</strong>
            ${comic.publication_year || "Sin especificar"}
        </p>

        <p>
            <strong>Estado:</strong>
            ${comic.read_status}
        </p>

        <p>
            <strong>Valoración:</strong>
            ${comic.rating ? `${comic.rating}/5` : "Sin valorar"}
        </p>

        <div class="comic-actions">
            <button class="edit-button" data-id="${comic.id}">
            Editar
            </button>

            <button class="delete-button" data-id="${comic.id}">
            Eliminar
            </button>
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
    button.addEventListener("click", async () => {
      const comicId = button.dataset.id;

      await editComic(comicId);
    });
  });

  deleteButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const comicId = button.dataset.id;

      await deleteComic(comicId);
    });
  });
}

async function editComic(id) {
  window.location.href = `/add-comic.html?id=${id}`;
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

    formMessage.textContent =
      "Cómic eliminado correctamente.";

    if (editingComicId === id) {
      editingComicId = null;
      comicForm.reset();

      document.querySelector(
        '#comic-form button[type="submit"]'
      ).textContent = "Añadir cómic";
    }

    await loadComics();
  } catch (error) {
    console.error(error);

    formMessage.textContent =
      "Error al eliminar el cómic.";
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