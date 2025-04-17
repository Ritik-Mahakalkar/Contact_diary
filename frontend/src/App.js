
import './App.css';

import React, { useEffect, useState } from 'react';
import axios from 'axios';


function App() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [invoiceForm, setInvoiceForm] = useState({ client_id: '', date: '', items: [] });
  const [item, setItem] = useState({ description: '', quantity: '', price: '' });
  const [invoices, setInvoices] = useState([]);
  const [viewInvoice, setViewInvoice] = useState(null);

  useEffect(() => {
    fetchClients();
    fetchInvoices();
  }, []);

  const fetchClients = async () => {
    const res = await axios.get('http://localhost:3001/clients');
    setClients(res.data);
  };

  const fetchInvoices = async () => {
    const res = await axios.get('http://localhost:3001/invoices');
    setInvoices(res.data);
  };

  const handleClientSubmit = async e => {
    e.preventDefault();
    await axios.post('http://localhost:3001/clients', form);
    fetchClients();
    setForm({ name: '', email: '', phone: '' });
  };

  const handleAddItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, item]
    });
    setItem({ description: '', quantity: '', price: '' });
  };

  const handleInvoiceSubmit = async e => {
    e.preventDefault();
    await axios.post('http://localhost:3001/invoices', invoiceForm);
    fetchInvoices();
    setInvoiceForm({ client_id: '', date: '', items: [] });
  };

  const viewInvoiceDetails = async id => {
    const res = await axios.get(`http://localhost:3001/invoices/${id}`);
    setViewInvoice(res.data);
  };

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">Invoice Management</h1>

      <div className="row mb-5">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Add Client</div>
            <div className="card-body">
              <form onSubmit={handleClientSubmit}>
                <div className="mb-3">
                  <input type="text" className="form-control" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <input type="email" className="form-control" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <input type="text" className="form-control" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                </div>
                <button type="submit" className="btn btn-primary">Add Client</button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Create Invoice</div>
            <div className="card-body">
              <form onSubmit={handleInvoiceSubmit}>
                <div className="mb-3">
                  <select className="form-select" value={invoiceForm.client_id} onChange={e => setInvoiceForm({ ...invoiceForm, client_id: e.target.value })} required>
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <input type="date" className="form-control" value={invoiceForm.date} onChange={e => setInvoiceForm({ ...invoiceForm, date: e.target.value })} required />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-5">
                    <input type="text" className="form-control" placeholder="Description" value={item.description} onChange={e => setItem({ ...item, description: e.target.value })} />
                  </div>
                  <div className="col-md-2">
                    <input type="number" className="form-control" placeholder="Qty" value={item.quantity} onChange={e => setItem({ ...item, quantity: e.target.value })} />
                  </div>
                  <div className="col-md-3">
                    <input type="number" className="form-control" placeholder="Price" value={item.price} onChange={e => setItem({ ...item, price: e.target.value })} />
                  </div>
                  <div className="col-md-2">
                    <button type="button" className="btn btn-success w-100" onClick={handleAddItem}>+</button>
                  </div>
                </div>

                <ul className="list-group mb-3">
                  {invoiceForm.items.map((i, idx) => (
                    <li key={idx} className="list-group-item">
                      {i.description} - {i.quantity} x ₹{i.price}
                    </li>
                  ))}
                </ul>

                <button type="submit" className="btn btn-primary">Create Invoice</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">Invoices</div>
        <div className="card-body">
          <table className="table table-bordered text-center">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Date</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td>{inv.id}</td>
                  <td>{inv.client_id}</td>
                  <td>{inv.date}</td>
                  <td>₹{inv.total_amount}</td>
                  <td>
                    <button className="btn btn-link" onClick={() => viewInvoiceDetails(inv.id)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewInvoice && (
        <div className="card">
          <div className="card-header">Invoice {viewInvoice.id}</div>
          <div className="card-body">
            <p><strong>Client:</strong> {viewInvoice.client_name} ({viewInvoice.email}, {viewInvoice.phone})</p>
            <p><strong>Date:</strong> {viewInvoice.date}</p>

            <table className="table mt-3">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {viewInvoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.price}</td>
                    <td>₹{item.quantity * item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-end fw-bold">
              Total: ₹{viewInvoice.total_amount}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

