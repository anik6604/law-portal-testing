import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import '../App.css';

function AdminPanel() {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [allApplicants, setAllApplicants] = useState([]); // Store all applicants for autocomplete
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async (search = '') => {
    try {
      setLoading(true);
      const url = search 
        ? `/api/admin/applicants?search=${encodeURIComponent(search)}`
        : '/api/admin/applicants';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.status === 401) {
        alert('You must be logged in to access the admin panel. Redirecting to login...');
        window.location.href = '/login';
        return;
      }
      
      if (data.success) {
        setApplicants(data.applicants || []);
        // Store all applicants for autocomplete on first load
        if (!search && allApplicants.length === 0) {
          setAllApplicants(data.applicants || []);
        }
      } else {
        console.error('Failed to fetch applicants:', data.error);
        alert(`Error: ${data.error || 'Failed to load applicants'}`);
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
      alert('Network error: Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Get autocomplete suggestions
  const getSuggestions = () => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const term = searchTerm.toLowerCase();
    return allApplicants
      .filter(app => 
        app.name.toLowerCase().includes(term) ||
        app.email.toLowerCase().includes(term) ||
        (app.phone && app.phone.includes(term)) ||
        String(app.applicant_id).includes(term)
      )
      .slice(0, 10); // Limit to 10 suggestions
  };

  const suggestions = getSuggestions();

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    fetchApplicants(searchTerm);
  };

  const selectSuggestion = (applicant) => {
    setSearchTerm(applicant.name);
    setShowSuggestions(false);
    fetchApplicants(applicant.name);
  };

  const startEditing = (applicant) => {
    setEditingId(applicant.applicant_id);
    setEditForm({
      name: applicant.name || '',
      email: applicant.email || '',
      phone: applicant.phone || '',
      note: applicant.note || '',
      hired: applicant.hired || false
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const initiateSave = () => {
    setPendingSave(editingId);
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    try {
      const response = await fetch(`/api/admin/applicants/${pendingSave}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setApplicants(prev => prev.map(app => 
          app.applicant_id === pendingSave 
            ? { ...app, ...editForm }
            : app
        ));
        setEditingId(null);
        setEditForm({});
        alert('Applicant updated successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving applicant:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setShowConfirmModal(false);
      setPendingSave(null);
    }
  };

  const cancelSave = () => {
    setShowConfirmModal(false);
    setPendingSave(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="app-container">
      <TopBar />
      
      <div style={{ padding: '40px 20px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#500000' }}>
            Admin Panel - Manage Applicants
          </h1>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ marginBottom: '30px', display: 'flex', gap: '10px', position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(e.target.value.length >= 2);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchTerm('');
                  setShowSuggestions(false);
                  fetchApplicants('');
                }
              }}
              onFocus={() => setShowSuggestions(searchTerm.length >= 2)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search by name, email, phone, or ID..."
              autoComplete="off"
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            
            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderTop: 'none',
                borderRadius: '0 0 4px 4px',
                maxHeight: '300px',
                overflowY: 'auto',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 1000
              }}>
                {suggestions.map((applicant) => (
                  <div
                    key={applicant.applicant_id}
                    onClick={() => selectSuggestion(applicant)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f9f9f9'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    <div style={{ fontWeight: 'bold', color: '#500000' }}>
                      {applicant.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      {applicant.email} • ID: {applicant.applicant_id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              backgroundColor: '#500000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                fetchApplicants('');
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Applicants Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.2rem', color: '#666' }}>
            Loading applicants...
          </div>
        ) : applicants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.2rem', color: '#666' }}>
            No applicants found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#500000', color: 'white' }}>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>ID</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Name</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Phone</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Note</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Hired</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Created</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((applicant, index) => {
                  const isEditing = editingId === applicant.applicant_id;
                  
                  return (
                    <tr 
                      key={applicant.applicant_id}
                      style={{
                        backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                        borderBottom: '1px solid #eee'
                      }}
                    >
                      <td style={{ padding: '12px' }}>{applicant.applicant_id}</td>
                      
                      {/* Name */}
                      <td style={{ padding: '12px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px',
                              border: '1px solid #500000',
                              borderRadius: '4px'
                            }}
                          />
                        ) : (
                          applicant.name
                        )}
                      </td>
                      
                      {/* Email */}
                      <td style={{ padding: '12px' }}>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => handleFormChange('email', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px',
                              border: '1px solid #500000',
                              borderRadius: '4px'
                            }}
                          />
                        ) : (
                          applicant.email
                        )}
                      </td>
                      
                      {/* Phone */}
                      <td style={{ padding: '12px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.phone}
                            onChange={(e) => handleFormChange('phone', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px',
                              border: '1px solid #500000',
                              borderRadius: '4px'
                            }}
                          />
                        ) : (
                          applicant.phone || 'N/A'
                        )}
                      </td>
                      
                      {/* Note */}
                      <td style={{ padding: '12px', maxWidth: '200px' }}>
                        {isEditing ? (
                          <textarea
                            value={editForm.note}
                            onChange={(e) => handleFormChange('note', e.target.value)}
                            rows={2}
                            style={{
                              width: '100%',
                              padding: '6px',
                              border: '1px solid #500000',
                              borderRadius: '4px',
                              resize: 'vertical'
                            }}
                          />
                        ) : (
                          <div style={{ 
                            maxHeight: '60px', 
                            overflow: 'auto',
                            fontSize: '0.9rem'
                          }}>
                            {applicant.note || 'N/A'}
                          </div>
                        )}
                      </td>
                      
                      {/* Hired Status */}
                      <td style={{ padding: '12px' }}>
                        {isEditing ? (
                          <select
                            value={editForm.hired ? 'true' : 'false'}
                            onChange={(e) => handleFormChange('hired', e.target.value === 'true')}
                            style={{
                              width: '100%',
                              padding: '6px',
                              border: '1px solid #500000',
                              borderRadius: '4px'
                            }}
                          >
                            <option value="false">Not Hired</option>
                            <option value="true">Hired</option>
                          </select>
                        ) : (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            backgroundColor: applicant.hired ? '#4CAF50' : '#999',
                            color: 'white',
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                          }}>
                            {applicant.hired ? 'HIRED' : 'NOT HIRED'}
                          </span>
                        )}
                      </td>
                      
                      {/* Created Date */}
                      <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                        {formatDate(applicant.created_at)}
                      </td>
                      
                      {/* Actions */}
                      <td style={{ padding: '12px' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={initiateSave}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#999',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(applicant)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#500000',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Total Count */}
        <div style={{ marginTop: '20px', textAlign: 'center', color: '#666', fontSize: '1rem' }}>
          Total Applicants: {applicants.length}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#500000' }}>Confirm Changes</h2>
            <p style={{ marginBottom: '20px', color: '#333' }}>
              Are you sure you want to save these changes to the database?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={cancelSave}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#999',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
