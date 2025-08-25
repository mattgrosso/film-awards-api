# Academy Awards API 🏆

A comprehensive REST API for Academy Awards data from 1928 to 2024. Query Oscar winners, nominees, and detailed film information with powerful filtering capabilities.

## 🌐 Live API

**Base URL:** `https://web-production-b8145.up.railway.app`  
**Documentation:** `https://web-production-b8145.up.railway.app/api-docs/`

## ✨ Features

- 🎬 **Complete Oscar Database**: Awards data from 1928-2024
- 🔍 **Flexible Querying**: Filter by year, person, category, winner status, and more
- 📚 **Interactive Documentation**: Swagger UI with live examples
- 🚀 **Fast & Reliable**: SQLite database with optimized queries
- 🌐 **CORS Enabled**: Ready for web applications

## 📋 Available Endpoints

### Query-Based Endpoint
```bash
GET /awards?year=2020&category=best+picture&isWinner=true
```

**Query Parameters:**
- `year` - Filter by ceremony year
- `imdb` - Filter by IMDB ID  
- `tmdb` - Filter by TMDB ID
- `title` - Search by film title
- `category` - Filter by award category
- `person` - Search by person name
- `isWinner` - Filter winners only (`true`/`false`)
- `isActing` - Filter acting categories (`true`/`false`)

### Individual Endpoints
- `GET /awards/person/{name}` - Awards for a specific person
- `GET /awards/title/{title}` - Awards for a specific film
- `GET /awards/category/{category}` - Awards in a specific category
- `GET /awards/imdb/{id}` - Awards for an IMDB ID
- `GET /awards/tmdb/{id}` - Awards for a TMDB ID

## 🚀 Getting Started

### Local Development

```bash
# Clone the repository
git clone https://github.com/mattgrosso/film-awards-api.git
cd film-awards-api

# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Or start production server
npm start

# Test the API
npm run test-api
```

The server will run on `http://localhost:3000`

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run deploy` - Deploy to Railway (commits & pushes to GitHub)
- `npm run test-api` - Quick API test

## 🚢 Deployment

This API is deployed on [Railway](https://railway.app) with automatic GitHub deployments.

### Deploy Changes

```bash
# Simple one-command deployment
npm run deploy
```

The deploy script will:
1. Check for uncommitted changes and offer to commit them
2. Push changes to GitHub
3. Railway automatically deploys from GitHub
4. Display the live URL and deployment status

### Manual Deployment

```bash
git add .
git commit -m "Your changes"
git push origin main
# Railway auto-deploys from GitHub pushes
```

## 📖 API Examples

### Get 2020 Best Picture Winner
```bash
curl "https://web-production-b8145.up.railway.app/awards?year=2020&category=best+picture&isWinner=true"
```

### Find All Meryl Streep Nominations
```bash
curl "https://web-production-b8145.up.railway.app/awards/person/meryl-streep"
```

### Get All Acting Winners from 2021
```bash
curl "https://web-production-b8145.up.railway.app/awards?year=2021&isActing=true&isWinner=true"
```

## 📊 Data Format

Each award record includes:
- Film details (title, IMDB/TMDB IDs, release date, poster)
- Category and ceremony information
- Winner/nominee status
- People involved (with IMDB/TMDB data and photos)
- Additional notes and trivia

## 🔧 Tech Stack

- **Runtime:** Node.js + Express
- **Database:** SQLite with comprehensive Oscar data
- **Documentation:** Swagger UI
- **Deployment:** Railway with GitHub integration
- **CORS:** Enabled for web applications

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)