# Bloodboy

Blood test results tracking application built with React, TypeScript, Vite, AntDesign, and AG-Grid.

## Tech Stack

- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Vite 6** - Build tool
- **Tailwind CSS 3** - Styling
- **AntDesign 5** - UI components
- **AG-Grid 32** - Data tables
- **ESLint** - Code quality

## Getting Started

### Install dependencies

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

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## CI/CD

GitHub Actions workflow runs automatically on push and pull requests:
- **Lint**: ESLint checks code quality
- **Type Check**: TypeScript validates types
- **Build**: Ensures project builds successfully

All checks must pass before merging.

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/         # Page components
├── constants/     # Constants (including theme config)
├── types/         # TypeScript types
├── utils/         # Helper functions
├── api/           # API layer
├── App.tsx        # Root component
├── main.tsx       # Entry point
└── index.css      # Tailwind CSS imports
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_APP_TITLE=Bloodboy
VITE_API_URL=http://localhost:3000/api
VITE_ENVIRONMENT=development
```

## License

MIT License - see the [LICENSE](LICENSE) file for details.

