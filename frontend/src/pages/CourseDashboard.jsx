import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import '../App.css';

function CourseDashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]); // Store all courses for autocomplete
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    course_code: '',
    course_name: '',
    description: '',
    credits: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async (search = '') => {
    try {
      setLoading(true);
      const url = search 
        ? `/api/courses?search=${encodeURIComponent(search)}`
        : '/api/courses';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.status === 401) {
        alert('You must be logged in to access the course dashboard. Redirecting to login...');
        window.location.href = '/login';
        return;
      }
      
      if (data.success) {
        setCourses(data.courses || []);
        // Store all courses for autocomplete on first load
        if (!search && allCourses.length === 0) {
          setAllCourses(data.courses || []);
        }
      } else {
        console.error('Failed to fetch courses:', data.error);
        alert(`Error: ${data.error || 'Failed to load courses'}`);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      alert('Network error: Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Get autocomplete suggestions
  const getSuggestions = () => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const term = searchTerm.toLowerCase();
    return allCourses
      .filter(course => 
        course.course_code.toLowerCase().includes(term) ||
        course.course_name.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term)
      )
      .slice(0, 10); // Limit to 10 suggestions
  };

  const suggestions = getSuggestions();

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    fetchCourses(searchTerm);
  };

  const selectSuggestion = (course) => {
    setSearchTerm(course.course_code);
    setShowSuggestions(false);
    fetchCourses(course.course_code);
  };

  const startEditing = (course) => {
    setEditingId(course.course_id);
    setEditForm({
      course_code: course.course_code || '',
      course_name: course.course_name || '',
      description: course.description || '',
      credits: course.credits || ''
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

  const handleAddFormChange = (field, value) => {
    setAddForm(prev => ({
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
      const response = await fetch(`/api/courses/${pendingSave}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setCourses(prev => prev.map(course => 
          course.course_id === pendingSave 
            ? { ...course, ...editForm }
            : course
        ));
        setEditingId(null);
        setEditForm({});
        alert('Course updated successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving course:', error);
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

  const handleAddCourse = async () => {
    if (!addForm.course_code || !addForm.course_name || !addForm.description) {
      alert('Please fill in all required fields (Course Code, Name, and Description)');
      return;
    }

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addForm)
      });

      const data = await response.json();

      if (data.success) {
        alert('Course added successfully!');
        setShowAddModal(false);
        setAddForm({
          course_code: '',
          course_name: '',
          description: '',
          credits: ''
        });
        fetchCourses(); // Refresh the list
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding course:', error);
      alert('Failed to add course. Please try again.');
    }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    if (!confirm(`Are you sure you want to delete "${courseName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('Course deleted successfully!');
        setCourses(prev => prev.filter(course => course.course_id !== courseId));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
    }
  };

  const exportToCSV = () => {
    // Define CSV headers
    const headers = ['Course Code', 'Course Name', 'Credits', 'Description'];
    
    // Convert data to CSV format
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    courses.forEach(course => {
      const row = [
        `"${(course.course_code || '').replace(/"/g, '""')}"`,
        `"${(course.course_name || '').replace(/"/g, '""')}"`,
        course.credits || '',
        `"${(course.description || '').replace(/"/g, '""')}"` // Escape quotes
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <TopBar />
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '40px 20px',
        minHeight: 'calc(100vh - 64px)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: 'var(--text)',
            marginBottom: '8px'
          }}>
            Course Catalog Manager
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>
            Manage TAMU Law course catalog - {courses.length} courses total
          </p>
        </div>

        {/* Search and Actions Bar */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <form onSubmit={handleSearch} style={{ flex: '1', minWidth: '300px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by course code, name, or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '0.95rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
            
            {/* Autocomplete suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                zIndex: 10,
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {suggestions.map(course => (
                  <div
                    key={course.course_id}
                    onClick={() => selectSuggestion(course)}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    <div style={{ fontWeight: '600', color: 'var(--maroon)', marginBottom: '2px' }}>
                      {course.course_code} - {course.course_name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                      {course.description.substring(0, 80)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>

          <button
            onClick={() => {
              setSearchTerm('');
              fetchCourses();
            }}
            style={{
              padding: '12px 20px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '12px 20px',
              background: 'var(--maroon)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            + Add Course
          </button>

          <button
            onClick={exportToCSV}
            style={{
              padding: '12px 20px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Export CSV
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
            Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
            No courses found. Try a different search term.
          </div>
        ) : (
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text)', width: '120px' }}>
                    Course Code
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text)', width: '250px' }}>
                    Course Name
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text)' }}>
                    Description
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--text)', width: '80px' }}>
                    Credits
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--text)', width: '150px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.course_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {editingId === course.course_id ? (
                      <>
                        {/* Editing Mode */}
                        <td style={{ padding: '12px' }}>
                          <input
                            type="text"
                            value={editForm.course_code}
                            onChange={(e) => handleFormChange('course_code', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              fontSize: '0.9rem'
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="text"
                            value={editForm.course_name}
                            onChange={(e) => handleFormChange('course_name', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              fontSize: '0.9rem'
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <textarea
                            value={editForm.description}
                            onChange={(e) => handleFormChange('description', e.target.value)}
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              fontSize: '0.9rem',
                              resize: 'vertical'
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="text"
                            value={editForm.credits}
                            onChange={(e) => handleFormChange('credits', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              fontSize: '0.9rem',
                              textAlign: 'center'
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={initiateSave}
                              style={{
                                padding: '6px 12px',
                                background: '#059669',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              style={{
                                padding: '6px 12px',
                                background: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* View Mode */}
                        <td style={{ padding: '12px', fontWeight: '600', color: 'var(--maroon)' }}>
                          {course.course_code}
                        </td>
                        <td style={{ padding: '12px', fontWeight: '500' }}>
                          {course.course_name}
                        </td>
                        <td style={{ padding: '12px', fontSize: '0.9rem', color: 'var(--muted)' }}>
                          {course.description.substring(0, 150)}{course.description.length > 150 ? '...' : ''}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {course.credits || 'N/A'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => startEditing(course)}
                              style={{
                                padding: '6px 12px',
                                background: 'var(--maroon)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.course_id, course.course_name)}
                              style={{
                                padding: '6px 12px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '32px',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: '700' }}>
                Confirm Changes
              </h2>
              <p style={{ marginBottom: '24px', color: 'var(--muted)' }}>
                Are you sure you want to save these changes to the course?
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={cancelSave}
                  style={{
                    padding: '10px 20px',
                    background: '#e5e7eb',
                    color: 'var(--text)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  style={{
                    padding: '10px 20px',
                    background: 'var(--maroon)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Course Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '32px',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', fontWeight: '700' }}>
                Add New Course
              </h2>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem' }}>
                  Course Code *
                </label>
                <input
                  type="text"
                  value={addForm.course_code}
                  onChange={(e) => handleAddFormChange('course_code', e.target.value)}
                  placeholder="e.g., LAW 755"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem' }}>
                  Course Name *
                </label>
                <input
                  type="text"
                  value={addForm.course_name}
                  onChange={(e) => handleAddFormChange('course_name', e.target.value)}
                  placeholder="e.g., Title IX Law"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem' }}>
                  Description *
                </label>
                <textarea
                  value={addForm.description}
                  onChange={(e) => handleAddFormChange('description', e.target.value)}
                  placeholder="Course description..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem' }}>
                  Credits
                </label>
                <input
                  type="text"
                  value={addForm.credits}
                  onChange={(e) => handleAddFormChange('credits', e.target.value)}
                  placeholder="e.g., 3 or 2 to 3"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddForm({
                      course_code: '',
                      course_name: '',
                      description: '',
                      credits: ''
                    });
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#e5e7eb',
                    color: 'var(--text)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCourse}
                  style={{
                    padding: '10px 20px',
                    background: 'var(--maroon)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Add Course
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default CourseDashboard;
