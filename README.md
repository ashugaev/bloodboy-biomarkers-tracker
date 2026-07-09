# 🩸👦🏼 Bloodboy

Track and visualize your blood test results over time with AI-powered data extraction

<h2 align="center">
  👉 <a href="https://bloodboy.report">Try it live at bloodboy.report</a> 👈
</h2>
<p align="center">
  Upload your reports, extract biomarkers, and track changes over time — right in your browser.
</p>

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![Open Source](https://img.shields.io/badge/Open%20Source-❤️-green.svg)](https://opensource.org/)

## 💎 Core Values

- **Open Source** - Free and open source software under AGPL-3.0
- **Privacy First** - Everything stays on your device
- **No Subscriptions** - Free for personal use, forever
- **You Own Your Data** - Export and backup anytime
- **Any Biomarkers** - Supports extracting and tracking any biomarkers with any units

## ✨ Features

- **PDF Upload** - Drag & drop blood test PDFs for automatic data extraction
- **Built-in PDF Viewer** - View uploaded documents directly in the app 
- **File Organization** - Organize your files and keep them in one place near to extracted values
- **AI-Powered** - OpenAI integration for intelligent biomarker extraction
- **Unit Converter** - Automatic unit conversion
- **Data Visualization** - Interactive charts and trend analysis
- **Anomaly Detection** - Filter biomarkers with strong fluctuations between tests
- **Local Storage** - All data stored locally using IndexedDB
- **Google Drive Backups** - Optional browser-based two-way backup sync with a latest file and dated history
- **Professional Tables** - Sorting, filtering, and inline editing with AG-Grid
- **Saved Filters** - Save and quickly apply custom filter combinations
- **Modern UI** - Clean interface built with AntDesign and Tailwind CSS
- **Import/Export** - Backup and restore your data anytime

## 🖼️ Screenshots

### Upload

<img src="./docs/screenshots/3.png" alt="Upload" style="max-width: 80%; border-radius: 12px; clip-path: inset(4px); display: block; margin: 0 auto;" />

### Dashboard

<img src="./docs/screenshots/1.png" alt="Dashboard" style="max-width: 80%; border-radius: 12px; clip-path: inset(4px); display: block; margin: 0 auto;" />

### Charts

<img src="./docs/screenshots/2.png" alt="Charts" style="max-width: 80%; border-radius: 12px; clip-path: inset(4px); display: block; margin: 0 auto;" />

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |

## 🛠️ Tech Stack

- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Vite 6** - Build tool
- **Tailwind CSS 3** - Styling
- **AntDesign 5** - UI components
- **AG-Grid 32** - Data tables
- **Dexie** - IndexedDB wrapper
- **OpenAI** - PDF parsing

## 📁 Project Structure

```
src/
├── components/    # Reusable UI components
├── pages/        # Page components
├── db/           # Database models and services
│   ├── models/   # Data models
│   ├── services/ # Dexie instance
│   └── hooks/    # Database hooks
├── constants/    # App constants
├── types/        # TypeScript types
├── utils/        # Helper functions
├── openai/       # OpenAI integration
└── App.tsx       # Root component
```

## 🔧 Configuration

See `.env.example` for optional environment variables. The app works fully offline without any configuration.

To enable Google Drive backups, create a Google OAuth web client and set `VITE_PUBLIC_GOOGLE_CLIENT_ID`.
Google Drive sync is two-way: newer Drive backups are restored into the browser, and newer local data is uploaded back to Drive.
Backups are stored in Google Drive as:

```text
Bloodboy Backups/
├── latest/
│   └── bloodboy_db_backup_latest.json
├── history/
│   └── YYYY/
│       └── MM/
│           └── bloodboy_db_backup_<timestamp>.json
└── bloodboy_backup_manifest.json
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue.

## 📧 Contact

For questions or feedback, reach out at [yashugaev@gmail.com](mailto:yashugaev@gmail.com)

## 📄 License

Licensed under [AGPL-3.0](LICENSE) - free and open source software.

---

<p align="center">Made with ❤️ and 🩸 for better health tracking</p>
