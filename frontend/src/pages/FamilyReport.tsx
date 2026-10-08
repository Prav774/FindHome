import { useState } from "react";
import { ArrowLeft, CheckCircle, MapPin, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createMissingPersonCase } from "../api/client";

function FamilyReport() {
  const navigate = useNavigate();

  const [submitted, setSubmitted] = useState(false);
  const [caseId, setCaseId] = useState("");

  const handleSubmit = async (
  event: React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);

  const name = String(formData.get("name") || "");

  const ageValue = String(formData.get("age") || "");

  const age = ageValue
    ? Number(ageValue)
    : null;

  const gender = String(
    formData.get("gender") || ""
  );

  const lastSeenLocation = String(
    formData.get("last_seen_location") || ""
  );

  const clothing = String(
    formData.get("clothing") || ""
  );

  const identifyingMarks = String(
    formData.get("identifying_marks") || ""
  );

  try {
    const result = await createMissingPersonCase({
      name,
      age,
      gender: gender || null,
      last_seen_location: lastSeenLocation || null,
      clothing: clothing || null,
      identifying_marks: identifyingMarks || null,
    });

    setCaseId(result.case_id);
    setSubmitted(true);

  } catch (error) {
    console.error(error);

    alert(
      "Unable to submit the report. Please check that the backend is running."
    );
  }
};

  if (submitted) {
    return (
      <div className="success-page">
        <div className="success-card">
          <div className="success-icon">
            <CheckCircle size={42} />
          </div>

          <h1>Report Submitted</h1>

          <p>
            Your missing person report has been registered with FindHome.
            Our system will search connected rescue, shelter and hospital
            records for potential matches.
          </p>

          <div className="case-id-box">
            <span>YOUR CASE ID</span>
            <strong>{caseId}</strong>
            <small>Save this ID to track the case.</small>
          </div>

          <div className="case-status">
            <span className="status-dot" />
            <div>
              <strong>Searching for matches</strong>
              <p>
                FindHome is continuously checking connected records.
              </p>
            </div>
          </div>

          <button
            className="primary-button success-home-button"
            onClick={() => navigate("/")}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="report-container">

        <button
          className="back-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={18} />
          Back to Home
        </button>

        <div className="report-header">
          <div className="report-icon">
            <UserRound size={26} />
          </div>

          <div>
            <h1>Report a Missing Person</h1>
            <p>
              Provide as much information as possible. FindHome will use
              these details to search connected disaster records.
            </p>
          </div>
        </div>

        <form
          className="report-form"
          onSubmit={handleSubmit}
        >

          <section className="form-section">
            <h2>Basic Information</h2>

            <p className="section-description">
              Information that can help identify the missing person.
            </p>

            <div className="form-grid">

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  placeholder="Age"
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select name="gender">
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                  <option>Unknown</option>
                </select>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="Phone number"
                />
              </div>

            </div>
          </section>

          <section className="form-section">
            <h2>Last Known Information</h2>

            <p className="section-description">
              Where and when was this person last seen?
            </p>

            <div className="form-grid">

              <div className="form-group">
                <label>Last Seen Location</label>

                <div className="input-with-icon">
                  <MapPin size={18} />

                  <input
                    type="text"
                    name="last_seen_location"
                    placeholder="Example: Chennai Central Railway Station"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Last Seen Date & Time</label>

                <input type="datetime-local" />
              </div>

            </div>
          </section>

          <section className="form-section">
            <h2>Physical Description</h2>

            <p className="section-description">
              These details can help match records when a name is unavailable.
            </p>

            <div className="form-grid">

              <div className="form-group">
                <label>Height</label>

                <input
                  type="text"
                  placeholder="Example: 5 ft 8 in"
                />
              </div>

              <div className="form-group">
                <label>Clothing</label>

                <input
                  type="text"
                  name="clothing"
                  placeholder="Example: Blue shirt, black pants"
                />
              </div>

              <div className="form-group full-width">
                <label>Identifying Marks</label>

                <textarea
                  name="identifying_marks"
                  rows={4}
                  placeholder="Scars, tattoos, birthmarks, glasses, etc."
                />
              </div>

            </div>
          </section>

          <section className="form-section">
            <h2>Additional Information</h2>

            <div className="form-group">
              <label>Anything else that may help?</label>

              <textarea
                rows={4}
                placeholder="Medical information, belongings, people they were travelling with, etc."
              />
            </div>
          </section>

          <div className="form-footer">

            <p>
              Your information will be shared only with authorized
              personnel involved in the reunification process.
            </p>

            <button
              type="submit"
              className="submit-button"
            >
              Submit Missing Person Report
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

export default FamilyReport;