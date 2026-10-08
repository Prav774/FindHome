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

function Search() {
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!searchValue.trim()) return;

    setSearched(true);
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
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Enter Case ID or person's name"
          />

          <button type="submit">
            Search
          </button>
        </form>

        {!searched && (
          <div className="search-help">
            <strong>Example</strong>

            <p>
              Try searching for <b>FH-1024</b> to view a sample
              reunification case.
            </p>
          </div>
        )}

        {searched && (
          <section className="search-result">

            <div className="result-header">

              <div>
                <span>CASE ID</span>
                <h2>FH-1024</h2>
              </div>

              <div className="search-status">
                <span />
                Searching
              </div>

            </div>

            <div className="result-person">

              <div className="person-avatar large">
                AK
              </div>

              <div>
                <span className="card-label">
                  MISSING PERSON
                </span>

                <h2>Arun Kumar</h2>

                <p>
                  42 years • Male
                </p>
              </div>

            </div>

            <div className="result-stats">

              <div>
                <strong>3</strong>
                <span>Connected records</span>
              </div>

              <div>
                <strong>1</strong>
                <span>Potential match</span>
              </div>

              <div>
                <strong>94%</strong>
                <span>Highest confidence</span>
              </div>

            </div>

            <div className="latest-update">

              <div className="update-icon">
                <Clock size={19} />
              </div>

              <div>
                <span>Latest update</span>

                <strong>
                  New shelter record connected
                </strong>

                <p>
                  A record from Shelter #17 may correspond to
                  this case.
                </p>

                <small>
                  Today • 11:42 AM
                </small>
              </div>

            </div>

            <div className="evidence-preview">

              <div className="section-heading">
                <div>
                  <h2>Evidence Found</h2>

                  <p>
                    Information connected to this case.
                  </p>
                </div>
              </div>

              <div className="search-evidence-grid">

                <div className="search-evidence-card">
                  <MapPin size={19} />

                  <div>
                    <strong>Location match</strong>

                    <p>
                      Rescue location is 1.2 km from the
                      last known location.
                    </p>
                  </div>
                </div>

                <div className="search-evidence-card">
                  <CheckCircle size={19} />

                  <div>
                    <strong>Physical match</strong>

                    <p>
                      Clothing description is consistent.
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

              <button
                onClick={() => navigate("/")}
              >
                Back to Home
              </button>

            </div>

          </section>
        )}

      </div>
    </div>
  );
}

export default Search;