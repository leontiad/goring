# GitHub Score

A modern web application for analyzing and comparing GitHub developer profiles. Built with SvelteKit and TypeScript.

## Features

- Analyze individual GitHub profiles with detailed scoring
- Compare multiple developers side by side
- View trending developers based on different timeframes
- Modern dark theme UI with smooth animations
- Responsive design for all devices

## Tech Stack

- SvelteKit
- TypeScript
- python backend (change to Rust)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/github-score.git
cd github-score
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run type checking

## Project Structure

```
src/
├── lib/
│   ├── components/     # Reusable components
│   └── types.ts        # TypeScript type definitions
├── routes/            # Page components
├── app.css           # Global styles
└── app.html          # HTML template
```
## Backend Server

```
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```


