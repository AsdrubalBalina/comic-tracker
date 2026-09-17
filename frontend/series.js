const header =
  document.getElementById(
    "series-detail-header"
  );

const progressText =
  document.getElementById(
    "series-progress-text"
  );

const importFeedback =
  document.getElementById("series-import-feedback");

const progressFill =
  document.getElementById(
    "series-progress-fill"
  );

const progressPercentage =
  document.getElementById(
    "series-progress-percentage"
  );

const issuesGrid =
  document.getElementById(
    "series-issues-grid"
  );

const selectionCount =
  document.getElementById(
    "series-selection-count"
  );

const selectMissingButton =
  document.getElementById(
    "select-missing-button"
  );

const clearSelectionButton =
  document.getElementById(
    "clear-series-selection"
  );

const importSelectionButton =
  document.getElementById(
    "import-series-selection"
  );

const selectedIssueIds =
  new Set();

let currentIssues = [];


function getSeriesId() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  return params.get("id");
}


function createIssueCard(issue) {
  const card =
    document.createElement("article");

  card.className =
    "series-issue-card";

  if (issue.owned) {
    card.classList.add("owned");
  }


  // Portada
  const cover =
    document.createElement("div");

  cover.className =
    "series-issue-cover";

  if (issue.coverUrl) {
    const image =
      document.createElement("img");

    image.src = issue.coverUrl;

    image.alt =
      `${issue.series.name} #${issue.issueNumber}`;

    image.loading = "lazy";

    cover.appendChild(image);
  } else {
    const placeholder =
      document.createElement("span");

    placeholder.textContent =
      "Sin portada";

    cover.appendChild(placeholder);
  }


  // Información
  const info =
    document.createElement("div");

  info.className =
    "series-issue-info";


  // Número
  const number =
    document.createElement("h3");

  number.textContent =
    `#${issue.issueNumber}`;


  // Estado
  const status =
    document.createElement("span");

  status.className =
    issue.owned
      ? "issue-owned-badge"
      : "issue-missing-badge";

  status.textContent =
    issue.owned
      ? "En tu colección"
      : "Te falta";


  // Añadimos primero número y estado
  info.appendChild(number);
  info.appendChild(status);


  // Selector solo para cómics que faltan
  if (!issue.owned) {
    const selection =
      document.createElement("label");

    selection.className =
      "series-issue-selection";


    const checkbox =
      document.createElement("input");

    checkbox.type = "checkbox";

    checkbox.checked =
      selectedIssueIds.has(
        Number(issue.externalId)
      );


    const selectionText =
      document.createElement("span");

    selectionText.textContent =
      "Seleccionar";


    checkbox.addEventListener(
      "change",
      () => {
        const issueId =
          Number(issue.externalId);

        if (checkbox.checked) {
          selectedIssueIds.add(issueId);
        } else {
          selectedIssueIds.delete(issueId);
        }

        updateSelectionControls();
      }
    );


    selection.appendChild(checkbox);
    selection.appendChild(selectionText);

    // El selector queda debajo del estado
    info.appendChild(selection);
  }


  card.appendChild(cover);
  card.appendChild(info);

  return card;
}

function updateSelectionControls() {
  const count =
    selectedIssueIds.size;

  selectionCount.textContent =
    `${count} ` +
    `${count === 1
      ? "seleccionado"
      : "seleccionados"}`;

  importSelectionButton.textContent =
    `Añadir seleccionados (${count})`;

  importSelectionButton.disabled =
    count === 0;

  clearSelectionButton.disabled =
    count === 0;
}

function selectAllMissingIssues() {
  selectedIssueIds.clear();

  for (const issue of currentIssues) {
    if (!issue.owned) {
      selectedIssueIds.add(
        Number(issue.externalId)
      );
    }
  }

  renderIssues();
}

function renderIssues() {
  issuesGrid.innerHTML = "";

  for (const issue of currentIssues) {
    issuesGrid.appendChild(
      createIssueCard(issue)
    );
  }

  updateSelectionControls();
}

async function loadSeries() {
    selectedIssueIds.clear();
  const seriesId =
    getSeriesId();

  if (!seriesId) {
    header.textContent =
      "Serie no válida";

    return;
  }

  try {
    const response =
      await fetch(
        `/api/series/${seriesId}/issues`
      );

    if (!response.ok) {
      throw new Error(
        "No se pudo cargar la serie"
      );
    }

    const data =
      await response.json();
      currentIssues = data.issues;


    if (data.issues.length === 0) {
      header.textContent =
        "No se encontraron números";

      return;
    }


    const firstIssue =
      data.issues[0];

    const series =
      firstIssue.series;


    header.innerHTML = "";


    const title =
      document.createElement("h1");

    title.textContent =
       series.volume != null
        ? `${series.name} (Vol. ${series.volume})`
        : series.name;


    const metadata =
      document.createElement("p");

    const metadataParts = [];



    if (series.yearBegan) {
      metadataParts.push(
        series.yearBegan
      );
    }

    metadata.textContent =
      metadataParts.join(" · ");


    header.appendChild(title);
    header.appendChild(metadata);


    progressText.textContent =
      `${data.ownedCount} de ` +
      `${data.totalCount} números`;


    const percentage =
      data.totalCount > 0
        ? Math.round(
            (
              data.ownedCount /
              data.totalCount
            ) * 100
          )
        : 0;


    progressFill.style.width =
    `${percentage}%`;

    progressPercentage.textContent =
    `${percentage}%`;

    renderIssues();

  } catch (error) {
    console.error(error);

    header.textContent =
      "No se pudo cargar la serie";
  }
}

function clearSelection() {
  selectedIssueIds.clear();
  renderIssues();
}

selectMissingButton.addEventListener(
  "click",
  selectAllMissingIssues
);

clearSelectionButton.addEventListener(
  "click",
  clearSelection
);

async function importSelectedIssues() {
  if (selectedIssueIds.size === 0) {
    return;
  }

  const externalIds = Array.from(selectedIssueIds);

  importFeedback.hidden = true;

  importSelectionButton.disabled = true;
  importSelectionButton.textContent = "Añadiendo...";

  try {
    const response = await fetch(
      "/api/comics/import-batch",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ externalIds }),
      }
    );

    if (!response.ok) {
      throw new Error(
        "No se pudieron importar los cómics"
      );
    }

    const result = await response.json();

    const {
      imported,
      duplicates,
      failed,
    } = result.summary;

    const messages = [];

    messages.push(
      `${imported} ${
        imported === 1
          ? "cómic añadido"
          : "cómics añadidos"
      }`
    );

    if (duplicates > 0) {
      messages.push(
        `${duplicates} ya ${
          duplicates === 1
            ? "estaba"
            : "estaban"
        } en tu colección`
      );
    }

    if (failed > 0) {
      messages.push(
        `${failed} ${
          failed === 1
            ? "no se pudo añadir"
            : "no se pudieron añadir"
        }`
      );
    }

    const message = messages.join(" · ");

    selectedIssueIds.clear();

    await loadSeries();

    importFeedback.textContent = message;
    importFeedback.hidden = false;

    // Mostrar también el resultado al volver a la colección.
    sessionStorage.setItem(
      "comicTrackerImportFeedback",
      message
    );
  } catch (error) {
    console.error(error);

    importFeedback.textContent =
      "No se pudo completar la importación. Inténtalo de nuevo.";

    importFeedback.hidden = false;

    updateSelectionControls();
  }
}

importSelectionButton.addEventListener(
  "click",
  importSelectedIssues
);


loadSeries();