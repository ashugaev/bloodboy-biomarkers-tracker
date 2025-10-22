#!/bin/bash

set -e

echo "Running ESLint..."
npm run lint

echo "Running TypeScript check..."
npm run typecheck

echo "✅ All checks passed!"

