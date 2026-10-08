import { ArrowRight, HeartHandshake, Search, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <nav className="navbar">
        <div className="logo">
          <HeartHandshake size={28} />
          <span>FindHome</span>
        </div>

        <button
  className="nav-button"
  onClick={() => navigate("/authority")}
>Authority Login</button>
      </nav>

      <main className="hero">
        <section className="hero-content">
          <div className="badge">
            <ShieldCheck size={16} />
            Trusted Disaster Reunification
          </div>

          <h1>
            Find the people
            <br />
            <span>you call home.</span>
          </h1>

          <p>
            <p>
  FindHome connects families, rescue teams, hospitals and shelters
  to turn fragmented disaster records into trusted reunification.
</p>
          </p>

          <div className="hero-actions">
            <button
  className="primary-button"
  onClick={() => navigate("/report")}
>Report a Missing Person</button>

            <button
              className="secondary-button"
              onClick={() => navigate("/search")}
            >
              Search for Someone
              <Search size={18} />
            </button>
          </div>
        </section>

        <section className="hero-card">
          <div className="card-header">
            <div>
              <span className="small-label">ACTIVE CASE</span>
              <h3>FH-1024</h3>
            </div>

            <span className="status">Searching</span>
          </div>

          <div className="case-person">
            <div className="person-avatar">AK</div>

            <div>
              <h3>Arun Kumar</h3>
              <p>42 years • Chennai</p>
            </div>
          </div>

          <div className="progress">
            <div className="progress-step active">
              <span>✓</span>
              Reported
            </div>

            <div className="progress-line" />

            <div className="progress-step active">
              <span>✓</span>
              Searching
            </div>

            <div className="progress-line" />

            <div className="progress-step">
              <span>3</span>
              Verify
            </div>
          </div>

          <div className="evidence">
            <p>Potential evidence found</p>

            <strong>
              3 records connected
            </strong>

            <span>
              Rescue team • Shelter • Hospital
            </span>
          </div>
        </section>
      </main>

      <section className="responder-cta">
  <div>
    <span className="small-label">FOR RESCUE TEAMS</span>

    <h2>
      Found someone who cannot tell you who they are?
    </h2>

    <p>
      Register an unknown or rescued person using physical, location and
      time-based evidence. FindHome will search for their family.
    </p>
  </div>

  <button
    className="primary-button"
    onClick={() => navigate("/responder")}
  >
    Register Rescued Person
    <ArrowRight size={18} />
  </button>
</section>
      
      <section className="principles">
        <div>
          <ShieldCheck />
          <h3>Evidence-based</h3>
          <p>Every potential match is supported by evidence.</p>
        </div>

        <div>
          <Search />
          <h3>AI-assisted</h3>
          <p>Multiple signals are compared, not just names.</p>
        </div>

        <div>
          <HeartHandshake />
          <h3>Human verified</h3>
          <p>AI assists. Authorized people make the final decision.</p>
        </div>
      </section>
    </div>
  );
}

export default Landing;