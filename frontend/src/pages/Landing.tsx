import { ArrowRight, HeartHandshake, Search, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();
  return (
    <div className="landing">
      <nav className="navbar">
        <div className="logo"><HeartHandshake size={28} /><span>FindHome</span></div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="nav-button" onClick={() => navigate("/login")}>Login</button>
          <button className="nav-button" onClick={() => navigate("/authority-login")}>Authority</button>
        </div>
      </nav>
      <main className="hero">
        <section className="hero-content">
          <div className="badge"><ShieldCheck size={16} /> Disaster reunification support</div>
          <h1>Find the people<br /><span>you call home.</span></h1>
          <p>FindHome brings missing-person reports and response records together. Potential matches are suggestions that require human verification.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate("/report")}>Report a missing person</button>
            <button className="secondary-button" onClick={() => navigate("/search")}>Track a case <Search size={18} /></button>
          </div>
        </section>
        <aside className="hero-card landing-status-card">
          <span className="small-label">CASE UPDATES</span>
          <h2>Use a public case ID</h2>
          <p>Enter the FH-XXXX ID from a report to view the current status, system suggestions, evidence and timeline.</p>
          <button className="primary-button" onClick={() => navigate("/search")}>Search for a case <ArrowRight size={18} /></button>
          <p className="trust-copy">A system suggestion is not confirmation. An authorized responder verifies a match.</p>
        </aside>
      </main>
      <section className="responder-cta">
        <div>
          <span className="small-label">FAMILY REPORT</span>
          <h2>Unknown Person / Missing Details</h2>
          <p>Share the details you know about a missing person. Your report is sent to FindHome and receives a public case ID for updates.</p>
        </div>
        <button className="primary-button" onClick={() => navigate("/report")}>Submit Missing Details <ArrowRight size={18} /></button>
      </section>
      <section className="principles">
        <div><ShieldCheck /><h3>Evidence-based</h3><p>Review the evidence returned with each potential match.</p></div>
        <div><Search /><h3>System-assisted</h3><p>Match scores are suggestions, not probabilities or identity confirmation.</p></div>
        <div><HeartHandshake /><h3>Human verified</h3><p>Authorized responders make verification decisions.</p></div>
      </section>
    </div>
  );
}

export default Landing;
