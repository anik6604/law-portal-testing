import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { checkAuthStatus, redirectToLogin } from "../utils/auth.js";
import TopBar from "../components/TopBar.jsx";

function normalizeToUS10(raw) {
  // Keep digits only
  let d = (raw || "").replace(/\D/g, "");

  // If it starts with US country code and is long, drop the leading '1'
  if (d.length > 10 && d.startsWith("1")) d = d.slice(1);

  // Cap at 10 (ignores any extensions after the base number)
  if (d.length > 10) d = d.slice(0, 10);

  return d;
}

function formatPhone(digits) {
  // digits is numbers only, max 10
  const d = digits.slice(0, 10);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 10);
  if (d.length <= 3) return p1;
  if (d.length <= 6) return `${p1}-${p2}`;
  return `${p1}-${p2}-${p3}`;
}

export default function AdjunctApplicationPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  // form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  // store phone as digits-only for consistency; render formatted
  const [phoneDigits, setPhoneDigits] = useState("");
  const [resume, setResume] = useState(null);
  const [cover, setCover] = useState(null);
  const [notes, setNotes] = useState("");

  // ui state
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false); // inline success banner

  const phoneInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    const verifyAuth = async () => {
      const authStatus = await checkAuthStatus();
      if (!authStatus.authenticated) {
        redirectToLogin();
      } else {
        setAuthChecked(true);
      }
    };
    verifyAuth();
  }, []);

  const handlePhoneChange = (e) => {
    const digitsOnly = normalizeToUS10(e.target.value);
    setPhoneDigits(digitsOnly);
    if (phoneInputRef.current) phoneInputRef.current.setCustomValidity("");
  };

  const handlePhonePaste = (e) => {
    const pasted = normalizeToUS10(e.clipboardData.getData("text"));
    e.preventDefault();
    setPhoneDigits(pasted);
    if (phoneInputRef.current) phoneInputRef.current.setCustomValidity("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    // native validation for other fields
    if (!form.reportValidity()) return;

    // hard check: phone must be exactly 10 digits (US) only if phone is provided
    if (phoneDigits.length > 0 && phoneDigits.length !== 10) {
      if (phoneInputRef.current) {
        phoneInputRef.current.setCustomValidity(
          "Enter a valid US 10-digit phone number (e.g., 555-123-4567). Country codes and extensions are not allowed."
        );
        phoneInputRef.current.reportValidity();
      }
      return;
    }

    setShowConfirm(true);
  };

  const confirmAndSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);

    try {
      // Use relative URLs in production (same domain), absolute in dev
      const API_URL = import.meta.env.VITE_API_URL || '';
      
      // Format phone for database (readable format)
      const phoneForDb = phoneDigits.length === 10 ? formatPhone(phoneDigits) : null;

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', email);
      if (phoneForDb) formData.append('phone', phoneForDb);
      if (notes) formData.append('notes', notes);
      
      // Append files
      if (resume) formData.append('resume', resume);
      if (cover) formData.append('coverLetter', cover);

      const response = await fetch(`${API_URL}/api/applications`, {
        method: 'POST',
        body: formData, // Don't set Content-Type header - browser will set it with boundary
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setSubmitting(false);
      setSuccess(true); // show inline banner

      // Clear form fields after success
      setFullName("");
      setEmail("");
      setPhoneDigits("");
      setResume(null);
      setCover(null);
      setNotes("");
      
      // Clear file inputs
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      if (coverInputRef.current) coverInputRef.current.value = '';

      console.log('Application submitted successfully:', data);
      if (data.extractedTextLength) {
        console.log(`Extracted ${data.extractedTextLength} characters from PDF(s)`);
      }
      if (data.isUpdate) {
        console.log('Updated existing application');
      }
    } catch (error) {
      setSubmitting(false);
      console.error('Error submitting application:', error);
      alert(`Failed to submit application: ${error.message}`);
    }
  };

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  return (
    <>
      <TopBar />
      <main className="container">
        <header className="page-header">
          <h1 className="page-title">Adjunct Faculty Application</h1>
          <p className="page-subtitle">
            Submit your information and required documents. <strong>Name, Email, and Resume are required</strong>.{" "}
            <em>Phone Number, Cover Letter, and Comments / Notes are optional</em>.
          </p>
        </header>

        <section className="card app-card">
          {success && (
            <div className="alert success" role="status" aria-live="polite">
              <div className="alert-title">Application submitted</div>
              <div className="alert-body">
                Thanks! Your application has been received. You can safely close this page or submit another.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                className="input"
                type="text"
                placeholder="Jane Q. Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-row">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  placeholder="jane.doe@tamu.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <label htmlFor="phone">Phone Number (optional)</label>
                <input
                  id="phone"
                  ref={phoneInputRef}
                  className="input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="555-123-4567"
                  value={formatPhone(phoneDigits)}
                  onChange={handlePhoneChange}
                  onPaste={handlePhonePaste}
                  pattern="^\d{3}-\d{3}-\d{4}$"
                  title="Enter a valid US 10-digit phone number (e.g., 555-123-4567)."
                />
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="resume">Upload Resume (PDF)</label>
              <input
                id="resume"
                ref={resumeInputRef}
                className="input file"
                type="file"
                accept="application/pdf"
                onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="cover">Cover Letter (optional)</label>
              <input
                id="cover"
                ref={coverInputRef}
                className="input file"
                type="file"
                accept="application/pdf"
                onChange={(e) => setCover(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="form-row">
              <label htmlFor="notes">Comments / Notes (optional)</label>
              <textarea
                id="notes"
                className="input"
                rows={5}
                placeholder="E.g., referred by Dean or other notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn" onClick={() => navigate("/home")}>
                Cancel
              </button>
              <button type="submit" className="btn maroon" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </section>
      </main>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="modal">
            <h3 id="confirm-title" className="modal-title">Confirm Submission</h3>
            <p className="modal-body">Did you mean to submit this application now?</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowConfirm(false)}>No, go back</button>
              <button className="btn maroon" onClick={confirmAndSubmit}>Yes, submit</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
