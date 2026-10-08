import {
  ArrowLeft,
  CheckCircle,
  Clock,
  MapPin,
  Search as SearchIcon,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  searchCase,
  getCase,
  type CasePublicSearchResponse,
  type CaseResponse,
} from "../api/client";

function Search() {
  const navigate = useNavigate();

  // Normalized display type for search results
  interface SearchResultData {
    case_id: string;
    name: string;
    age: number | null;
    gender: string | null;
    last_seen_location: string | null;
    clothing: string | null;
    identifying_marks: string | null;
    status: string;
  }

  const [searchValue, setSearchValue] = useState("");
  const [searched, setSearched] = useState(false);
  const [caseData, setCaseData] =
    useState<SearchResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCaseId = (input: string) =>
    /^FH-\d+$/i.test(input.trim());

  const handleSearch = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const query = searchValue.trim();
    if (!query) return;

    setLoading(true);
    setError("");
    setSearched(false);
    setCaseData(null);

    try {
      let result: SearchResultData;

      if (isCaseId(query)) {
        // FH-XXXX Case ID → use GET /api/cases/{case_id}
        const caseResp: CaseResponse = await getCase(
          query.toUpperCase()
        );

        result = {
          case_id: query.toUpperCase(),
          name: caseResp.name,
          age: null,
          gender: null,
          last_seen_location: caseResp.last_seen_location,
          clothing: null,
          identifying_marks: null,
          status: caseResp.status,
        };
      } else {
        // Name search → use GET /api/cases/search?q=
        const searchResp: CasePublicSearchResponse =
          await searchCase(query);

        result = {
          case_id: searchResp.case_id,
          name: searchResp.name,
          age: searchResp.age,
          gender: searchResp.gender,
          last_seen_location: searchResp.last_seen_location,
          clothing: searchResp.clothing,
          identifying_marks: searchResp.identifying_marks,
          status: searchResp.status,
        };
      }

      setCaseData(result);
      setSearched(true);
    } catch (err) {
      console.error(err);
      setError(
        "Case not found. Please check the Case ID or name."
      );
      setCaseData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <div className="search-container">

        <button
          className="back-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={18} />
          Back to Home
        </button>

        <div className="search-heading">
          <div className="search-main-icon">
            <SearchIcon size={28} />
          </div>

          <h1>Search for Someone</h1>

          <p>
            Track a FindHome case or search for a person using the
            information available to you.
          </p>
        </div>

        <form
          className="case-search-form"
          onSubmit={handleSearch}
        >
          <SearchIcon size={20} />

          <input
            value={searchValue}
            onChange={(event) =>
              setSearchValue(event.target.value)
            }
            placeholder="Enter Case ID or person's name"
          />

          <button type="submit">
            Search
          </button>
        </form>

        {loading && (
          <div className="search-help">
            <strong>Searching...</strong>

            <p>
              FindHome is checking connected records.
            </p>
          </div>
        )}

        {error && (
          <div className="search-warning">
            <ShieldCheck size={20} />

            <div>
              <strong>Search failed</strong>

              <p>{error}</p>
            </div>
          </div>
        )}

        {!searched && !loading && !error && (
          <div className="search-help">
            <strong>Example</strong>

            <p>
              Try searching for <b>FH-5492</b> to view a sample
              reunification case.
            </p>
          </div>
        )}

        {searched && caseData && (
          <section className="search-result">

            <div className="result-header">

              <div>
                <span>CASE ID</span>

                <h2>
                  {caseData.case_id}
                </h2>
              </div>

              <div className="search-status">
                <span />
                {caseData.status}
              </div>

            </div>

            <div className="result-person">

              <div className="person-avatar large">
                {caseData.name
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
                  MISSING PERSON
                </span>

                <h2>
                  {caseData.name}
                </h2>

                <p>
                  {caseData.age !== null
                    ? `${caseData.age} years`
                    : "Age unknown"}
                  {" • "}
                  {caseData.gender ?? "Gender unknown"}
                </p>
              </div>

            </div>

            <div className="result-stats">

              <div>
                <strong>—</strong>
                <span>Connected records</span>
              </div>

              <div>
                <strong>—</strong>
                <span>Potential match</span>
              </div>

              <div>
                <strong>—</strong>
                <span>Highest confidence</span>
              </div>

            </div>

            <div className="latest-update">

              <div className="update-icon">
                <Clock size={19} />
              </div>

              <div>
                <span>Case status</span>

                <strong>
                  {caseData.status}
                </strong>

                <p>
                  FindHome is continuously searching connected
                  records for this case.
                </p>

                <small>
                  Last seen:{" "}
                  {caseData.last_seen_location ??
                    "Location not available"}
                </small>
              </div>

            </div>

            <div className="evidence-preview">

              <div className="section-heading">
                <div>
                  <h2>Reported Information</h2>

                  <p>
                    Information submitted for this case.
                  </p>
                </div>
              </div>

              <div className="search-evidence-grid">

                <div className="search-evidence-card">
                  <MapPin size={19} />

                  <div>
                    <strong>Last seen location</strong>

                    <p>
                      {caseData.last_seen_location ??
                        "Not available"}
                    </p>
                  </div>
                </div>

                <div className="search-evidence-card">
                  <CheckCircle size={19} />

                  <div>
                    <strong>Clothing</strong>

                    <p>
                      {caseData.clothing ??
                        "Not available"}
                    </p>
                  </div>
                </div>

                <div className="search-evidence-card">
                  <ShieldCheck size={19} />

                  <div>
                    <strong>Identifying marks</strong>

                    <p>
                      {caseData.identifying_marks ??
                        "Not available"}
                    </p>
                  </div>
                </div>

              </div>

            </div>

            <div className="search-warning">

              <ShieldCheck size={20} />

              <div>
                <strong>
                  Verification is still required
                </strong>

                <p>
                  A potential match does not mean identity has
                  been confirmed. Authorized personnel must
                  verify the evidence.
                </p>
              </div>

            </div>

            <div className="search-result-footer">

              <p>
                FindHome continues searching even when no
                high-confidence match is available.
              </p>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </button>

                <button
                  style={{
                    background: "#0f766e",
                    color: "white",
                    border: "none",
                  }}
                  onClick={() =>
                    navigate(`/review/${caseData.case_id}`)
                  }
                >
                  Review Matches
                </button>
              </div>

            </div>

          </section>
        )}

      </div>
    </div>
  );
}

export default Search;