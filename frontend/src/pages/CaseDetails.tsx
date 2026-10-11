import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Eye, Loader2, MapPin, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { getCase, getCaseMatches, generateMatches, type CaseResponse, type MatchResponse } from "../api/client";
import { isAuthorityAuthenticated } from "../auth/authority";

export default function CaseDetails() {
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();

  const isAuthority = isAuthorityAuthenticated();
  const backLabel = isAuthority ? "Back to Dashboard" : "Back to Search";
  const backTo = isAuthority ? "/authority" : "/search";

  const isPublicId = Boolean(caseId && /^FH-\d+$/i.test(caseId));
  const publicIdString = isPublicId && caseId ? caseId.toUpperCase() : "";

  const [caseData, setCaseData] = useState<CaseResponse | null>(null);
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const loadCase = async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      setError("");
      const data = await getCase(caseId);
      setCaseData(data);

      try {
        const matchList = await getCaseMatches(data.id);
        setMatches(matchList);
      } catch {
        setMatches([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load case details.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMatches = async () => {
    if (!caseData || generating) return;
    try {
      setGenerating(true);
      setGenerateError("");
      await generateMatches(caseData.id);
      const updatedMatches = await getCaseMatches(caseData.id);
      setMatches(updatedMatches);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Failed to generate matches.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const getStatusLabel = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "VERIFIED":
        return "Approved";
      case "REJECTED":
      case "NOT_MATCH":
      case "NOT_A_MATCH":
        return "Not Approved";
      case "POTENTIAL_MATCH":
        return "Potential Match";
      default:
        return status.replaceAll("_", " ");
    }
  };

  const getStatusClass = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "VERIFIED":
        return "verified";
      case "REJECTED":
      case "NOT_MATCH":
      case "NOT_A_MATCH":
        return "rejected";
      case "POTENTIAL_MATCH":
        return "potential";
      default:
        return "pending";
    }
  };

  if (loading) {
    return (
      <main className="review-page">
        <header className="review-header">
          <button className="back-button" onClick={() => navigate(backTo)}>
            <ArrowLeft size={18} /> {backLabel}
          </button>
          <div>
            <div className="review-case-id">
              {isPublicId ? `PUBLIC CASE ID · ${publicIdString}` : `CASE #${caseId}`}
            </div>
            <h1>{isPublicId ? `Loading Case ${publicIdString}` : `Loading Case #${caseId}`}</h1>
          </div>
        </header>
        <div className="state-message" role="status">
          <Loader2 size={22} className="spin" /> Loading case details…
        </div>
      </main>
    );
  }

  if (error || !caseData) {
    return (
      <main className="review-page">
        <header className="review-header">
          <button className="back-button" onClick={() => navigate(backTo)}>
            <ArrowLeft size={18} /> {backLabel}
          </button>
          <div>
            <div className="review-case-id">CASE DETAILS</div>
            <h1>{isPublicId ? `Case ${publicIdString} Not Found` : "Case Not Found"}</h1>
          </div>
        </header>
        <section className="state-card error-state" role="alert">
          <XCircle size={24} />
          <div>
            <h2>Unable to load case {isPublicId ? publicIdString : `#${caseId}`}</h2>
            <p>{error || "The requested case could not be retrieved from the backend."}</p>
          </div>
          <button className="secondary-button" onClick={() => void loadCase()}>
            Retry
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="review-page">
      <header className="review-header">
        <button className="back-button" onClick={() => navigate(backTo)}>
          <ArrowLeft size={18} /> {backLabel}
        </button>
        <div>
          <div className="review-case-id">
            {isPublicId ? `PUBLIC CASE ID · ${publicIdString}` : `CASE #${caseData.id}`}
          </div>
          <h1>Case Details</h1>
          <p>Official missing person case record and associated matches.</p>
        </div>
      </header>

      {/* CASE OVERVIEW */}
      <section className="case-overview">
        <div className="case-overview-heading">
          <div>
            <span className="card-label">MISSING PERSON</span>
            <h2>{caseData.name}</h2>
          </div>
          <span className="case-status-value">{caseData.status}</span>
        </div>

        <dl className="case-information">
          {isPublicId ? (
            <>
              <div>
                <dt>Public Case ID</dt>
                <dd><strong>{publicIdString}</strong></dd>
              </div>
              <div>
                <dt>Database Reference</dt>
                <dd>#{caseData.id}</dd>
              </div>
            </>
          ) : (
            <div>
              <dt>Case ID</dt>
              <dd>#{caseData.id}</dd>
            </div>
          )}

          {caseData.last_seen_location && (
            <div>
              <dt>
                <MapPin size={16} /> Last Seen Location
              </dt>
              <dd>{caseData.last_seen_location}</dd>
            </div>
          )}

          {caseData.description && (
            <div>
              <dt>Description</dt>
              <dd>{caseData.description}</dd>
            </div>
          )}

          <div>
            <dt>
              <Clock size={16} /> Created At
            </dt>
            <dd>
              <time dateTime={caseData.created_at}>
                {new Date(caseData.created_at).toLocaleString()}
              </time>
            </dd>
          </div>

          {caseData.updated_at && (
            <div>
              <dt>
                <Clock size={16} /> Last Updated
              </dt>
              <dd>
                <time dateTime={caseData.updated_at}>
                  {new Date(caseData.updated_at).toLocaleString()}
                </time>
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* MATCHES LIST */}
      <section className="authority-panel" style={{ marginTop: "24px" }}>
        <div className="authority-panel-header">
          <div>
            <h2>Potential Matches</h2>
            <p>Candidate matches generated by the system for this case.</p>
          </div>
        </div>

        <div className="authority-table-wrapper">
          {matches.length === 0 ? (
            <div className="empty-cases">
              <ShieldCheck size={34} />
              <h3>No matching candidates found</h3>
              <p>No matches have been generated or found for this case yet.</p>
              {generateError && (
                <div className="form-alert error" role="alert" style={{ marginTop: "12px", maxWidth: "480px", marginInline: "auto" }}>
                  {generateError}
                </div>
              )}
              {isAuthority && (
                <button
                  type="button"
                  className="generate-button"
                  style={{ marginTop: "16px" }}
                  onClick={handleGenerateMatches}
                  disabled={generating}
                >
                  <RefreshCw size={15} className={generating ? "spin" : undefined} />
                  {generating ? "Generating Matches…" : "Generate Match"}
                </button>
              )}
            </div>
          ) : (
            <table className="authority-table">
              <thead>
                <tr>
                  <th>Match ID</th>
                  <th>Candidate</th>
                  <th>Match Score</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.id}>
                    <td>
                      <span className="case-id">#{match.id}</span>
                    </td>
                    <td>
                      <div className="person-cell">
                        <strong>
                          {match.person_id != null
                            ? `Candidate #${match.person_id}`
                            : `Source Record #${match.source_record_id ?? "—"}`}
                        </strong>
                      </div>
                    </td>
                    <td>
                      <div className="confidence">
                        <strong>{match.score} / 100</strong>
                        <div className="confidence-bar">
                          <div
                            style={{
                              width: `${Math.min(Math.max(match.score, 0), 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`match-status ${getStatusClass(match.status)}`}>
                        {getStatusLabel(match.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="review-button"
                        onClick={() => navigate(`/review/${caseData.id}`)}
                      >
                        <Eye size={15} />
                        Review Match
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}

