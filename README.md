# PDF-Merger

A sleek, modern, and fully client-side **PDF merging tool**

## 🚀 Features

- 📁 **Drag & Drop** or Click to upload PDFs
- ➕ Upload **multiple PDFs from different folders**
- 🧹 Clean file listing with **remove** option
- ✅ Smart **validation**: requires at least 2 files to merge
- 📦 **PDF-lib** for merging directly in browser (no backend)
- 🔥 **Top-center toast notifications** for actions
- 💾 Asks user for **custom filename** on download
- 🧽 Clears selected files after merge for a fresh start
- 📱 Fully responsive UI with modern, minimal design

## 🛠️ Tech Stack

| Layer       | Tool / Library       |
|-------------|----------------------|
| Frontend    | HTML5, CSS3, JS (Vanilla) |
| PDF Engine  | [PDF-lib](https://github.com/Hopding/pdf-lib) |
| Toast UI    | [ToastifyJS](https://apvarun.github.io/toastify-js/) |
| Icons       | Custom SVGs (Cloud Upload) |

## 💡 How to Use

1. **Open** `index.html` in a browser (or use Live Server).
2. **Drag & drop** or click to select **2 or more** PDFs.
3. Click `Merge PDFs`.
4. **Enter a filename** when prompted.
5. Merged PDF will **auto-download**, and your file list will reset.

## 📂 File Structure

```bash
pdf-merger/
├── index.html          # Main UI
├── style.css           # Styles
└── script.js           # Logic (file handling, merging, toast)
