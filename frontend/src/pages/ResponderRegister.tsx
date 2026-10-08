import { ArrowLeft, MapPin, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ResponderRegister() {
  const navigate = useNavigate();

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
            <h1>Register a Rescued Person</h1>
            <p>
              No name is required. Record the available evidence so FindHome
              can search for the person's family.
            </p>
          </div>
        </div>

        <form className="report-form">

          <section className="form-section">
            <h2>Person Information</h2>

            <p className="section-description">
              Enter what is known about the rescued person.
            </p>

            <div className="form-grid">

              <div className="form-group">
                <label>Temporary ID</label>

                <input
                  type="text"
                  placeholder="Example: RES-2048"
                />
              </div>

              <div className="form-group">
                <label>Estimated Age</label>

                <input
                  type="text"
                  placeholder="Example: 40–45"
                />
              </div>

              <div className="form-group">
                <label>Gender</label>

                <select>
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                  <option>Unknown</option>
                </select>
              </div>

              <div className="form-group">
                <label>Condition</label>

                <select>
                  <option value="">Select condition</option>
                  <option>Stable</option>
                  <option>Injured</option>
                  <option>Critical</option>
                  <option>Unconscious</option>
                  <option>Unknown</option>
                </select>
              </div>

            </div>
          </section>

          <section className="form-section">
            <h2>Found Information</h2>

            <p className="section-description">
              Location and time can become powerful matching evidence.
            </p>

            <div className="form-grid">

              <div className="form-group">
                <label>Found Location</label>

                <div className="input-with-icon">
                  <MapPin size={18} />

                  <input
                    type="text"
                    placeholder="Example: Chennai Central Railway Station"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Found Date & Time</label>

                <input type="datetime-local" />
              </div>

            </div>
          </section>

          <section className="form-section">
            <h2>Physical Evidence</h2>

            <p className="section-description">
              These details allow matching even when the person's identity
              is unknown.
            </p>

            <div className="form-grid">

              <div className="form-group">
                <label>Clothing</label>

                <input
                  type="text"
                  placeholder="Example: Blue shirt, black pants"
                />
              </div>

              <div className="form-group">
                <label>Height / Build</label>

                <input
                  type="text"
                  placeholder="Example: 5'8, medium build"
                />
              </div>

              <div className="form-group full-width">
                <label>Identifying Marks</label>

                <textarea
                  rows={4}
                  placeholder="Scars, tattoos, birthmarks, glasses, etc."
                />
              </div>

            </div>
          </section>

          <section className="form-section">
            <h2>Rescue Details</h2>

            <div className="form-grid">

              <div className="form-group">
                <label>Rescue Organization</label>

                <input
                  type="text"
                  placeholder="Organization / team name"
                />
              </div>

              <div className="form-group">
                <label>Current Location</label>

                <input
                  type="text"
                  placeholder="Shelter / Hospital"
                />
              </div>

              <div className="form-group full-width">
                <label>Additional Observations</label>

                <textarea
                  rows={4}
                  placeholder="Anything observed by the rescue team..."
                />
              </div>

            </div>
          </section>

          <div className="form-footer">

            <p>
              FindHome will create a temporary identity and search connected
              missing-person records for potential matches.
            </p>

            <button
              type="submit"
              className="submit-button"
            >
              Register Rescued Person
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

export default ResponderRegister;