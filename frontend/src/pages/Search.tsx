import { useState } from "react";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCase, searchCase, type CasePublicSearchResponse, type CaseResponse } from "../api/client";

type SearchResult = {
  caseId: string;
  name: string;
  status: string;
  age?: number | null;
  gender?: string | null;
  location?: string | null;
  clothing?: string | null;
  identifyingMarks?: string | null;
  description?: string | null;
};

function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      let found: SearchResult;
      const numericMatch = value.match(/^#?(\d+)$/);

      if (/^FH-\d+$/i.test(value)) {
        const item: CaseResponse = await getCase(value.toUpperCase());
        found = {
          caseId: value.toUpperCase(),
          name: item.name,
          status: item.status,
          location: item.last_seen_location,
          description: item.description,
        };
      } else if (numericMatch) {
        const numericId = numericMatch[1];
        const item: CaseResponse = await getCase(numericId);
        found = {
          caseId: String(item.id),
          name: item.name,
          status: item.status,
          location: item.last_seen_location,
          description: item.description,
        };
      } else {
        const item: CasePublicSearchResponse = await searchCase(value);
        found = {
          caseId: item.case_id,
          name: item.name,
          status: item.status,
          age: item.age,
          gender: item.gender,
          location: item.last_seen_location,
          clothing: item.clothing,
          identifyingMarks: item.identifying_marks,
        };
      }
      setResult(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="search-page">
      <div className="search-container">
        <button className="back-button" onClick={() => navigate("/")}>
          <ArrowLeft size={18} /> Back to Home
        </button>
        <header className="search-heading">
          <div className="search-main-icon"><SearchIcon size={28} /></div>
          <h1>Find a case</h1>
          <p>Search by public case ID or the person’s name.</p>
        </header>

        <form className="case-search-form" onSubmit={handleSearch}>
          <SearchIcon size={20} aria-hidden="true" />
          <label className="sr-only" htmlFor="case-search">Public case ID or name</label>
          <input
            id="case-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="FH-1234 or a person’s name"
            autoComplete="off"
            required
          />
          <button type="submit" disabled={loading}>{loading ? "Searching…" : "Search"}</button>
        </form>

        {loading && <p className="search-help" role="status">Searching case records…</p>}
        {error && <div className="form-alert error" role="alert">Could not load a case. {error}</div>}
        {!loading && !error && !result && (
          <div className="search-help">
            <strong>Track a case</strong>
            <p>Enter the public ID from the report, or search by name.</p>
          </div>
        )}

        {result && (
          <section className="search-result" aria-labelledby="case-result-name">
            <div className="result-header">
              <div>
                <span>{/^FH-\d+$/i.test(result.caseId) ? "PUBLIC CASE ID" : "CASE ID"}</span>
                <h2>{/^FH-\d+$/i.test(result.caseId) ? result.caseId : `#${result.caseId}`}</h2>
              </div>
              <div className="search-status"><span aria-hidden="true" />{result.status}</div>
            </div>
            <div className="result-person">
              <div className="person-avatar large" aria-hidden="true">
                {result.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "?"}
              </div>
              <div>
                <span className="card-label">CASE PERSON</span>
                <h2 id="case-result-name">{result.name}</h2>
                {(result.age != null || result.gender) && <p>{result.age != null ? result.age + " years" : ""}{result.age != null && result.gender ? " · " : ""}{result.gender ?? ""}</p>}
              </div>
            </div>
            <dl className="case-information">
              {result.location && <div><dt>Last seen location</dt><dd>{result.location}</dd></div>}
              {result.clothing && <div><dt>Clothing</dt><dd>{result.clothing}</dd></div>}
              {result.identifyingMarks && <div><dt>Identifying marks</dt><dd>{result.identifyingMarks}</dd></div>}
              {result.description && <div><dt>Additional information</dt><dd>{result.description}</dd></div>}
            </dl>
            <button
              className="primary-button case-open-button"
              onClick={() => navigate("/case/" + encodeURIComponent(result.caseId))}
            >
              View case status and matches
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

export default Search;
