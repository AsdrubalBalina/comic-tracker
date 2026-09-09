const comicForm = document.getElementById("comic-form");
const formMessage = document.getElementById("form-message");
const pageDescription = document.getElementById("page-description");
const pageTitle = document.querySelector("h1");
const submitButton = comicForm.querySelector(
  'button[type="submit"]'
);

const params = new URLSearchParams(window.location.search);
const comicId = params.get("id");

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
    pageDescription.textContent = "Modifica los datos de tu cómic";

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

    const savedComic = await response.json();

    if (comicId) {
      window.location.href = "/";
    } else {
      formMessage.textContent =
        `${savedComic.title} añadido correctamente.`;

      comicForm.reset();
    }

  } catch (error) {
    console.error(error);

    formMessage.textContent =
      "Error al guardar el cómic.";
  }
});

loadComicForEditing();