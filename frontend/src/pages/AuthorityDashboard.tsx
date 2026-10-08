import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function AuthorityDashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <div>
          <div className="dashboard-logo">
            <ShieldCheck size={24} />
            FindHome
          </div>

          <h1>Authority Dashboard</h1>

          <p>
            Monitor missing-person cases, connected records and potential
            reunification matches.
          </p>
        </div>

        <div className="authority-status">
          <span />
          System Online
        </div>
      </header>

      <main className="dashboard-container">

        {/* Statistics */}

        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon blue">
              <Users size={22} />
            </div>

            <div>
              <span>Active Cases</span>
              <strong>128</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <Search size={22} />
            </div>

            <div>
              <span>Potential Matches</span>
              <strong>24</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <CheckCircle size={22} />
            </div>

            <div>
              <span>Verified</span>
              <strong>17</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">
              <AlertTriangle size={22} />
            </div>

            <div>
              <span>Needs Review</span>
              <strong>9</strong>
            </div>
          </div>

        </section>

        {/* Main Dashboard */}

        <section className="dashboard-panel">

          <div className="panel-header">
            <div>
              <h2>Cases Requiring Attention</h2>
              <p>
                AI-assisted matching has identified potential evidence.
              </p>
            </div>

            <div className="search-box">
              <Search size={18} />
              <input placeholder="Search cases..." />
            </div>
          </div>

          <div className="case-table">

            <div className="table-header">
              <span>CASE</span>
              <span>PERSON</span>
              <span>STATUS</span>
              <span>MATCH</span>
              <span>ACTION</span>
            </div>

            <div className="case-row">

              <div>
                <strong>FH-1024</strong>
                <small>2 hours ago</small>
              </div>

              <div>
                <strong>Arun Kumar</strong>
                <small>42 • Male</small>
              </div>

              <div>
                <span className="case-badge searching">
                  Searching
                </span>
              </div>

              <div>
                <strong className="match-high">94%</strong>
                <small>High confidence</small>
              </div>

              <button
  className="review-button"
  onClick={() => navigate("/review")}
>
  Review
</button>

            </div>

            <div className="case-row">

              <div>
                <strong>FH-1031</strong>
                <small>4 hours ago</small>
              </div>

              <div>
                <strong>Meena Devi</strong>
                <small>36 • Female</small>
              </div>

              <div>
                <span className="case-badge review">
                  Needs Review
                </span>
              </div>

              <div>
                <strong className="match-medium">78%</strong>
                <small>Medium confidence</small>
              </div>

              <button
  className="review-button"
  onClick={() => navigate("/review")}
>
  Review
</button>

            </div>

            <div className="case-row">

              <div>
                <strong>FH-1044</strong>
                <small>6 hours ago</small>
              </div>

              <div>
                <strong>Ravi Kumar</strong>
                <small>29 • Male</small>
              </div>

              <div>
                <span className="case-badge searching">
                  Searching
                </span>
              </div>

              <div>
                <strong className="match-low">61%</strong>
                <small>Low confidence</small>
              </div>

              <button
  className="review-button"
  onClick={() => navigate("/review")}
>
  Review
</button>

            </div>

          </div>
        </section>

        {/* Intelligence Panel */}

        <section className="intelligence-grid">

          <div className="dashboard-panel intelligence-card">

            <div className="panel-title">
              <Clock size={20} />
              <h2>Recent Evidence</h2>
            </div>

            <div className="evidence-item">
              <div className="evidence-dot" />

              <div>
                <strong>New shelter record connected</strong>
                <p>
                  Arun Kumar • Shelter #17 • 11:42 AM
                </p>
              </div>
            </div>

            <div className="evidence-item">
              <div className="evidence-dot" />

              <div>
                <strong>Hospital record received</strong>
                <p>
                  Unknown Male • Government Hospital • 11:51 AM
                </p>
              </div>
            </div>

            <div className="evidence-item">
              <div className="evidence-dot" />

              <div>
                <strong>Potential duplicate detected</strong>
                <p>
                  Two rescue records may refer to the same person.
                </p>
              </div>
            </div>

          </div>

          <div className="dashboard-panel intelligence-card">

            <div className="panel-title">
              <ShieldCheck size={20} />
              <h2>System Principle</h2>
            </div>

            <div className="principle-box">
              <strong>AI assists. Humans verify.</strong>

              <p>
                FindHome never declares a person as identified using AI alone.
                Authorized personnel review evidence before confirmation.
              </p>
            </div>

            <div className="principle-box">
              <strong>Evidence over similarity.</strong>

              <p>
                Names, physical characteristics, time, location and journey
                evidence are evaluated together.
              </p>
            </div>

          </div>

        </section>

      </main>
    </div>
  );
}

export default AuthorityDashboard;