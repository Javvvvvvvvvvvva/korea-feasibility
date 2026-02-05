#!/bin/bash
# Korea Feasibility Tool - Demo Script
# 한국 도시개발 타당성 분석 도구 - 데모 스크립트

set -e

echo "=========================================="
echo "Korea Feasibility Tool - Demo"
echo "한국 도시개발 타당성 분석 도구"
echo "=========================================="
echo ""

# Check if VWorld API key is set
if [ -z "$VITE_VWORLD_API_KEY" ]; then
    echo "WARNING: VITE_VWORLD_API_KEY not set"
    echo "The tool will use mock data for parcel/zoning"
    echo ""
    echo "To enable real API data:"
    echo "  1. Get a free key at https://www.vworld.kr/dev/v4api.do"
    echo "  2. Create a .env file: echo 'VITE_VWORLD_API_KEY=your-key' > .env"
    echo ""
else
    echo "VWorld API key detected - Real data mode enabled"
    echo ""
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Build check
echo "Running build check..."
npm run build > /dev/null 2>&1 && echo "Build: OK" || { echo "Build: FAILED"; exit 1; }
echo ""

# Start dev server
echo "Starting development server..."
echo ""
echo "Open your browser to:"
echo "  http://localhost:5173"
echo ""
echo "Try these Seoul addresses:"
echo "  - 서울특별시 강남구 역삼동 808"
echo "  - 서울특별시 마포구 합정동 123"
echo "  - 서울특별시 종로구 종로1가 1"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
