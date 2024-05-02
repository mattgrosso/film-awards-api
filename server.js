const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const app = express();
const port = 3000;

let db = new sqlite3.Database('./myDatabase.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

// Swagger setup
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Awards API',
      version: '1.0.0',
      description: 'API for querying awards data',
    },
  },
  apis: ['./server.js'], // path to the API docs
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Run this to clear the database
// db.run(`DROP TABLE IF EXISTS awards`, (err) => {
//   if (err) {
//     console.error(err.message);
//   }
// });

// Run this to build the database
// db.run(`CREATE TABLE awards (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   year INTEGER,
//   ceremony INTEGER,
//   ceremony_date TEXT,
//   film_years TEXT,
//   category TEXT,
//   original_category TEXT,
//   imdb TEXT,
//   tmdb TEXT,
//   release_date TEXT,
//   img TEXT,
//   isActing TEXT,
//   isWinner TEXT,
//   title TEXT,
//   names TEXT,
//   notes TEXT
// )`, (err) => {
//   if (err) {
//     console.error(err.message, "(But that's okay.)");
//   } else {
//     // If table is just created, insert data from JSON file
//     fs.readFile('./AcademyAwards.json', 'utf8', (err, data) => {
//       if (err) throw err;
//       let awards = JSON.parse(data);
//       let stmt = db.prepare('INSERT INTO awards (year, ceremony, ceremony_date, film_years, category, original_category, imdb, tmdb, release_date, img, isActing, isWinner, title, names, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
//       for (let award of awards) {
//         let isActing = (award.isActing.toLowerCase() === 'true') ? 1 : 0;
//         let isWinner = (award.isWinner.toLowerCase() === 'true') ? 1 : 0;
//         stmt.run([award.year, award.ceremony, award.ceremony_date, award.film_years, award.category, award.original_category, award.imdb, award.tmdb, award.release_date, award.img, isActing, isWinner, award.title, JSON.stringify(award.names), award.notes]);
//       }
//       stmt.finalize();
//     });
//   }
// });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

/**
 * @swagger
 * /awards:
 *   get:
 *     summary: Fetch all awards
 *     description: Fetch all awards. Supports query parameters for filtering.
 *     tags:
 *       - Query based endpoint
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: imdb
 *         schema:
 *           type: string
 *         description: Filter by IMDB ID
 *       - in: query
 *         name: tmdb
 *         schema:
 *           type: string
 *         description: Filter by TMDB ID
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by title
 *       - in: query
 *         name: isWinner
 *         schema:
 *           type: boolean
 *         description: Filter by winner status
 *       - in: query
 *         name: isActing
 *         schema:
 *           type: boolean
 *         description: Filter by acting category
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: person
 *         schema:
 *           type: string
 *         description: Filter by person in names field
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: No awards found for these parameters
 */
app.get('/awards', (req, res) => {
  let query = 'SELECT * FROM awards WHERE 1=1';
  let params = [];

  Object.keys(req.query).forEach((key) => {
    if (['year', 'imdb', 'tmdb', 'title'].includes(key)) {
      query += ` AND ${key} = ?`;
      params.push(req.query[key]);
    } else if (['isWinner', 'isActing'].includes(key)) {
      query += ` AND ${key} = ?`;
      params.push(['true', '1', 'TRUE'].includes(req.query[key]) ? 'TRUE' : 'FALSE');
    } else if (key === 'category') {
      query += ` AND LOWER(${key}) LIKE ?`;
      params.push(`%${req.query[key].toLowerCase()}%`);
    }
  });

  db.all(query, params, (err, rows) => {
    if (err) {
      throw err;
    }
    if (rows.length === 0) {
      res.status(404).send('No awards found for these parameters');
    } else {
      rows.forEach(row => {
        row.isActing = row.isActing === 'TRUE' ? true : false;
        row.isWinner = row.isWinner === 'TRUE' ? true : false;
        try {
          const correctedNames = row.names.replace(/:(,|}|])/g, ':null$1');
          row.names = JSON.parse(JSON.parse(correctedNames));
        } catch (error) {
          console.error(`Failed to parse names: ${row.names}`);
          row.names = [];
        }
      });
      if (req.query.person) {
        const person = req.query.person.toLowerCase();
        rows = rows.filter(row => {
          return row.names.some(n => n.name.toLowerCase().includes(person));
        });
        if (rows.length === 0) {
          res.status(404).send('No awards found for this person');
          return;
        }
      }
      res.json(rows);
    }
  });
});

/**
 * @swagger
 * /awards/category/{category}:
 *   get:
 *     summary: Fetch awards by category
 *     tags:
 *       - Individual Endpoints
 *     parameters:
 *       - in: path
 *         name: category
 *         schema:
 *           type: string
 *         required: true
 *         description: Category to filter by
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: No awards found for this category
 */
app.get('/awards/category/:category', (req, res) => {
  const category = req.params.category.toLowerCase();
  db.all(`SELECT * FROM awards WHERE LOWER(category) LIKE ?`, [category], (err, rows) => {
    if (err) {
      throw err;
    }
    if (rows.length === 0) {
      res.status(404).send('No awards found for this category');
    } else {
      rows.forEach(row => {
        row.isActing = Boolean(row.isActing);
        row.names = JSON.parse(row.names);
      });
      res.json(rows);
    }
  });
});

/**
 * @swagger
 * /awards/imdb/{imdb}:
 *   get:
 *     summary: Fetch awards by IMDB ID
 *     tags:
 *       - Individual Endpoints
 *     parameters:
 *       - in: path
 *         name: imdb
 *         schema:
 *           type: string
 *         required: true
 *         description: IMDB ID to filter by
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: No awards found for this IMDB ID
 */
app.get('/awards/imdb/:imdb', (req, res) => {
  const imdb = req.params.imdb.toLowerCase();
  db.all(`SELECT * FROM awards WHERE LOWER(imdb) LIKE ?`, [imdb], (err, rows) => {
    if (err) {
      throw err;
    }
    if (rows.length === 0) {
      res.status(404).send('No awards found for this imdb');
    } else {
      rows.forEach(row => {
        row.isActing = Boolean(row.isActing);
        row.names = JSON.parse(row.names);
      });
      res.json(rows);
    }
  });
});

/**
 * @swagger
 * /awards/tmdb/{tmdb}:
 *   get:
 *     summary: Fetch awards by TMDB ID
 *     tags:
 *       - Individual Endpoints
 *     parameters:
 *       - in: path
 *         name: tmdb
 *         schema:
 *           type: string
 *         required: true
 *         description: TMDB ID to filter by
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: No awards found for this TMDB ID
 */
app.get('/awards/tmdb/:tmdb', (req, res) => {
  const tmdb = req.params.tmdb.toLowerCase();
  db.all(`SELECT * FROM awards WHERE LOWER(tmdb) LIKE ?`, [tmdb], (err, rows) => {
    if (err) {
      throw err;
    }
    if (rows.length === 0) {
      res.status(404).send('No awards found for this tmdb');
    } else {
      rows.forEach(row => {
        row.isActing = Boolean(row.isActing);
        row.names = JSON.parse(row.names);
      });
      res.json(rows);
    }
  });
});

/**
 * @swagger
 * /awards/title/{title}:
 *   get:
 *     summary: Fetch awards by title
 *     tags:
 *       - Individual Endpoints
 *     parameters:
 *       - in: path
 *         name: title
 *         schema:
 *           type: string
 *         required: true
 *         description: Title to filter by
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: No awards found for this title
 */
app.get('/awards/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();
  db.all(`SELECT * FROM awards WHERE LOWER(title) LIKE ?`, [title], (err, rows) => {
    if (err) {
      throw err;
    }
    if (rows.length === 0) {
      res.status(404).send('No awards found for this title');
    } else {
      rows.forEach(row => {
        row.isActing = Boolean(row.isActing);
        row.names = JSON.parse(row.names);
      });
      res.json(rows);
    }
  });
});

/**
 * @swagger
 * /awards/person/{person}:
 *   get:
 *     summary: Fetch awards by people's
 *     tags:
 *       - Individual Endpoints
 *     parameters:
 *       - in: path
 *         name: person
 *         schema:
 *           type: string
 *         required: true
 *         description: Person to filter by
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: No awards found for this person
 */
app.get('/awards/person/:person', (req, res) => {
  const person = req.params.person.toLowerCase();
  db.all(`SELECT * FROM awards`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('An error occurred while fetching the awards');
      return;
    }
    const filteredRows = rows.filter(row => {
      let names;
      try {
        const correctedNames = row.names.replace(/:(,|}|])/g, ':null$1');
        names = JSON.parse(JSON.parse(correctedNames));
      } catch (error) {
        console.error(`Failed to parse names: ${row.names}`);
        names = [];
      }
      return names.some(n => n.name.toLowerCase().includes(person));
    });
    if (filteredRows.length === 0) {
      res.status(404).send('No awards found for this person');
    } else {
      filteredRows.forEach(row => {
        row.isActing = Boolean(row.isActing);
        try {
          const correctedNames = row.names.replace(/:(,|}|])/g, ':null$1');
          row.names = JSON.parse(JSON.parse(correctedNames));
        } catch (error) {
          console.error(`Failed to parse names: ${row.names}`);
          row.names = [];
        }
      });
      res.json(filteredRows);
    }
  });
});