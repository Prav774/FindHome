import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, AlertTriangle, Building2, CheckCircle, Clock, Loader2, MapPin, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCase,
  getCaseMatches,
  getMatch,
  getPerson,
  getPersonTimeline,
  generateMatches,
  verifyMatch,
  rejectMatch,
  requestMatchInfo,
  type CaseResponse,
  type MatchResponse,
  type MatchDetailResponse,
  type PersonResponse,
  type TimelineEventResponse,
} from "../api/client";
import { isAuthorityAuthenticated } from "../auth/authority";

type MatchView = {
  match: MatchResponse;
  detail: MatchDetailResponse | null;
  person: PersonResponse | null;
  timeline: TimelineEventResponse[] | null;
  detailError: string;
  personError: string;
  timelineError: string;
};

const MATCH_STATUS_LABELS: Record<string, string> = {
  POTENTIAL_MATCH: "Potential match · system suggestion",
  UNDER_VERIFICATION: "Under verification",
  VERIFIED: "Verified by an authorized responder",
  REJECTED: "Rejected",
  NEEDS_MORE_INFO: "More information requested",
};

function statusLabel(status: string): string {
  return MATCH_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "The request failed. Please try again.";
}

function chronological(events: TimelineEventResponse[]): TimelineEventResponse[] {
  return [...events].sort((a, b) => {
    const aTime = Date.parse(a.event_time ?? a.created_at);
    const bTime = Date.parse(b.event_time ?? b.created_at);
    if (Number.isNaN(aTime)) return Number.isNaN(bTime) ? 0 : 1;
    if (Number.isNaN(bTime)) return -1;
    return aTime - bTime;
  });
}

function MatchReview({ familyView = false }: { familyView?: boolean }) {
  const navigate = useNavigate();
  const { caseId: caseIdParam } = useParams<{ caseId: string }>();

  const isAuthority = isAuthorityAuthenticated();
  const effectiveFamilyView = familyView || !isAuthority;

  const [caseData, setCaseData] = useState<CaseResponse | null>(null);
  const [matchViews, setMatchViews] = useState<MatchView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [caseError, setCaseError] = useState("");
  const [matchesError, setMatchesError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const inFlight = useRef(false);
  const refreshQueued = useRef(false);
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  const hasLoaded = useRef(false);

  // Auto-dismiss action success feedback after 5 seconds with timer cleanup
  useEffect(() => {
    if (!actionMessage) return;
    const timer = window.setTimeout(() => {
      setActionMessage("");
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  const handleGenerateMatches = async () => {
    if (!caseData || generating) return;
    try {
      setGenerating(true);
      setGenerateError("");
      await generateMatches(caseData.id);
      await refresh();
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Failed to generate matches.");
    } finally {
      setGenerating(false);
    }
  };

  const refresh = useCallback(async () => {
    if (inFlight.current) {
      refreshQueued.current = true;
      return;
    }
    if (!caseIdParam) {
      setCaseError("No case ID was provided in the URL.");
      setLoading(false);
      hasLoaded.current = true;
      return;
    }
    inFlight.current = true;
    if (!hasLoaded.current) setLoading(true);
    else setRefreshing(true);
    setCaseError("");
    setMatchesError("");

    try {
      const currentCase = await getCase(caseIdParam);
      setCaseData(currentCase);
      let matchList: MatchResponse[];
      try {
        matchList = await getCaseMatches(currentCase.id);
        setMatchesError("");
      } catch (error) {
        setMatchesError(errorText(error));
        hasLoaded.current = true;
        return;
      }

      if (matchList.length === 0) {
        setMatchViews([]);
        hasLoaded.current = true;
        return;
      }

      const nextViews = await Promise.all(matchList.map(async (match): Promise<MatchView> => {
        const detailPromise = getMatch(match.id);
        const personPromise = match.person_id != null ? getPerson(match.person_id) : Promise.resolve(null);
        const timelinePromise = match.person_id != null ? getPersonTimeline(match.person_id) : Promise.resolve(null);

        const [detailResult, personResult, timelineResult] = await Promise.allSettled([
          detailPromise,
          personPromise,
          timelinePromise,
        ]);
        const detail = detailResult.status === "fulfilled" ? detailResult.value : null;
        const person = personResult.status === "fulfilled" ? personResult.value : null;
        const timeline = timelineResult.status === "fulfilled" && timelineResult.value
          ? chronological(timelineResult.value)
          : null;
        return {
          match,
          detail,
          person,
          timeline,
          detailError: detailResult.status === "rejected" ? errorText(detailResult.reason) : "",
          personError: match.person_id != null && personResult.status === "rejected" ? errorText(personResult.reason) : "",
          timelineError: match.person_id != null && timelineResult.status === "rejected" ? errorText(timelineResult.reason) : "",
        };
      }));
      setMatchViews(nextViews);
      hasLoaded.current = true;
    } catch (error) {
      setCaseError(errorText(error));
      hasLoaded.current = true;
    } finally {
      setLoading(false);
      setRefreshing(false);
      inFlight.current = false;
      if (refreshQueued.current) {
        refreshQueued.current = false;
        window.setTimeout(() => { void refreshRef.current(); }, 0);
      }
    }
  }, [caseIdParam]);

  useEffect(() => {
    refreshRef.current = refresh;
    hasLoaded.current = false;
    const initialTimer = window.setTimeout(() => { void refreshRef.current(); }, 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 15000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  async function runAction(matchId: number, action: (id: number) => Promise<MatchResponse>, success: string) {
    if (actionLoading !== null) return;
    setActionLoading(matchId);
    setActionMessage("");
    setActionError("");
    try {
      const result = await action(matchId);
      setActionMessage(success + " Current backend status: " + result.status + ".");
      await refresh();
    } catch (error) {
      setActionError(errorText(error));
    } finally {
      setActionLoading(null);
    }
  }

  const publicCaseId = caseIdParam && /^FH-\d+$/i.test(caseIdParam)
    ? caseIdParam.toUpperCase()
    : caseData ? `#${caseData.id}` : (caseIdParam ? `#${caseIdParam}` : "");
  const backTo = isAuthority ? "/authority" : "/search";
  const backLabel = isAuthority ? "Back to dashboard" : "Back to search";

  if (loading) {
    return (
      <main className="review-page">
        <header className="review-header">
          <button className="back-button" onClick={() => navigate(backTo)}><ArrowLeft size={18} /> {backLabel}</button>
          <div><div className="review-case-id">CASE {publicCaseId || "—"}</div><h1>{effectiveFamilyView ? "Case status" : "Match review"}</h1></div>
        </header>
        <div className="state-message" role="status"><Loader2 size={22} className="spin" /> Loading case and match information…</div>
      </main>
    );
  }

  if (!caseData) {
    return (
      <main className="review-page">
        <header className="review-header">
          <button className="back-button" onClick={() => navigate(backTo)}><ArrowLeft size={18} /> {backLabel}</button>
          <div><div className="review-case-id">CASE {publicCaseId || "—"}</div><h1>Case status</h1></div>
        </header>
        <section className="state-card error-state" role="alert">
          <XCircle size={24} />
          <div><h2>Unable to load this case</h2><p>{caseError || "Check the public case ID and backend connection, then try again."}</p></div>
          <button className="secondary-button" onClick={() => void refresh()}>Retry</button>
        </section>
      </main>
    );
  }

  return (
    <main className="review-page">
      <header className="review-header">
        <button className="back-button" onClick={() => navigate(backTo)}><ArrowLeft size={18} /> {backLabel}</button>
        <div>
          <div className="review-case-id">{publicCaseId.startsWith("#") ? `CASE ${publicCaseId}` : `PUBLIC CASE ID · ${publicCaseId}`}</div>
          <h1>{effectiveFamilyView ? "Case status" : "Match review"}</h1>
          <p>Case updates and potential matches from FindHome.</p>
        </div>
        <button className="refresh-button" onClick={() => void refresh()} disabled={refreshing}>
          <RefreshCw size={17} className={refreshing ? "spin" : undefined} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {caseError && (
        <div className="form-alert error" role="alert" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Case refresh failed: {caseError}</span>
          <button
            type="button"
            onClick={() => setCaseError("")}
            aria-label="Dismiss error"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", fontSize: "18px", lineHeight: "1", padding: "0 6px" }}
          >
            ×
          </button>
        </div>
      )}
      {matchesError && (
        <div className="form-alert error" role="alert" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Could not refresh matches: {matchesError}</span>
          <button
            type="button"
            onClick={() => setMatchesError("")}
            aria-label="Dismiss error"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", fontSize: "18px", lineHeight: "1", padding: "0 6px" }}
          >
            ×
          </button>
        </div>
      )}
      {generateError && (
        <div className="form-alert error" role="alert" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Match generation failed: {generateError}</span>
          <button
            type="button"
            onClick={() => setGenerateError("")}
            aria-label="Dismiss error"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", fontSize: "18px", lineHeight: "1", padding: "0 6px" }}
          >
            ×
          </button>
        </div>
      )}
      {actionMessage && (
        <div className="form-alert success" role="status" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage("")}
            aria-label="Dismiss message"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", fontSize: "18px", lineHeight: "1", padding: "0 6px" }}
          >
            ×
          </button>
        </div>
      )}
      {actionError && (
        <div className="form-alert error" role="alert" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Action failed: {actionError}</span>
          <button
            type="button"
            onClick={() => setActionError("")}
            aria-label="Dismiss error"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", fontSize: "18px", lineHeight: "1", padding: "0 6px" }}
          >
            ×
          </button>
        </div>
      )}

      <section className="case-overview">
        <div className="case-overview-heading">
          <div><span className="card-label">PERSON REPORTED</span><h2>{caseData.name}</h2></div>
          <span className="case-status-value">{caseData.status}</span>
        </div>
        <dl className="case-information">
          {caseData.last_seen_location && <div><dt><MapPin size={16} /> Last seen location</dt><dd>{caseData.last_seen_location}</dd></div>}
          {caseData.description && <div><dt>Additional information</dt><dd>{caseData.description}</dd></div>}
          <div><dt>Report created</dt><dd><time dateTime={caseData.created_at}>{new Date(caseData.created_at).toLocaleString()}</time></dd></div>
          {caseData.updated_at && <div><dt>Last case update</dt><dd><time dateTime={caseData.updated_at}>{new Date(caseData.updated_at).toLocaleString()}</time></dd></div>}
        </dl>
      </section>

      <section className="match-list-section" aria-labelledby="potential-matches-heading">
        <div className="section-heading">
          <div><h2 id="potential-matches-heading">Potential matches</h2><p>System suggestions require human verification.</p></div>
          {refreshing && <span className="refreshing-label" role="status">Checking for updates…</span>}
        </div>

        {matchViews.length === 0 && !matchesError && (
          <div className="state-card empty-state">
            <Clock size={25} />
            <div>
              <h3>No high-confidence match yet</h3>
              <p>The case remains in the system. New match results will appear here as records are updated.</p>
              {isAuthority && (
                <div style={{ marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="generate-button"
                    disabled={generating || refreshing}
                    onClick={() => void handleGenerateMatches()}
                  >
                    {generating ? (
                      <>
                        <Loader2 size={16} className="spin" /> Generating matches…
                      </>
                    ) : (
                      <>
                        <RefreshCw size={15} /> Generate Match
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {matchViews.map(({ match, detail, person, timeline, detailError, personError, timelineError }) => {
          const supporting = detail?.supporting_evidence ?? [];
          const conflicting = detail?.conflicting_evidence ?? [];
          const missing = detail?.missing_evidence ?? [];
          const nextEvidence = detail?.next_best_evidence ?? {};
          const effectiveStatus = detail?.status ?? match.status;
          const finished = effectiveStatus === "VERIFIED" || effectiveStatus === "REJECTED";

          const isSourceRecord = match.person_id == null;
          const sourceRecord = detail?.source_record ?? match.source_record;
          const sourceRecordId = detail?.source_record_id ?? match.source_record_id ?? sourceRecord?.id;

          const candidateName = isSourceRecord
            ? (sourceRecord?.raw_name || (sourceRecordId != null ? `Source Record #${sourceRecordId}` : "Imported Source Record"))
            : (person?.name || (match.person_id != null ? `Person #${match.person_id}` : "Person information unavailable"));

          const candidateSubtitle = isSourceRecord ? (
            sourceRecord ? (
              [
                sourceRecord.source_type ? sourceRecord.source_type.replaceAll("_", " ") : null,
                sourceRecord.organization,
                sourceRecord.raw_age != null ? `${sourceRecord.raw_age} years` : null,
                sourceRecord.raw_gender,
                sourceRecord.location,
              ].filter(Boolean).join(" · ") || "Imported source record details"
            ) : "Imported source record — not yet linked to a person."
          ) : (
            person ? (
              [person.age != null ? `${person.age} years` : null, person.gender, person.status].filter(Boolean).join(" · ") || "No additional person details returned"
            ) : null
          );

          return (
            <article className="match-detail-card" key={match.id}>
              <header className="match-card-header">
                <div>
                  <span className="card-label">
                    {isSourceRecord ? "IMPORTED SOURCE RECORD CANDIDATE" : "SYSTEM SUGGESTION"}
                  </span>
                  <h3>{candidateName}</h3>
                  {candidateSubtitle && <p>{candidateSubtitle}</p>}
                  {isSourceRecord ? (
                    <p className="inline-note" style={{ color: "#0f766e", fontWeight: 500, marginTop: "4px" }}>
                      Imported source record — not yet linked to a person.
                    </p>
                  ) : (
                    personError ? <p className="inline-note">Person details could not be loaded: {personError}</p> : !person && <p className="inline-note">Loading person details…</p>
                  )}
                </div>
                <div className="match-score-box">
                  <span>Match score</span>
                  <strong>{match.score} / 100</strong>
                  <small>System score, not a probability</small>
                </div>
              </header>

              <div className={"match-status-line status-" + effectiveStatus.toLowerCase().replaceAll("_", "-")}><ShieldCheck size={18} /><strong>{statusLabel(effectiveStatus)}</strong></div>

              {isSourceRecord && sourceRecord && (
                <section
                  className="source-record-details"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "14px 18px",
                    margin: "12px 0 16px",
                  }}
                >
                  <h4 style={{ margin: "0 0 10px", fontSize: "0.92rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Building2 size={16} color="#0f766e" /> Source Record Information
                  </h4>
                  <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px 16px", margin: 0, fontSize: "0.875rem" }}>
                    <div>
                      <dt style={{ color: "#64748b", fontWeight: 500 }}>Source Type</dt>
                      <dd style={{ margin: 0, fontWeight: 600, color: "#0f172a" }}>
                        {sourceRecord.source_type ? sourceRecord.source_type.replaceAll("_", " ") : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt style={{ color: "#64748b", fontWeight: 500 }}>Organization / Facility</dt>
                      <dd style={{ margin: 0, fontWeight: 600, color: "#0f172a" }}>
                        {sourceRecord.organization || "—"}
                      </dd>
                    </div>
                    {sourceRecord.external_record_id && (
                      <div>
                        <dt style={{ color: "#64748b", fontWeight: 500 }}>External Record ID</dt>
                        <dd style={{ margin: 0, fontWeight: 600, color: "#0f172a" }}>
                          #{sourceRecord.external_record_id}
                          {sourceRecord.external_source ? ` (${sourceRecord.external_source})` : ""}
                        </dd>
                      </div>
                    )}
                    {sourceRecord.location && (
                      <div>
                        <dt style={{ color: "#64748b", fontWeight: 500 }}>Recorded Location</dt>
                        <dd style={{ margin: 0, fontWeight: 600, color: "#0f172a" }}>
                          {sourceRecord.location}
                        </dd>
                      </div>
                    )}
                    {sourceRecord.raw_description && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <dt style={{ color: "#64748b", fontWeight: 500 }}>Description</dt>
                        <dd style={{ margin: 0, color: "#0f172a" }}>
                          {sourceRecord.raw_description}
                        </dd>
                      </div>
                    )}
                    {sourceRecord.recorded_at && (
                      <div>
                        <dt style={{ color: "#64748b", fontWeight: 500 }}>Recorded Timestamp</dt>
                        <dd style={{ margin: 0, color: "#0f172a" }}>
                          {new Date(sourceRecord.recorded_at).toLocaleString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {detailError ? <div className="inline-alert" role="alert">Match explanation and evidence could not be loaded: {detailError}</div> : !detail ? <p className="inline-note" role="status">Loading match evidence…</p> : (
                <div className="match-evidence-content">
                  {detail.explanation && <section className="explanation-block"><h4>Why this was suggested</h4><p>{detail.explanation}</p></section>}
                  <EvidenceGroup title="Supporting evidence" items={supporting} kind="supporting" />
                  <EvidenceGroup title="Conflicting evidence" items={conflicting} kind="conflicting" />
                  <EvidenceGroup title="Information not yet available" items={missing} kind="missing" />
                  {Object.keys(nextEvidence).length > 0 && <div className="evidence-group"><h4>Suggested next information</h4><ul>{Object.entries(nextEvidence).map(([key, value]) => <li key={key}><strong>{key.replaceAll("_", " ")}: </strong>{value}</li>)}</ul></div>}
                  {supporting.length + conflicting.length + missing.length === 0 && <p className="inline-note">No supporting, conflicting, or missing evidence details were returned for this match.</p>}
                </div>
              )}

              <section className="timeline-section" aria-label="Candidate timeline">
                <div className="timeline-heading"><Clock size={19} /><h4>Timeline</h4></div>
                {isSourceRecord ? (
                  <div className="source-record-timeline" style={{ padding: "8px 0" }}>
                    {sourceRecord?.recorded_at ? (
                      <ol className="timeline-list">
                        <li>
                          <time dateTime={sourceRecord.recorded_at}>{new Date(sourceRecord.recorded_at).toLocaleString()}</time>
                          <strong>{sourceRecord.source_type ? `${sourceRecord.source_type.replaceAll("_", " ")} Intake Recorded` : "Source Record Ingested"}</strong>
                          {sourceRecord.location && <span><MapPin size={14} /> {sourceRecord.location}</span>}
                          {sourceRecord.organization && <p>Facility: {sourceRecord.organization}</p>}
                          {sourceRecord.external_record_id && <small>External Record #{sourceRecord.external_record_id}</small>}
                        </li>
                      </ol>
                    ) : null}
                    <p className="inline-note" style={{ marginTop: sourceRecord?.recorded_at ? "12px" : "0" }}>
                      No person timeline is available until this source record is linked to a person.
                    </p>
                  </div>
                ) : (
                  <>
                    {timelineError && <p className="inline-alert" role="alert">Timeline could not be loaded: {timelineError}</p>}
                    {timeline === null && !timelineError && <p className="inline-note">Loading timeline…</p>}
                    {timeline?.length === 0 && <p className="inline-note">No timeline events are available yet.</p>}
                    {timeline && timeline.length > 0 && <ol className="timeline-list">
                      {timeline.map((event) => {
                        const time = event.event_time ?? event.created_at;
                        return <li key={event.id}>
                          <time dateTime={time}>{new Date(time).toLocaleString()}</time>
                          <strong>{event.event_type}</strong>
                          {event.location && <span><MapPin size={14} /> {event.location}</span>}
                          {event.description && <p>{event.description}</p>}
                          {event.source && <small>Source: {event.source}</small>}
                        </li>;
                      })}
                    </ol>}
                  </>
                )}
              </section>

              <footer className="verification-footer">
                <div><strong>{effectiveStatus === "VERIFIED" ? "Human verification complete" : effectiveStatus === "REJECTED" ? "This suggestion was rejected" : effectiveStatus === "NEEDS_MORE_INFO" ? "More information was requested" : "Human verification required"}</strong><p>AI suggestions do not confirm identity. An authorized responder makes the verification decision.</p></div>
                {effectiveFamilyView ? (
                  <div className="verification-actions">
                    <p className="trust-copy" style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted, #666)" }}>
                      Final verification decisions require an authorized responder.
                    </p>
                  </div>
                ) : !finished ? (
                  <div className="verification-actions">
                    <button className="verify-button" disabled={actionLoading !== null} onClick={() => void runAction(match.id, verifyMatch, "Verification saved.")}>{actionLoading === match.id ? <Loader2 size={17} className="spin" /> : <CheckCircle size={17} />} Verify Match</button>
                    <button className="reject-button" disabled={actionLoading !== null} onClick={() => void runAction(match.id, rejectMatch, "Rejection saved.")}><XCircle size={17} /> Reject Match</button>
                    <button className="request-button" disabled={actionLoading !== null} onClick={() => void runAction(match.id, requestMatchInfo, "Information request saved.")}><AlertTriangle size={17} /> Request Information</button>
                  </div>
                ) : null}
              </footer>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function EvidenceGroup({ title, items, kind }: { title: string; items: string[]; kind: "supporting" | "conflicting" | "missing" }) {
  if (items.length === 0) return null;
  return <section className={"evidence-group " + kind}>
    <h4>{title}</h4>
    <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul>
  </section>;
}

export default MatchReview;
