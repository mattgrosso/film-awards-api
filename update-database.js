const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('🔄 Updating Awards Database...');

// Connect to database
let db = new sqlite3.Database('./myDatabase.db', (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// Drop and recreate the table
console.log('🗑️  Dropping existing awards table...');
db.run(`DROP TABLE IF EXISTS awards`, (err) => {
  if (err) {
    console.error('❌ Error dropping table:', err.message);
    process.exit(1);
  }
  
  console.log('🏗️  Creating new awards table...');
  db.run(`CREATE TABLE awards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER,
    ceremony INTEGER,
    ceremony_date TEXT,
    film_years TEXT,
    category TEXT,
    original_category TEXT,
    imdb TEXT,
    tmdb TEXT,
    release_date TEXT,
    img TEXT,
    isActing TEXT,
    isWinner TEXT,
    title TEXT,
    names TEXT,
    notes TEXT
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating table:', err.message);
      process.exit(1);
    }
    
    console.log('📖 Reading AcademyAwards.json...');
    fs.readFile('./AcademyAwards.json', 'utf8', (err, data) => {
      if (err) {
        console.error('❌ Error reading JSON:', err.message);
        process.exit(1);
      }
      
      let awards = JSON.parse(data);
      console.log(`📊 Found ${awards.length} awards to import`);
      
      // Preprocess the data - convert year to integer
      awards = awards.map(award => {
        award.year = parseInt(award.year); // Convert string to integer
        award.isActing = (award.isActing.toLowerCase() === 'true') ? 1 : 0;
        award.isWinner = (award.isWinner.toLowerCase() === 'true') ? 1 : 0;
        return award;
      });
      
      console.log('💾 Inserting data into database...');
      let stmt = db.prepare('INSERT INTO awards (year, ceremony, ceremony_date, film_years, category, original_category, imdb, tmdb, release_date, img, isActing, isWinner, title, names, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      
      let insertCount = 0;
      for (let award of awards) {
        stmt.run([
          award.year, 
          award.ceremony, 
          award.ceremony_date, 
          award.film_years, 
          award.category, 
          award.original_category, 
          award.imdb, 
          award.tmdb, 
          award.release_date, 
          award.img, 
          award.isActing, 
          award.isWinner, 
          award.title, 
          JSON.stringify(award.names), 
          award.notes
        ], function(err) {
          if (err) {
            console.error('❌ Insert error:', err.message);
          } else {
            insertCount++;
            if (insertCount % 1000 === 0) {
              console.log(`📈 Inserted ${insertCount} records...`);
            }
          }
        });
      }
      
      stmt.finalize((err) => {
        if (err) {
          console.error('❌ Finalize error:', err.message);
          process.exit(1);
        }
        
        // Check the results
        db.all("SELECT DISTINCT year FROM awards ORDER BY year DESC LIMIT 5", [], (err, rows) => {
          if (err) {
            console.error('❌ Query error:', err.message);
            process.exit(1);
          }
          
          console.log('✅ Database update complete!');
          console.log('🎬 Latest years in database:', rows.map(r => r.year).join(', '));
          
          // Get 2024 count
          db.get("SELECT COUNT(*) as count FROM awards WHERE year = 2024", [], (err, row) => {
            if (err) {
              console.error('❌ Count query error:', err.message);
            } else {
              console.log(`🏆 2024 awards: ${row.count} entries`);
            }
            
            db.close((err) => {
              if (err) {
                console.error('❌ Close error:', err.message);
              } else {
                console.log('🔐 Database connection closed');
                console.log('🚀 Ready to deploy updated database!');
              }
            });
          });
        });
      });
    });
  });
});