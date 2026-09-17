
const params = new URLSearchParams(window.location.search);
const comicId = params.get("id");

const pageMessage = document.getElementById("page-message");
const comicDetail = document.getElementById("comic-detail");

const statusLabels = {
  pending: "Pendiente",
  reading: "Leyendo",
  read: "Leído",
};

function hasValue(value) {
  return value !== null &&
    value !== undefined &&
    String(value).trim() !== "";
}

function addDataRow(container, label, value) {
  if (!hasValue(value)) {
    return;
  }

  const term = document.createElement("dt");
  term.textContent = label;

  const description = document.createElement("dd");
  description.textContent = String(value);

  container.append(term, description);
}

function formatDate(value) {
  if (!hasValue(value)) {
    return null;
  }

  // Evita cambios de día por diferencias de zona horaria.
  const datePart = String(value).slice(0, 10);
  const parts = datePart.split("-");

  if (parts.length !== 3) {
    return String(value);
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function renderCover(comic) {
  const container = document.getElementById("cover-container");
  container.replaceChildren();

  if (!comic.cover_url) {
    container.textContent = "Sin portada";
    return;
  }

  const image = document.createElement("img");

  image.src = comic.cover_url;
  image.alt = `Portada de ${comic.title}`;
  image.className = "comic-cover";

  image.addEventListener("error", () => {
    container.textContent = "Sin portada";
  });

  container.appendChild(image);
}

function renderComic(comic) {
  document.title = `${comic.title} | Comic Tracker`;

  renderCover(comic);

  document.getElementById("comic-title").textContent =
    comic.title;

  document.getElementById("comic-series").textContent =
    comic.series || "Cómic independiente";

  const subtitleParts = [];

  if (hasValue(comic.series_volume)) {
    subtitleParts.push(`Vol. ${comic.series_volume}`);
  }

  if (hasValue(comic.issue_number)) {
    subtitleParts.push(`N.º ${comic.issue_number}`);
  }

  document.getElementById("comic-subtitle").textContent =
    subtitleParts.join(" · ");

  document.getElementById("read-status").textContent =
    statusLabels[comic.read_status] ||
    comic.read_status ||
    "Sin estado";

  document.getElementById("edit-link").href =
    `/add-comic.html?id=${encodeURIComponent(comic.id)}`;

  // Sinopsis
  if (hasValue(comic.description)) {
    document.getElementById("comic-description").textContent =
      comic.description;

    document.getElementById("description-section").hidden = false;
  }

  // Publicación
  const publicationData =
    document.getElementById("publication-data");

  addDataRow(publicationData, "Editorial", comic.publisher);
  addDataRow(
    publicationData,
    "Año de publicación",
    comic.publication_year
  );
  addDataRow(
    publicationData,
    "Fecha de salida",
    formatDate(comic.store_date)
  );

  document.getElementById("publication-section").hidden =
    publicationData.children.length === 0;

  // Autores
  const creatorsData =
    document.getElementById("creators-data");

  addDataRow(creatorsData, "Guion", comic.writer);
  addDataRow(creatorsData, "Dibujo", comic.artist);

  document.getElementById("creators-section").hidden =
    creatorsData.children.length === 0;

  // Datos personales de la colección
  const collectionData =
    document.getElementById("collection-data");

  addDataRow(
    collectionData,
    "Estado de lectura",
    statusLabels[comic.read_status] ||
      comic.read_status ||
      "Sin estado"
  );

  const rating = Number(comic.rating);

  addDataRow(
    collectionData,
    "Valoración",
    Number.isInteger(rating) && rating >= 1 && rating <= 5
      ? "★".repeat(rating) + "☆".repeat(5 - rating)
      : "Sin valorar"
  );

  addDataRow(
    collectionData,
    "Personaje principal",
    comic.main_character
  );

  pageMessage.hidden = true;
  comicDetail.hidden = false;
}

async function loadComic() {
  if (!comicId || !/^\d+$/.test(comicId)) {
    pageMessage.textContent = "El identificador del cómic no es válido.";
    return;
  }

  try {
    const response = await fetch(
      `/api/comics/${encodeURIComponent(comicId)}`
    );

    if (response.status === 404) {
      pageMessage.textContent =
        "Este cómic no existe en tu colección.";
      return;
    }

    if (!response.ok) {
      throw new Error("No se pudo obtener el cómic");
    }

    const comic = await response.json();

    renderComic(comic);
  } catch (error) {
    console.error(error);

    pageMessage.textContent =
      "No se pudo cargar la ficha del cómic.";
  }
}

loadComic();