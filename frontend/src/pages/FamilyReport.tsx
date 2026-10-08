import { useState } from "react";
import { ArrowLeft, CheckCircle, MapPin, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createMissingPersonCase } from "../api/client";

function FamilyReport() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [caseId, setCaseId] = useState("");
  const [caseStatus, setCaseStatus] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const ageValue = String(form.get("age") ?? "").trim();
    try {
      const result = await createMissingPersonCase({
        name: String(form.get("name") ?? "").trim(),
        age: ageValue ? Number(ageValue) : null,
        gender: String(form.get("gender") ?? "") || null,
        last_seen_location: String(form.get("last_seen_location") ?? "").trim() || null,
        clothing: String(form.get("clothing") ?? "").trim() || null,
        identifying_marks: String(form.get("identifying_marks") ?? "").trim() || null,
        description: String(form.get("description") ?? "").trim() || null,
      });
      setCaseId(result.case_id);
      setCaseStatus(result.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit the report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (caseId) {
    return (
      <main className="success-page">
        <section className="success-card" aria-labelledby="report-success-title">
          <div className="success-icon"><CheckCircle size={42} /></div>
          <h1 id="report-success-title">Report received</h1>
          <p>Your case has been created. Save this public case ID to check for updates.</p>
          <div className="case-id-box">
            <span>PUBLIC CASE ID</span>
            <strong>{caseId}</strong>
            {caseStatus && <small>Current status: {caseStatus}</small>}
          </div>
          <div className="case-status" role="status">
            <span className="status-dot" />
            <div>
              <strong>Matches update automatically</strong>
              <p>An empty match list does not mean the person has not been found. Check again for new updates.</p>
            </div>
          </div>
          <button
            className="primary-button success-home-button"
            onClick={() => navigate("/case/" + encodeURIComponent(caseId))}
          >
            View case status
          </button>
          <button className="text-button" onClick={() => navigate("/")}>Return to home</button>
        </section>
      </main>
    );
  }

  return (
    <main className="report-page">
      <div className="report-container">
        <button className="back-button" onClick={() => navigate("/")}>
          <ArrowLeft size={18} /> Back to Home
        </button>
        <header className="report-header">
          <div className="report-icon"><UserRound size={26} /></div>
          <div>
            <h1>Report a missing person</h1>
            <p>Enter what you know. You can leave details blank if you are unsure.</p>
          </div>
        </header>

        {error && <div className="form-alert error" role="alert">{error}</div>}

        <form className="report-form" onSubmit={handleSubmit}>
          <section className="form-section" aria-labelledby="person-information-heading">
            <h2 id="person-information-heading">Person information</h2>
            <p className="section-description">Share details that may help identify the person.</p>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="report-name">Full name <span aria-hidden="true">*</span></label>
                <input id="report-name" name="name" autoComplete="name" required maxLength={200} />
              </div>
              <div className="form-group">
                <label htmlFor="report-age">Age</label>
                <input id="report-age" name="age" type="number" min="0" max="130" inputMode="numeric" />
              </div>
              <div className="form-group">
                <label htmlFor="report-gender">Gender</label>
                <select id="report-gender" name="gender" defaultValue="">
                  <option value="">Select if known</option>
                  <option>Male</option><option>Female</option><option>Other</option><option>Unknown</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="report-location">Last seen location</label>
                <div className="input-with-icon">
                  <MapPin size={18} aria-hidden="true" />
                  <input id="report-location" name="last_seen_location" autoComplete="street-address" />
                </div>
              </div>
              <div className="form-group full-width">
                <label htmlFor="report-clothing">Clothing</label>
                <input id="report-clothing" name="clothing" />
              </div>
              <div className="form-group full-width">
                <label htmlFor="report-marks">Identifying marks</label>
                <textarea id="report-marks" name="identifying_marks" rows={3} />
              </div>
              <div className="form-group full-width">
                <label htmlFor="report-description">Other helpful information</label>
                <textarea id="report-description" name="description" rows={4} />
              </div>
            </div>
          </section>
          <div className="form-footer">
            <p>Your report will receive a public case ID. Potential matches still require human verification.</p>
            <button type="submit" className="submit-button" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit report"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default FamilyReport;
