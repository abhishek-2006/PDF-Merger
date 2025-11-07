// Set up the worker for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const fileListContainer = document.getElementById("fileListContainer");
const mergeBtn = document.getElementById("mergeBtn");

let selectedFiles = []; // Array of File objects

// Toast helper
function showToast(message, bg = "#333") {
  // Use CSS variables for consistent UI colors if available
  const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue(bg) || bg;
  
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",
    position: "center",
    backgroundColor: backgroundColor.trim() || '#333',
  }).showToast();
}

/**
 * Generates and appends a thumbnail preview of the first page of a PDF file.
 * @param {File} file - The PDF file object.
 * @param {HTMLElement} previewElement - The DOM element to append the canvas to.
 * @param {HTMLElement} pageCountElement - The DOM element to display the page count. <-- ADDED
 */
async function generatePreview(file, previewElement, pageCountElement) {
  previewElement.innerHTML = ""; // Clear existing content
  pageCountElement.textContent = '...'; // Show loading state for page count <-- ADDED
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // 1. Get and display page count
    const pageCount = pdfDocument.numPages;
    pageCountElement.textContent = `${pageCount} Page${pageCount !== 1 ? 's' : ''}`; // <-- ADDED
    
    const page = await pdfDocument.getPage(1); // First page only

    const viewport = page.getViewport({ scale: 1 });
    const desiredHeight = 160; // Match tile preview height
    const scale = desiredHeight / viewport.height;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;

    await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
    previewElement.appendChild(canvas);
  } catch (error) {
    console.error("Error generating PDF preview:", error);
    previewElement.innerHTML =
      `<span style="font-size:0.7rem; color:var(--danger-red);">No Preview</span>`;
    pageCountElement.textContent = 'Error'; // <-- ADDED
  }
}

// Update file list UI
function updateFileListUI() {
  if (selectedFiles.length === 0) {
    fileListContainer.innerHTML =
      '<p style="text-align: center; color: #777; margin: 2rem 0;">No PDFs selected yet. Drag files into the dropzone above.</p>'; // Updated message
    mergeBtn.disabled = true;
    return;
  }

  mergeBtn.disabled = selectedFiles.length < 2;

  let list = document.getElementById("fileList");
  if (!list) {
    list = document.createElement("ul");
    list.id = "fileList";
    fileListContainer.innerHTML = "";
    fileListContainer.appendChild(list);
  }

  list.innerHTML = "";
  selectedFiles.forEach((file, i) => {
    const listItem = document.createElement("li");
    listItem.dataset.index = i;

    // Structure updated to include page-count span
    listItem.innerHTML = `
      <button class="remove-btn" aria-label="Remove ${escapeHtml(file.name)}" data-index="${i}">&times;</button>
      <div class="file-preview" id="preview-${i}"></div>
      <span class="page-count" id="page-count-${i}">...</span>       <div class="file-info">
        <span class="file-name">${escapeHtml(file.name)}</span>
      </div>
    `;

    list.appendChild(listItem);

    // Pass both elements to the preview generator
    const previewElement = document.getElementById(`preview-${i}`);
    const pageCountElement = document.getElementById(`page-count-${i}`); // <-- ADDED
    generatePreview(file, previewElement, pageCountElement); // <-- UPDATED
  });

  if (!list.sortable) initSortable(list);
}

// Initialize SortableJS
function initSortable(listElement) {
  if (listElement.sortable) listElement.sortable.destroy();

  listElement.sortable = Sortable.create(listElement, {
    animation: 150,
    // handle: ".drag-handle", // Entire tile is draggable
    ghostClass: "sortable-ghost",
    onEnd(evt) {
      const [movedItem] = selectedFiles.splice(evt.oldIndex, 1);
      selectedFiles.splice(evt.newIndex, 0, movedItem);
      updateFileListUI();
      showToast("PDF order updated!", '--info-blue'); // <-- USE CSS VAR
    },
  });
}

// Add new files (keeps order & avoids duplicates by name+size)
function addFiles(newFiles) {
  const filtered = Array.from(newFiles).filter(
    (file) =>
      file.type === "application/pdf" &&
      !selectedFiles.some((f) => f.name === file.name && f.size === file.size)
  );

  if (filtered.length === 0) {
    showToast("No new PDF files added or duplicates detected.", '--danger-red'); // <-- USE CSS VAR
    return;
  }

  selectedFiles = [...selectedFiles, ...filtered];
  updateFileListUI();
  showToast(`${filtered.length} PDF file(s) added.`, '--success-green'); // <-- USE CSS VAR
}

// Remove file (event delegation)
fileListContainer.addEventListener("click", (e) => {
  if (!e.target.classList.contains("remove-btn")) return;

  const listItem = e.target.closest("li");
  const list = document.getElementById("fileList");
  const index = Array.from(list.children).indexOf(listItem);

  if (index !== -1) {
    selectedFiles.splice(index, 1);
    updateFileListUI();
    showToast("File removed", '--danger-red'); // <-- USE CSS VAR
  }
});

// Merge PDFs
mergeBtn.addEventListener("click", async () => {
  if (selectedFiles.length < 2) {
    showToast("Select at least 2 PDFs to merge.", '--danger-red'); // <-- USE CSS VAR
    return;
  }

  mergeBtn.disabled = true;
  const originalText = mergeBtn.textContent;
  mergeBtn.textContent = "Merging...";

  try {
    const mergedPdf = await PDFLib.PDFDocument.create();

    for (const file of selectedFiles) {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([mergedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "merged_pdf_final.pdf"; // Renamed file
    a.click();
    URL.revokeObjectURL(url);

    selectedFiles = [];
    updateFileListUI();
    showToast("PDFs merged successfully and downloaded!", '--success-green'); // <-- USE CSS VAR
  } catch (error) {
    console.error("Merge Error:", error);
    showToast("Error merging PDFs. Check console for details.", '--danger-red'); // <-- USE CSS VAR
  } finally {
    mergeBtn.textContent = originalText;
    if (selectedFiles.length >= 2) mergeBtn.disabled = false;
  }
});

// Click the dropzone to open file selector
dropzone.addEventListener("click", (e) => {
  // only trigger click on fileInput if user clicked the dropzone boundary, icon, or paragraph
  if (e.target === dropzone || e.target.closest("svg") || e.target.tagName === "P") {
    fileInput.click();
  }
});

// Keyboard accessibility for dropzone (Enter/Space opens file picker)
dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});

// File input change
fileInput.addEventListener("change", (e) => {
  if (e.target.files && e.target.files.length > 0) {
    addFiles(e.target.files);
    // reset input so same file can be re-selected if needed
    e.target.value = "";
  }
});

// Drag + drop behavior
["dragenter", "dragover"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("dragover");
  });
});

dropzone.addEventListener("drop", (e) => {
  const dt = e.dataTransfer;
  if (!dt) return;
  const files = dt.files;
  if (files && files.length > 0) {
    addFiles(files);
  }
});

// Utility: escape HTML in filenames to avoid injection in template strings
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Init UI
updateFileListUI();
