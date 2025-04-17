import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', tags: '' });
  const [editingContact, setEditingContact] = useState(null);
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);

  const API = axios.create({ baseURL: 'http://localhost:5000' });

  const fetchContacts = async () => {
    const res = await API.get('/contacts/1');
    setContacts(res.data);
  };

  const fetchTags = async () => {
    const res = await API.get('/tags');
    setAllTags(res.data);
  };

  useEffect(() => {
    fetchContacts();
    fetchTags();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const contactData = {
      ...form,
      user_id: 1,
      tags: form.tags.split(',').map(tag => tag.trim())
    };

    try {
      if (editingContact) {
        await API.put(`/contacts/${editingContact.id}`, contactData);
        showToast('Contact updated ');
      } else {
        await API.post('/contacts', contactData);
        showToast('Contact added ');
      }
      fetchContacts();
      fetchTags();
      setForm({ name: '', phone: '', email: '', tags: '' });
      setEditingContact(null);
    } catch {
      showToast('Something went wrong ', 'danger');
    }
  };

  const deleteContact = async id => {
    if (window.confirm('Delete this contact?')) {
      await API.delete(`/contacts/${id}`);
      fetchContacts();
      showToast('Contact deleted ', 'warning');
    }
  };

  const filteredContacts = selectedTag
    ? contacts.filter(c => c.tags.includes(selectedTag))
    : contacts;

  const tagColors = ['primary', 'success', 'danger', 'warning', 'info', 'secondary'];

  return (
    <div className="container py-4">
      

      {toastMsg && (
        <div className={`alert alert-${toastMsg.type} text-center`} role="alert">
          {toastMsg.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card shadow-sm p-4 mb-4">
        <h4 className="mb-3">{editingContact ? ' Edit Contact' : ' Add New Contact'}</h4>
        <div className="row g-2">
          <div className="col-md-3">
            <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required className="form-control" />
          </div>
          <div className="col-md-3">
            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required className="form-control" />
          </div>
          <div className="col-md-3">
            <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required className="form-control" />
          </div>
          <div className="col-md-3">
            <input name="tags" placeholder="Tags (comma separated)" value={form.tags} onChange={handleChange} className="form-control" />
          </div>
        </div>
        <div className="mt-3">
          <button type="submit" className="btn btn-success me-2"> Save</button>
          {editingContact && (
            <button className="btn btn-secondary" onClick={() => {
              setEditingContact(null);
              setForm({ name: '', phone: '', email: '', tags: '' });
            }}>Cancel</button>
          )}
        </div>
      </form>

      <div className="mb-3">
        
        <select className="form-select w-auto d-inline-block ms-2" value={selectedTag} onChange={e => setSelectedTag(e.target.value)}>
          <option value="">All</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
        {selectedTag && (
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => setSelectedTag('')}>Clear Filter</button>
        )}
      </div>

      {filteredContacts.length === 0 ? (
        <p className="text-muted">No contacts to display.</p>
      ) : (
        <div className="row g-3">
          {filteredContacts.map((contact, idx) => (
            <div key={contact.id} className="col-md-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{contact.name}</h5>
                  <p className="card-text">
                    📞 {contact.phone}<br />
                    📧 {contact.email}
                  </p>
                  <div className="mb-2">
                    {contact.tags.map((tag, i) => (
                      <span key={i} className={`badge bg-${tagColors[i % tagColors.length]} me-1`}>{tag}</span>
                    ))}
                  </div>
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={() => {
                    setEditingContact(contact);
                    setForm({
                      name: contact.name,
                      phone: contact.phone,
                      email: contact.email,
                      tags: contact.tags.join(', ')
                    });
                  }}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => deleteContact(contact.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
