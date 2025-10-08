import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar.jsx";

export default function AdjunctApplicationPage() {
  const navigate = useNavigate();

  // form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [resume, setResume] = useState(null);
  const [cover, setCover] = useState(null);
  const [notes, setNotes] = useState("");

  // ui state
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false); // inline success banner

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    setShowConfirm(true);
  };

  const confirmAndSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);

    // ---- mock submission (replace with real API later) ----
    await new Promise((r) => setTimeout(r, 800));

    setSubmitting(false);
    setSuccess(true); // show inline banner
    // optional: clear files/fields after success (keep email/phone if you prefer)
    setFullName("");
    setEmail("");
    setPhone("");
    setResume(null);
    setCover(null);
    setNotes("");
  };

  return (
    <>
      <TopBar />
      <main className="container">
        <header className="page-header">
          <h1 className="page-title">Adjunct Faculty Application</h1>
          <p className="page-subtitle">
            Submit your information and required documents. <strong>All fields are required</strong>{" "}
            except <em>Cover Letter</em> and <em>Comments / Notes</em>.
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
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  className="input"
                  type="tel"
                  placeholder="(555) 555-1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  pattern="^[0-9()+\\-\\.\\s]{7,}$"
                  title="Enter a valid phone number"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="resume">Upload Resume (PDF)</label>
              <input
                id="resume"
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
                placeholder="E.g., referred by Dean Smith or other notes"
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
