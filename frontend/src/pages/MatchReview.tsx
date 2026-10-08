import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Loader2, MapPin, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCase,
  getCaseMatches,
  getMatch,
  getPerson,
  getPersonTimeline,
  verifyMatch,
  rejectMatch,
  requestMatchInfo,
  type CaseResponse,
  type MatchResponse,
  type MatchDetailResponse,
  type PersonResponse,
  type TimelineEventResponse,
} from "../api/client";

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
  const [caseData, setCaseData] = useState<CaseResponse | null>(null);
  const [matchViews, setMatchViews] = useState<MatchView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [caseError, setCaseError] = useState("");
  const [matchesError, setMatchesError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const inFlight = useRef(false);
  const refreshQueued = useRef(false);
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  const hasLoaded = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) {
      refreshQueued.current = true;
      return;
    }
    if (!caseIdParam || !/^FH-\d+$/i.test(caseIdParam)) {
      setCaseError("Enter a public case ID in FH-XXXX format.");
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
      const currentCase = await getCase(caseIdParam.toUpperCase());
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
        const [detailResult, personResult, timelineResult] = await Promise.allSettled([
          getMatch(match.id),
          getPerson(match.person_id),
          getPersonTimeline(match.person_id),
        ]);
        const detail = detailResult.status === "fulfilled" ? detailResult.value : null;
        const person = personResult.status === "fulfilled" ? personResult.value : null;
        const timeline = timelineResult.status === "fulfilled" ? chronological(timelineResult.value) : null;
        return {
          match,
          detail,
          person,
          timeline,
          detailError: detailResult.status === "rejected" ? errorText(detailResult.reason) : "",
          personError: personResult.status === "rejected" ? errorText(personResult.reason) : "",
          timelineError: timelineResult.status === "rejected" ? errorText(timelineResult.reason) : "",
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

  const publicCaseId = caseIdParam && /^FH-\d+$/i.test(caseIdParam) ? caseIdParam.toUpperCase() : "";
  const backTo = familyView ? "/search" : "/authority";

  if (loading) {
    return (
      <main className="review-page">
        <header className="review-header">
          <button className="back-button" onClick={() => navigate(backTo)}><ArrowLeft size={18} /> Back</button>
          <div><div className="review-case-id">CASE {publicCaseId || "—"}</div><h1>{familyView ? "Case status" : "Match review"}</h1></div>
        </header>
        <div className="state-message" role="status"><Loader2 size={22} className="spin" /> Loading case and match information…</div>
      </main>
    );
  }

  if (!caseData) {
    return (
      <main className="review-page">
        <header className="review-header">
          <button className="back-button" onClick={() => navigate(backTo)}><ArrowLeft size={18} /> Back</button>
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
        <button className="back-button" onClick={() => navigate(backTo)}><ArrowLeft size={18} /> {familyView ? "Back to search" : "Back to dashboard"}</button>
        <div>
          <div className="review-case-id">PUBLIC CASE ID · {publicCaseId}</div>
          <h1>{familyView ? "Case status" : "Match review"}</h1>
          <p>Case updates and potential matches from FindHome.</p>
        </div>
        <button className="refresh-button" onClick={() => void refresh()} disabled={refreshing}>
          <RefreshCw size={17} className={refreshing ? "spin" : undefined} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {caseError && <div className="form-alert error" role="alert">Case refresh failed: {caseError}</div>}
      {matchesError && <div className="form-alert error" role="alert">Could not refresh matches: {matchesError}</div>}
      {actionMessage && <div className="form-alert success" role="status">{actionMessage}</div>}
      {actionError && <div className="form-alert error" role="alert">Action failed: {actionError}</div>}

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
            <div><h3>No high-confidence match yet</h3><p>The case remains in the system. New match results will appear here as records are updated.</p></div>
          </div>
        )}

        {matchViews.map(({ match, detail, person, timeline, detailError, personError, timelineError }) => {
          const supporting = detail?.supporting_evidence ?? [];
          const conflicting = detail?.conflicting_evidence ?? [];
          const missing = detail?.missing_evidence ?? [];
          const nextEvidence = detail?.next_best_evidence ?? {};
          const effectiveStatus = detail?.status ?? match.status;
          const finished = effectiveStatus === "VERIFIED" || effectiveStatus === "REJECTED";
          return (
            <article className="match-detail-card" key={match.id}>
              <header className="match-card-header">
                <div>
                  <span className="card-label">SYSTEM SUGGESTION</span>
                  <h3>{person?.name || "Person information unavailable"}</h3>
                  {person && <p>{[person.age != null ? person.age + " years" : null, person.gender, person.status].filter(Boolean).join(" · ") || "No additional person details returned"}</p>}
                  {personError ? <p className="inline-note">Person details could not be loaded: {personError}</p> : !person && <p className="inline-note">Loading person details…</p>}
                </div>
                <div className="match-score-box">
                  <span>Match score</span>
                  <strong>{String(match.score)}</strong>
                  <small>System score, not a probability</small>
                </div>
              </header>

              <div className={"match-status-line status-" + effectiveStatus.toLowerCase().replaceAll("_", "-")}><ShieldCheck size={18} /><strong>{statusLabel(effectiveStatus)}</strong></div>

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

              <section className="timeline-section" aria-label="Person timeline">
                <div className="timeline-heading"><Clock size={19} /><h4>Timeline</h4></div>
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
              </section>

              <footer className="verification-footer">
                <div><strong>{effectiveStatus === "VERIFIED" ? "Human verification complete" : effectiveStatus === "REJECTED" ? "This suggestion was rejected" : effectiveStatus === "NEEDS_MORE_INFO" ? "More information was requested" : "Human verification required"}</strong><p>AI suggestions do not confirm identity. An authorized responder makes the verification decision.</p></div>
                {!familyView && !finished && (
                  <div className="verification-actions">
                    <button className="verify-button" disabled={actionLoading !== null} onClick={() => void runAction(match.id, verifyMatch, "Verification saved.")}>{actionLoading === match.id ? <Loader2 size={17} className="spin" /> : <CheckCircle size={17} />} Verify</button>
                    <button className="reject-button" disabled={actionLoading !== null} onClick={() => void runAction(match.id, rejectMatch, "Rejection saved.")}><XCircle size={17} /> Reject</button>
                    <button className="request-button" disabled={actionLoading !== null} onClick={() => void runAction(match.id, requestMatchInfo, "Information request saved.")}><AlertTriangle size={17} /> Request more information</button>
                  </div>
                )}
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
