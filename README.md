# 🩸👦 Bloodboy

Track and visualize your blood test results over time with AI-powered data extraction

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)

## 💎 Core Values

- **Privacy First** - All processing happens locally in your browser
- **No Subscriptions** - Free and open source forever
- **You Own Your Data** - Full control with import/export capabilities

## ✨ Features

- **PDF Upload** - Drag & drop blood test PDFs for automatic data extraction
- **AI-Powered** - OpenAI integration for intelligent biomarker extraction
- **Data Visualization** - Interactive charts and trend analysis
- **Local Storage** - All data stored locally using IndexedDB
- **Professional Tables** - Sorting, filtering, and inline editing with AG-Grid
- **Modern UI** - Clean interface built with AntDesign and Tailwind CSS
- **Import/Export** - Backup and restore your data anytime

## 🖼️ Screenshots

<!-- Add your screenshots here:
![Upload Interface](./docs/screenshots/upload.png)
![Biomarker Table](./docs/screenshots/biomarkers.png)
![Charts](./docs/screenshots/charts.png)
-->

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

Optional environment variables:

```env
VITE_APP_TITLE=Bloodboy
VITE_API_URL=http://localhost:3000/api
VITE_ENVIRONMENT=development
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">Made with ❤️ and 🩸 for better health tracking</p>
