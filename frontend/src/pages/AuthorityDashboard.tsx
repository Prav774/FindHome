import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCases, type CaseResponse } from "../api/client";

function AuthorityDashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseResponse[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadCases(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      setCases(await getCases());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load cases.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;
    getCases()
      .then((data) => { if (active) setCases(data); })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Could not load cases."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleCases = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return [...cases]
      .filter((item) => !term || [item.name, item.status, item.last_seen_location, item.description].some((value) => value?.toLocaleLowerCase().includes(term)))
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [cases, query]);

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <button className="back-button" onClick={() => navigate("/")}><ArrowLeft size={18} /> Home</button>
          <div className="dashboard-logo"><ShieldCheck size={24} /> FindHome</div>
          <h1>Responder case list</h1>
          <p>Cases returned by the backend. Open a case using its public ID to review matches and evidence.</p>
        </div>
        <button className="primary-button" onClick={() => navigate("/search")}>Search by public case ID</button>
      </header>

      <section className="dashboard-container">
        <div className="dashboard-panel">
          <div className="panel-header">
            <div><h2>Cases</h2><p>{cases.length} case{cases.length === 1 ? "" : "s"} returned by the API</p></div>
            <div className="dashboard-controls">
              <label className="search-box"><Search size={18} /><span className="sr-only">Filter loaded cases</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter name or status" /></label>
              <button className="refresh-button" onClick={() => void loadCases(true)} disabled={refreshing}><RefreshCw size={17} className={refreshing ? "spin" : undefined} /> Refresh</button>
            </div>
          </div>

          {loading && <div className="state-message" role="status">Loading cases…</div>}
          {error && <div className="form-alert error" role="alert">Cases could not be loaded: {error}<button className="text-button" onClick={() => void loadCases()}>Retry</button></div>}
          {!loading && !error && visibleCases.length === 0 && (
            <div className="state-card empty-state"><div><h3>{cases.length === 0 ? "No cases returned" : "No cases match this filter"}</h3><p>{cases.length === 0 ? "When cases are available, they will appear here." : "Try another name or status."}</p></div></div>
          )}
          {!loading && !error && visibleCases.length > 0 && (
            <ul className="case-list">
              {visibleCases.map((item) => (
                <li className="case-list-item" key={item.id}>
                  <div><span className="card-label">CASE PERSON</span><h3>{item.name}</h3>{item.last_seen_location && <p>{item.last_seen_location}</p>}</div>
                  <div><span className="card-label">BACKEND STATUS</span><strong className="case-status-value">{item.status}</strong><small><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></small></div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="dashboard-note">The case list endpoint does not return public case IDs. Use the FH-XXXX search above to open a case; internal database IDs are not shown here.</p>
      </section>
    </main>
  );
}

export default AuthorityDashboard;
