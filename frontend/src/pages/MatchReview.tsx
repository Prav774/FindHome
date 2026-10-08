import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function MatchReview() {
  const navigate = useNavigate();

  return (
    <div className="review-page">

      <header className="review-header">
        <button
          className="back-button"
          onClick={() => navigate("/authority")}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div>
          <div className="review-case-id">
            CASE FH-1024
          </div>

          <h1>Potential Match Review</h1>

          <p>
            Review the evidence before making a verification decision.
          </p>
        </div>
      </header>

      <main className="review-container">

        {/* Match Summary */}

        <section className="match-summary">

          <div className="person-card">

            <div className="person-avatar large">
              AK
            </div>

            <div>
              <span className="card-label">
                FAMILY REPORT
              </span>

              <h2>Arun Kumar</h2>

              <p>42 years • Male</p>

              <span className="location-text">
                <MapPin size={14} />
                Last seen: Chennai Central
              </span>
            </div>

          </div>

          <div className="match-score">

            <span>AI MATCH</span>

            <strong>94%</strong>

            <small>
              High confidence
            </small>

          </div>

          <div className="person-card">

            <div className="person-avatar large unknown">
              ?
            </div>

            <div>
              <span className="card-label">
                RESCUED RECORD
              </span>

              <h2>Unknown Male</h2>

              <p>Estimated 40–45 years</p>

              <span className="location-text">
                <MapPin size={14} />
                Found: Railway Station
              </span>
            </div>

          </div>

        </section>

        {/* Evidence */}

        <section className="evidence-section">

          <div className="section-heading">
            <div>
              <h2>Evidence Analysis</h2>

              <p>
                The score is based on multiple independent signals.
              </p>
            </div>

            <div className="evidence-count">
              5 signals analysed
            </div>
          </div>

          {/* Supporting */}

          <div className="evidence-group">

            <div className="evidence-group-header supporting">
              <CheckCircle size={20} />
              <div>
                <h3>Supporting Evidence</h3>
                <p>Evidence that increases match confidence.</p>
              </div>
            </div>

            <div className="evidence-grid">

              <div className="evidence-card">
                <span className="evidence-type">
                  AGE
                </span>

                <strong>42 ↔ 40–45</strong>

                <p>
                  Reported age falls within the rescued person's
                  estimated age range.
                </p>
              </div>

              <div className="evidence-card">
                <span className="evidence-type">
                  LOCATION
                </span>

                <strong>1.2 km apart</strong>

                <p>
                  Last known location and rescue location are
                  geographically close.
                </p>
              </div>

              <div className="evidence-card">
                <span className="evidence-type">
                  CLOTHING
                </span>

                <strong>Blue shirt</strong>

                <p>
                  Clothing description appears in both records.
                </p>
              </div>

              <div className="evidence-card">
                <span className="evidence-type">
                  TIMELINE
                </span>

                <strong>11:05 → 11:32</strong>

                <p>
                  Reported last-seen time is consistent with
                  rescue time.
                </p>
              </div>

            </div>

          </div>

          {/* Conflicting */}

          <div className="evidence-group">

            <div className="evidence-group-header conflicting">
              <AlertTriangle size={20} />
              <div>
                <h3>Conflicting Evidence</h3>
                <p>Information that needs human attention.</p>
              </div>
            </div>

            <div className="evidence-card conflict-card">

              <span className="evidence-type">
                IDENTIFYING MARK
              </span>

              <strong>
                Scar information is inconsistent
              </strong>

              <p>
                Family report mentions a scar on the left arm,
                while the rescue record does not mention one.
                This does not disprove the match because the
                rescue record may be incomplete.
              </p>

            </div>

          </div>

          {/* Missing */}

          <div className="evidence-group">

            <div className="evidence-group-header missing">
              <Clock size={20} />
              <div>
                <h3>Missing Evidence</h3>
                <p>Information that could increase confidence.</p>
              </div>
            </div>

            <div className="evidence-card missing-card">

              <span className="evidence-type">
                NEXT BEST EVIDENCE
              </span>

              <strong>
                Verify hospital photograph or medical record
              </strong>

              <p>
                A verified photograph or identifying medical
                information would significantly reduce uncertainty.
              </p>

            </div>

          </div>

        </section>

        {/* Journey */}

        <section className="journey-section">

          <div className="section-heading">
            <div>
              <h2>Possible Journey</h2>

              <p>
                Connected records suggest the following sequence.
              </p>
            </div>
          </div>

          <div className="journey">

            <div className="journey-item">

              <div className="journey-dot">
                1
              </div>

              <div>
                <strong>Last seen</strong>

                <p>
                  Chennai Central Railway Station
                </p>

                <small>
                  11:05 AM • Family report
                </small>
              </div>

            </div>

            <div className="journey-line" />

            <div className="journey-item">

              <div className="journey-dot">
                2
              </div>

              <div>
                <strong>Rescued</strong>

                <p>
                  Railway Station Emergency Zone
                </p>

                <small>
                  11:32 AM • Rescue Team
                </small>
              </div>

            </div>

            <div className="journey-line" />

            <div className="journey-item">

              <div className="journey-dot">
                3
              </div>

              <div>
                <strong>Current location</strong>

                <p>
                  Shelter #17
                </p>

                <small>
                  11:42 AM • Shelter record
                </small>
              </div>

            </div>

          </div>

        </section>

        {/* Verification */}

        <section className="verification-panel">

          <div className="verification-icon">
            <ShieldCheck size={25} />
          </div>

          <div className="verification-content">

            <h2>Human Verification Required</h2>

            <p>
              AI has identified a strong potential match, but it does
              not independently confirm identity. An authorized
              authority must review the evidence before reunification.
            </p>

            <div className="verification-actions">

              <button className="verify-button">
                <CheckCircle size={18} />
                Confirm Match
              </button>

              <button className="reject-button">
                Not the Same Person
              </button>

              <button className="request-button">
                Request More Evidence
              </button>

            </div>

          </div>

        </section>

      </main>
    </div>
  );
}

export default MatchReview;