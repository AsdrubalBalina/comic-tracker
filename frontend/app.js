const comicList = document.getElementById("comic-list");
const comicForm = document.getElementById("comic-form");
const formMessage = document.getElementById("form-message");

let editingComicId = null;

async function loadComics() {
  try {
    const response = await fetch("/api/comics");

    if (!response.ok) {
      throw new Error("No se pudieron obtener los cómics");
    }

    const comics = await response.json();

    comicList.innerHTML = "";

    comics.forEach((comic) => {
      const comicElement = document.createElement("article");

      comicElement.innerHTML = `
        <h3>${comic.title}</h3>
        <p><strong>Serie:</strong> ${comic.series || "Sin especificar"}</p>
        <p><strong>Número:</strong> ${comic.issue_number || "Sin especificar"}</p>
        <p><strong>Editorial:</strong> ${comic.publisher || "Sin especificar"}</p>
        <p><strong>Personaje:</strong> ${comic.main_character || "Sin especificar"}</p>
        <p><strong>Año:</strong> ${comic.publication_year || "Sin especificar"}</p>
        <p><strong>Estado:</strong> ${comic.read_status}</p>
        <p><strong>Valoración:</strong> ${
          comic.rating ? `${comic.rating}/5` : "Sin valorar"
        }</p>

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

comicForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const comic = {
    title: document.getElementById("title").value,
    series: document.getElementById("series").value || null,
    issue_number: document.getElementById("issue_number").value || null,
    publisher: document.getElementById("publisher").value || null,
    main_character:
      document.getElementById("main_character").value || null,
    publication_year:
      Number(document.getElementById("publication_year").value) || null,
    read_status: document.getElementById("read_status").value,
    rating: Number(document.getElementById("rating").value) || null,
  };

  try {
    let response;

    if (editingComicId) {
      response = await fetch(`/api/comics/${editingComicId}`, {
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

    comicForm.reset();

    if (editingComicId) {
      formMessage.textContent = "Cómic actualizado correctamente.";
    } else {
      formMessage.textContent = "Cómic añadido correctamente.";
    }

    editingComicId = null;

    document.querySelector(
      '#comic-form button[type="submit"]'
    ).textContent = "Añadir cómic";

    await loadComics();
  } catch (error) {
    console.error(error);

    formMessage.textContent = "Error al guardar el cómic.";
  }
});

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
  try {
    const response = await fetch(`/api/comics/${id}`);

    if (!response.ok) {
      throw new Error("No se pudo obtener el cómic");
    }

    const comic = await response.json();

    document.getElementById("title").value = comic.title || "";
    document.getElementById("series").value = comic.series || "";
    document.getElementById("issue_number").value =
      comic.issue_number || "";
    document.getElementById("publisher").value = comic.publisher || "";
    document.getElementById("main_character").value =
      comic.main_character || "";
    document.getElementById("publication_year").value =
      comic.publication_year || "";
    document.getElementById("read_status").value =
      comic.read_status || "pending";
    document.getElementById("rating").value =
      comic.rating || "";

    editingComicId = id;

    document.querySelector(
      '#comic-form button[type="submit"]'
    ).textContent = "Guardar cambios";

    formMessage.textContent =
      `Editando: ${comic.title}`;
  } catch (error) {
    console.error(error);

    formMessage.textContent =
      "Error al cargar el cómic para editarlo.";
  }
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

loadComics();