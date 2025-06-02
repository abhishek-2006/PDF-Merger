const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const fileList = document.getElementById('fileList');
const mergeBtn = document.getElementById('mergeBtn');

let selectedFiles = [];

// Helpers
function showToast(message, bg = "#333") {
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",
    position: "center",
    backgroundColor: bg,
  }).showToast();
}

function updateFileListUI() {
  if (selectedFiles.length === 0) {
    fileList.innerHTML = '<p>No PDFs selected yet.</p>';
    mergeBtn.disabled = true;
    return;
  }

  mergeBtn.disabled = selectedFiles.length < 2;

  const listItems = selectedFiles.map((file, i) =>
    `<li>
      ${file.name}
      <button class="remove-btn" aria-label="Remove ${file.name}" data-index="${i}">&times;</button>
    </li>`
  ).join('');

  fileList.innerHTML = `<ul>${listItems}</ul>`;
}

function addFiles(newFiles) {
  // Only PDFs, avoid duplicates by name+size
  const filtered = newFiles.filter(file => 
    file.type === "application/pdf" &&
    !selectedFiles.some(f => f.name === file.name && f.size === file.size)
  );

  if (filtered.length === 0) {
    showToast("No new PDF files added.", "#f44336");
    return;
  }

  selectedFiles = [...selectedFiles, ...filtered];
  updateFileListUI();
  showToast(`${filtered.length} file(s) added.`);
}

// Event Listeners

fileInput.addEventListener('change', e => {
  addFiles(Array.from(e.target.files));
  fileInput.value = ""; // reset input so same files can be selected again
});

dropzone.addEventListener('dragover', e => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  addFiles(Array.from(e.dataTransfer.files));
});

fileList.addEventListener('click', e => {
  if (e.target.classList.contains('remove-btn')) {
    const index = Number(e.target.dataset.index);
    selectedFiles.splice(index, 1);
    updateFileListUI();
    showToast("File removed");
  }
});

mergeBtn.addEventListener('click', async () => {
  if (selectedFiles.length < 2) {
    showToast("Select at least 2 PDFs to merge.", "#f44336");
    return;
  }

  try {
    const mergedPdf = await PDFLib.PDFDocument.create();

    for (const file of selectedFiles) {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFLib.PDFDocument.load(bytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged.pdf';
    a.click();
    URL.revokeObjectURL(url);
    selectedFiles = [];
    updateFileListUI();

    showToast("PDFs merged successfully!", "#4caf50");
  } catch (error) {
    console.error(error);
    showToast("Error merging PDFs.", "#f44336");
  }
});

// Init UI
updateFileListUI();
