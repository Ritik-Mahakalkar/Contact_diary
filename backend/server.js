const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456789',
  database: 'invoice_app',
});

db.connect(err => {
  if (err) throw err;
  console.log('MySQL connected.');
});


app.post('/clients', (req, res) => {
  const { name, email, phone } = req.body;
  const query = 'INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)';
  db.query(query, [name, email, phone], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ id: result.insertId, name, email, phone });
  });
});


app.get('/clients', (req, res) => {
  db.query('SELECT * FROM clients', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});


app.post('/invoices', (req, res) => {
  const { client_id, date, items } = req.body;
  const total_amount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  db.beginTransaction(err => {
    if (err) return res.status(500).send(err);

    db.query(
      'INSERT INTO invoices (client_id, date, total_amount) VALUES (?, ?, ?)',
      [client_id, date, total_amount],
      (err, result) => {
        if (err) return db.rollback(() => res.status(500).send(err));

        const invoice_id = result.insertId;
        const values = items.map(i => [invoice_id, i.description, i.quantity, i.price]);

        db.query(
          'INSERT INTO invoice_items (invoice_id, description, quantity, price) VALUES ?',
          [values],
          err => {
            if (err) return db.rollback(() => res.status(500).send(err));

            db.commit(err => {
              if (err) return db.rollback(() => res.status(500).send(err));
              res.send({ invoice_id, client_id, total_amount });
            });
          }
        );
      }
    );
  });
});


app.get('/invoices', (req, res) => {
  db.query('SELECT * FROM invoices', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});


app.get('/invoices/:id', (req, res) => {
  const invoiceId = req.params.id;

  const invoiceQuery = `
    SELECT i.*, c.name AS client_name, c.email, c.phone
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?`;

  const itemsQuery = `SELECT * FROM invoice_items WHERE invoice_id = ?`;

  db.query(invoiceQuery, [invoiceId], (err, invoiceData) => {
    if (err) return res.status(500).send(err);
    if (invoiceData.length === 0) return res.status(404).send({ message: 'Invoice not found' });

    db.query(itemsQuery, [invoiceId], (err, items) => {
      if (err) return res.status(500).send(err);

      res.send({
        ...invoiceData[0],
        items,
      });
    });
  });
});


app.listen(3001, () => {
  console.log('Server running on port 3001');
});
