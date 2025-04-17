const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// DB Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456789',
  database: 'contact_book'
});

db.connect((err) => {
  if (err) {
    console.error('MySQL Error:', err);
    process.exit(1);
  }
  console.log('✅ MySQL Connected');
});

// 🔸 POST /contacts - Add contact with tags
app.post('/contacts', (req, res) => {
  const { user_id, name, phone, email, tags } = req.body;
  if (!user_id || !name || !phone || !email || !Array.isArray(tags)) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const contactSQL = `INSERT INTO contacts (user_id, name, phone, email) VALUES (?, ?, ?, ?)`;
  db.query(contactSQL, [user_id, name, phone, email], (err, result) => {
    if (err) return res.status(500).json({ message: 'Insert contact failed' });

    const contactId = result.insertId;

    const tagPromises = tags.map(tag => {
      return new Promise((resolve, reject) => {
        // Insert tag if it doesn't exist
        db.query(`INSERT IGNORE INTO tags (name) VALUES (?)`, [tag], (err) => {
          if (err) return reject(err);

          // Get tag ID
          db.query(`SELECT id FROM tags WHERE name = ?`, [tag], (err, results) => {
            if (err) return reject(err);
            const tagId = results[0].id;

            // Link tag with contact
            db.query(`INSERT INTO contact_tags (contact_id, tag_id) VALUES (?, ?)`, [contactId, tagId], (err) => {
              if (err) return reject(err);
              resolve();
            });
          });
        });
      });
    });

    Promise.all(tagPromises)
      .then(() => res.status(201).json({ message: 'Contact added' }))
      .catch(err => res.status(500).json({ message: 'Failed to add tags' }));
  });
});

// 🔸 GET /contacts/:user_id - Get all contacts with tags
app.get('/contacts/:user_id', (req, res) => {
  const { user_id } = req.params;

  const contactSQL = `
    SELECT c.*, GROUP_CONCAT(t.name) AS tags
    FROM contacts c
    LEFT JOIN contact_tags ct ON c.id = ct.contact_id
    LEFT JOIN tags t ON ct.tag_id = t.id
    WHERE c.user_id = ?
    GROUP BY c.id
    ORDER BY c.name;
  `;

  db.query(contactSQL, [user_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch contacts' });

    const formatted = results.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      tags: row.tags ? row.tags.split(',') : []
    }));

    res.status(200).json(formatted);
  });
});

// 🔸 PUT /contacts/:id - Update contact and tags
app.put('/contacts/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, email, tags } = req.body;

  if (!name || !phone || !email || !Array.isArray(tags)) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const updateSQL = `UPDATE contacts SET name = ?, phone = ?, email = ? WHERE id = ?`;
  db.query(updateSQL, [name, phone, email, id], (err) => {
    if (err) return res.status(500).json({ message: 'Failed to update contact' });

    // Delete existing tags
    db.query(`DELETE FROM contact_tags WHERE contact_id = ?`, [id], (err) => {
      if (err) return res.status(500).json({ message: 'Failed to clear old tags' });

      // Re-insert new tags
      const tagPromises = tags.map(tag => {
        return new Promise((resolve, reject) => {
          db.query(`INSERT IGNORE INTO tags (name) VALUES (?)`, [tag], (err) => {
            if (err) return reject(err);

            db.query(`SELECT id FROM tags WHERE name = ?`, [tag], (err, results) => {
              if (err) return reject(err);
              const tagId = results[0].id;

              db.query(`INSERT INTO contact_tags (contact_id, tag_id) VALUES (?, ?)`, [id, tagId], (err) => {
                if (err) return reject(err);
                resolve();
              });
            });
          });
        });
      });

      Promise.all(tagPromises)
        .then(() => res.status(200).json({ message: 'Contact updated' }))
        .catch(err => res.status(500).json({ message: 'Failed to update tags' }));
    });
  });
});

// 🔸 DELETE /contacts/:id - Delete contact
app.delete('/contacts/:id', (req, res) => {
  const { id } = req.params;

  db.query(`DELETE FROM contacts WHERE id = ?`, [id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Failed to delete contact' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Contact not found' });

    res.status(200).json({ message: 'Contact deleted' });
  });
});

// 🔸 GET /tags - Get all tags
app.get('/tags', (req, res) => {
  db.query(`SELECT name FROM tags ORDER BY name`, (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch tags' });
    const tagList = results.map(t => t.name);
    res.status(200).json(tagList);
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
