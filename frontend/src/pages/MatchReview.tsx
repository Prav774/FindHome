import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCase,
  getCaseMatches,
  generateMatches,
  getMatch,
  verifyMatch,
  rejectMatch,
  requestMatchInfo,
  type CaseResponse,
  type MatchResponse,
  type MatchDetailResponse,
} from "../api/client";

function MatchReview() {
  const navigate = useNavigate();
  const { caseId: caseIdParam } = useParams<{ caseId: string }>();

  // State
  const [caseData, setCaseData] = useState<CaseResponse | null>(null);
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
  const [matchDetail, setMatchDetail] =
    useState<MatchDetailResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Load case and matches
  const loadCaseAndMatches = useCallback(async () => {
    if (!caseIdParam) {
      setError("No case ID provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Resolve string case_id (e.g. "FH-5492") to numeric id
      const caseResp = await getCase(caseIdParam);
      setCaseData(caseResp);

      // Step 2: Get existing matches using numeric id
      try {
        const matchesResp = await getCaseMatches(caseResp.id);
        setMatches(matchesResp);

        // Step 3: Load detail for the first match
        if (matchesResp.length > 0) {
          setSelectedMatchIndex(0);
          const detail = await getMatch(matchesResp[0].id);
          setMatchDetail(detail);
        }
      } catch {
        // No matches yet — that's OK
        setMatches([]);
        setMatchDetail(null);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load case";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [caseIdParam]);

  useEffect(() => {
    loadCaseAndMatches();
  }, [loadCaseAndMatches]);

  // Select a different match
  const selectMatch = async (index: number) => {
    if (index < 0 || index >= matches.length) return;

    setSelectedMatchIndex(index);
    setMatchDetail(null);

    try {
      const detail = await getMatch(matches[index].id);
      setMatchDetail(detail);
    } catch (err) {
      console.error("Failed to load match detail:", err);
    }
  };

  // Generate matches
  const handleGenerateMatches = async () => {
    if (!caseData) return;

    setGenerating(true);
    setError("");

    try {
      const generated = await generateMatches(caseData.id);
      setMatches(generated);

      if (generated.length > 0) {
        setSelectedMatchIndex(0);
        const detail = await getMatch(generated[0].id);
        setMatchDetail(detail);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate matches";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  // Verification actions
  const handleVerify = async () => {
    if (!matchDetail) return;
    setActionLoading(true);
    try {
      await verifyMatch(matchDetail.id);
      const refreshed = await getMatch(matchDetail.id);
      setMatchDetail(refreshed);
      // Update match in list
      setMatches((prev) =>
        prev.map((m) =>
          m.id === refreshed.id ? { ...m, status: refreshed.status } : m
        )
      );
    } catch (err) {
      console.error("Verify failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!matchDetail) return;
    setActionLoading(true);
    try {
      await rejectMatch(matchDetail.id);
      const refreshed = await getMatch(matchDetail.id);
      setMatchDetail(refreshed);
      setMatches((prev) =>
        prev.map((m) =>
          m.id === refreshed.id ? { ...m, status: refreshed.status } : m
        )
      );
    } catch (err) {
      console.error("Reject failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!matchDetail) return;
    setActionLoading(true);
    try {
      await requestMatchInfo(matchDetail.id);
      const refreshed = await getMatch(matchDetail.id);
      setMatchDetail(refreshed);
      setMatches((prev) =>
        prev.map((m) =>
          m.id === refreshed.id ? { ...m, status: refreshed.status } : m
        )
      );
    } catch (err) {
      console.error("Request info failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Helpers
  const scorePercent = (score: number) => `${Math.round(score * 100)}%`;

  const confidenceLabel = (score: number) => {
    const pct = score * 100;
    if (pct >= 80) return "High confidence";
    if (pct >= 50) return "Medium confidence";
    return "Low confidence";
  };

  const currentMatch = matches[selectedMatchIndex] ?? null;

  // ─── Loading State ──────────────────────────────

  if (loading) {
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
              CASE {caseIdParam ?? "—"}
            </div>
            <h1>Potential Match Review</h1>
            <p>Loading case data…</p>
          </div>
        </header>

        <main className="review-container">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "60px 0",
              color: "#64748b",
            }}
          >
            <Loader2 size={22} className="spin" />
            Loading…
          </div>
        </main>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────

  if (error && !caseData) {
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
              CASE {caseIdParam ?? "—"}
            </div>
            <h1>Potential Match Review</h1>
            <p style={{ color: "#dc2626" }}>{error}</p>
          </div>
        </header>

        <main className="review-container">
          <section className="verification-panel">
            <div className="verification-icon">
              <XCircle size={25} />
            </div>
            <div className="verification-content">
              <h2>Unable to Load Case</h2>
              <p>
                Could not retrieve case data from the backend.
                Please check that the case ID is valid and the
                backend is reachable.
              </p>
              <div className="verification-actions">
                <button
                  className="request-button"
                  onClick={loadCaseAndMatches}
                >
                  Retry
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // ─── No Matches State ───────────────────────────

  if (matches.length === 0) {
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
              CASE {caseIdParam ?? "—"}
            </div>
            <h1>Potential Match Review</h1>
            <p>
              {caseData?.name
                ? `Case for ${caseData.name}`
                : "Review the evidence before making a verification decision."}
            </p>
          </div>
        </header>

        <main className="review-container">
          {error && (
            <div
              style={{
                padding: "14px 18px",
                marginBottom: "20px",
                borderRadius: "10px",
                background: "#fff7f7",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          <section className="verification-panel">
            <div className="verification-icon">
              <Clock size={25} />
            </div>
            <div className="verification-content">
              <h2>No Matches Found</h2>
              <p>
                No potential matches have been generated for this
                case yet. You can generate matches using the
                AI-assisted matching system.
              </p>
              <div className="verification-actions">
                <button
                  className="verify-button"
                  onClick={handleGenerateMatches}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Generate Matches
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // ─── Main Match Review UI ───────────────────────

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
            CASE {caseIdParam ?? "—"}
          </div>

          <h1>Potential Match Review</h1>

          <p>
            Review the evidence before making a verification decision.
          </p>
        </div>
      </header>

      <main className="review-container">

        {/* Match selector (if multiple matches) */}

        {matches.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            {matches.map((m, i) => (
              <button
                key={m.id}
                onClick={() => selectMatch(i)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border:
                    i === selectedMatchIndex
                      ? "2px solid #0f766e"
                      : "1px solid #cbd5e1",
                  background:
                    i === selectedMatchIndex ? "#f0fdfa" : "white",
                  fontWeight: 700,
                  fontSize: "13px",
                  color:
                    i === selectedMatchIndex
                      ? "#0f766e"
                      : "#334155",
                  cursor: "pointer",
                }}
              >
                Match #{m.id} — {scorePercent(m.score)}
                {m.status !== "pending" && ` (${m.status})`}
              </button>
            ))}
          </div>
        )}

        {/* Match Summary */}

        <section className="match-summary">

          <div className="person-card">

            <div className="person-avatar large">
              {caseData?.name
                ? caseData.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "?"}
            </div>

            <div>
              <span className="card-label">
                FAMILY REPORT
              </span>

              <h2>{caseData?.name ?? "Unknown"}</h2>

              <p>
                Case #{caseData?.id ?? "—"} • {caseData?.status ?? "—"}
              </p>

              {caseData?.last_seen_location && (
                <span className="location-text">
                  <MapPin size={14} />
                  Last seen: {caseData.last_seen_location}
                </span>
              )}
            </div>

          </div>

          <div className="match-score">

            <span>AI MATCH</span>

            <strong>
              {currentMatch
                ? scorePercent(currentMatch.score)
                : "—"}
            </strong>

            <small>
              {currentMatch
                ? confidenceLabel(currentMatch.score)
                : "—"}
            </small>

          </div>

          <div className="person-card">

            <div className="person-avatar large unknown">
              ?
            </div>

            <div>
              <span className="card-label">
                MATCHED RECORD
              </span>

              <h2>
                Person #{currentMatch?.person_id ?? "—"}
              </h2>

              <p>
                Status: {currentMatch?.status ?? "—"}
              </p>
            </div>

          </div>

        </section>

        {/* AI Explanation */}

        {currentMatch?.explanation && (
          <section
            style={{
              padding: "18px 22px",
              marginBottom: "25px",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              background: "white",
            }}
          >
            <div className="section-heading" style={{ marginBottom: "10px" }}>
              <div>
                <h2>AI Explanation</h2>
                <p>Summary of why this match was identified.</p>
              </div>
            </div>
            <p
              style={{
                color: "#334155",
                fontSize: "14px",
                lineHeight: "1.7",
              }}
            >
              {currentMatch.explanation}
            </p>
          </section>
        )}

        {/* Evidence */}

        {matchDetail ? (
          <section className="evidence-section">

            <div className="section-heading">
              <div>
                <h2>Evidence Analysis</h2>

                <p>
                  The score is based on multiple independent signals.
                </p>
              </div>

              <div className="evidence-count">
                {(matchDetail.supporting_evidence?.length ?? 0) +
                  (matchDetail.conflicting_evidence?.length ?? 0) +
                  (matchDetail.missing_evidence?.length ?? 0)}{" "}
                signals analysed
              </div>
            </div>

            {/* Supporting */}

            {matchDetail.supporting_evidence?.length > 0 && (
              <div className="evidence-group">

                <div className="evidence-group-header supporting">
                  <CheckCircle size={20} />
                  <div>
                    <h3>Supporting Evidence</h3>
                    <p>Evidence that increases match confidence.</p>
                  </div>
                </div>

                <div className="evidence-grid">
                  {matchDetail.supporting_evidence.map(
                    (evidence, i) => (
                      <div className="evidence-card" key={i}>
                        <span className="evidence-type">
                          SUPPORTING #{i + 1}
                        </span>
                        <p>{evidence}</p>
                      </div>
                    )
                  )}
                </div>

              </div>
            )}

            {/* Conflicting */}

            {matchDetail.conflicting_evidence?.length > 0 && (
              <div className="evidence-group">

                <div className="evidence-group-header conflicting">
                  <AlertTriangle size={20} />
                  <div>
                    <h3>Conflicting Evidence</h3>
                    <p>Information that needs human attention.</p>
                  </div>
                </div>

                {matchDetail.conflicting_evidence.map(
                  (evidence, i) => (
                    <div className="evidence-card conflict-card" key={i}>
                      <span className="evidence-type">
                        CONFLICT #{i + 1}
                      </span>
                      <p>{evidence}</p>
                    </div>
                  )
                )}

              </div>
            )}

            {/* Missing */}

            {matchDetail.missing_evidence?.length > 0 && (
              <div className="evidence-group">

                <div className="evidence-group-header missing">
                  <Clock size={20} />
                  <div>
                    <h3>Missing Evidence</h3>
                    <p>Information that could increase confidence.</p>
                  </div>
                </div>

                {matchDetail.missing_evidence.map((evidence, i) => (
                  <div className="evidence-card missing-card" key={i}>
                    <span className="evidence-type">
                      MISSING #{i + 1}
                    </span>
                    <p>{evidence}</p>
                  </div>
                ))}

              </div>
            )}

            {/* Next Best Evidence */}

            {matchDetail.next_best_evidence &&
              Object.keys(matchDetail.next_best_evidence).length >
                0 && (
                <div className="evidence-group">
                  <div className="evidence-group-header missing">
                    <Clock size={20} />
                    <div>
                      <h3>Next Best Evidence</h3>
                      <p>
                        Recommended evidence to gather next.
                      </p>
                    </div>
                  </div>

                  <div className="evidence-grid">
                    {Object.entries(
                      matchDetail.next_best_evidence
                    ).map(([key, value]) => (
                      <div
                        className="evidence-card missing-card"
                        key={key}
                      >
                        <span className="evidence-type">
                          {key.toUpperCase()}
                        </span>
                        <p>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

          </section>
        ) : (
          <section
            className="evidence-section"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
              color: "#64748b",
              gap: "10px",
            }}
          >
            <Loader2 size={20} className="spin" />
            Loading evidence details…
          </section>
        )}

        {/* Verification */}

        <section className="verification-panel">

          <div className="verification-icon">
            <ShieldCheck size={25} />
          </div>

          <div className="verification-content">

            <h2>
              {matchDetail?.status === "verified"
                ? "Match Verified"
                : matchDetail?.status === "rejected"
                  ? "Match Rejected"
                  : matchDetail?.status === "info_requested"
                    ? "More Information Requested"
                    : "Human Verification Required"}
            </h2>

            <p>
              {matchDetail?.status === "verified"
                ? "This match has been confirmed by an authorized authority."
                : matchDetail?.status === "rejected"
                  ? "This match has been rejected. It was determined not to be the same person."
                  : matchDetail?.status === "info_requested"
                    ? "Additional information has been requested for this match."
                    : "AI has identified a potential match, but it does not independently confirm identity. An authorized authority must review the evidence before reunification."}
            </p>

            {matchDetail?.status !== "verified" &&
              matchDetail?.status !== "rejected" && (
                <div className="verification-actions">

                  <button
                    className="verify-button"
                    onClick={handleVerify}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={18} />
                    {actionLoading ? "Processing…" : "Confirm Match"}
                  </button>

                  <button
                    className="reject-button"
                    onClick={handleReject}
                    disabled={actionLoading}
                  >
                    Not the Same Person
                  </button>

                  <button
                    className="request-button"
                    onClick={handleRequestInfo}
                    disabled={actionLoading}
                  >
                    Request More Evidence
                  </button>

                </div>
              )}

          </div>

        </section>

      </main>
    </div>
  );
}

export default MatchReview;