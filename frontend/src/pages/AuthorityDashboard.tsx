import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Users,
  ShieldCheck,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  LogOut,
} from "lucide-react";

import {
  getCases,
  getCaseMatches,
  generateMatches,
} from "../api/client";
import { clearAuthoritySession } from "../auth/authority";

type CaseItem = {
  id: number;
  name: string;
  description?: string | null;
  last_seen_location?: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
};

type MatchItem = {
  id: number;
  case_id: number;
  person_id: number | null;
  source_record_id?: number | null;
  score: number;
  status: string;
  explanation?: string | null;
  created_at: string;
};

export default function AuthorityDashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [matches, setMatches] = useState<Record<number, MatchItem[]>>({});

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const caseData = await getCases();
      setCases(caseData);

      const matchMap: Record<number, MatchItem[]> = {};

      await Promise.all(
        caseData.map(async (caseItem) => {
          try {
            const caseMatches = await getCaseMatches(caseItem.id);
            matchMap[caseItem.id] = caseMatches;
          } catch {
            matchMap[caseItem.id] = [];
          }
        })
      );

      setMatches(matchMap);
    } catch (err) {
      console.error(err);
      setError("Unable to load authority dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const allMatches = useMemo(() => {
    return Object.values(matches).flat();
  }, [matches]);

  const approvedCount = useMemo(() => {
    return allMatches.filter(
      (match) => (match.status || "").toUpperCase() === "VERIFIED"
    ).length;
  }, [allMatches]);

  const rejectedCount = useMemo(() => {
    return allMatches.filter((match) =>
      ["REJECTED", "NOT_MATCH", "NOT_A_MATCH"].includes(
        (match.status || "").toUpperCase()
      )
    ).length;
  }, [allMatches]);

  const filteredCases = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return cases;

    return cases.filter((item) => {
      return (
        String(item.id).includes(query) ||
        item.name?.toLowerCase().includes(query) ||
        item.last_seen_location?.toLowerCase().includes(query) ||
        item.status?.toLowerCase().includes(query)
      );
    });
  }, [cases, search]);

  const getBestMatch = (caseId: number) => {
    const caseMatches = matches[caseId] || [];

    if (!caseMatches.length) return null;

    return [...caseMatches].sort((a, b) => b.score - a.score)[0];
  };

  const generateForCase = async (
    caseId: number,
    event?: React.MouseEvent<HTMLButtonElement>
  ) => {
  event?.preventDefault();
  event?.stopPropagation();

  try {
    setActionLoading(true);
    setError("");

    // Generate matches for this exact numeric case ID.
    await generateMatches(caseId);

    // Stay on Authority Dashboard and refresh the data.
    const caseData = await getCases();
    setCases(caseData);

    const matchMap: Record<number, MatchItem[]> = {};

    await Promise.all(
      caseData.map(async (caseItem) => {
        try {
          matchMap[caseItem.id] = await getCaseMatches(caseItem.id);
        } catch {
          matchMap[caseItem.id] = [];
        }
      })
    );

    setMatches(matchMap);
  } catch (err) {
    console.error("Generate match error:", err);
    setError(
      err instanceof Error
        ? err.message
        : "Unable to generate matches."
    );
  } finally {
    setActionLoading(false);
  }
};

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
      case "PENDING":
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
      case "PENDING":
        return "potential";

      default:
        return "pending";
    }
  };

  if (loading) {
    return (
      <div className="authority-page">
        <div className="authority-loading">
          <RefreshCw className="spin" size={28} />
          <p>Loading authority dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="authority-page">
      <div className="authority-container">
        {/* HEADER */}
        <div className="authority-header">
          <div>
            <div className="authority-eyebrow">
              <ShieldCheck size={18} />
              AUTHORITY CONTROL CENTER
            </div>

            <h1>Reunification Dashboard</h1>

            <p>
              Review AI-assisted matches and make the final human verification
              decision.
            </p>
          </div>

          <div className="authority-header-actions">
            <button
              className="refresh-button"
              onClick={loadDashboard}
              disabled={loading}
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            <button
              type="button"
              className="refresh-button"
              onClick={() => {
                clearAuthoritySession();
                navigate("/authority-login", { replace: true });
              }}
              title="Sign out of authority session"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="authority-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* STATISTICS */}
        <div className="authority-stats">
          <div className="authority-stat-card">
            <div className="stat-icon">
              <Users size={22} />
            </div>

            <div>
              <span>Total Cases</span>
              <strong>{cases.length}</strong>
              <small>Missing person cases</small>
            </div>
          </div>

          <div className="authority-stat-card approved-card">
            <div className="stat-icon">
              <CheckCircle size={22} />
            </div>

            <div>
              <span>Approved Matches</span>
              <strong>{approvedCount}</strong>
              <small>Authority verified</small>
            </div>
          </div>

          <div className="authority-stat-card rejected-card">
            <div className="stat-icon">
              <XCircle size={22} />
            </div>

            <div>
              <span>Not Approved</span>
              <strong>{rejectedCount}</strong>
              <small>Rejected matches</small>
            </div>
          </div>
        </div>

        {/* CASE LIST */}
        <div className="authority-panel">
          <div className="authority-panel-header">
            <div>
              <h2>Missing Person Cases</h2>
              <p>
                Review candidate matches before making an authority decision.
              </p>
            </div>

            <div className="authority-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cases..."
              />
            </div>
          </div>

          <div className="authority-table-wrapper">
            <table className="authority-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Missing Person</th>
                  <th>Last Seen</th>
                  <th>Best Match</th>
                  <th>Match Score</th>
                  <th>Match Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredCases.map((caseItem) => {
                  const bestMatch = getBestMatch(caseItem.id);

                  return (
                    <tr key={caseItem.id}>
                      <td>
                        <span
                          className="case-id"
                          style={{ cursor: "pointer", textDecoration: "underline" }}
                          onClick={() => navigate(`/case/${caseItem.id}`)}
                        >
                          #{caseItem.id}
                        </span>
                      </td>

                      <td>
                        <div className="person-cell">
                          <strong
                            style={{ cursor: "pointer", textDecoration: "underline" }}
                            onClick={() => navigate(`/case/${caseItem.id}`)}
                          >
                            {caseItem.name || "Unknown"}
                          </strong>

                          <span>
                            {caseItem.status || "SEARCHING"}
                          </span>
                        </div>
                      </td>

                      <td>
                        {caseItem.last_seen_location || "Not available"}
                      </td>

                      <td>
                        {bestMatch ? (
                          <div className="match-cell">
                            <span>
                              {bestMatch.person_id != null
                                ? `Candidate #${bestMatch.person_id}`
                                : `Source Record #${bestMatch.source_record_id ?? "—"}`}
                            </span>

                            <small>
                              Match ID #{bestMatch.id}
                            </small>
                          </div>
                        ) : (
                          <span className="muted">
                            No matching candidate
                          </span>
                        )}
                      </td>

                      <td>
                        {bestMatch ? (
                          <div className="confidence">
                            <strong>{bestMatch.score} / 100</strong>

                            <div className="confidence-bar">
                              <div
                                style={{
                                  width: `${Math.min(
                                    Math.max(bestMatch.score, 0),
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        {bestMatch ? (
                          <span
                            className={`match-status ${getStatusClass(
                              bestMatch.status
                            )}`}
                          >
                            {getStatusLabel(bestMatch.status)}
                          </span>
                        ) : (
                          <span className="match-status pending">
                            No Match
                          </span>
                        )}
                      </td>

                      <td>
                        {bestMatch ? (
                          <button
  type="button"
  className="review-button"
  onClick={(event) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(`/review/${caseItem.id}`);
  }}
>
  <Eye size={15} />
  Review Match
</button>
                        ) : (
                          <button
  type="button"
  className="generate-button"
  onClick={(event) => generateForCase(caseItem.id, event)}
  disabled={actionLoading}
>
  {actionLoading ? "Generating..." : "Generate Match"}
</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredCases.length === 0 && (
              <div className="empty-cases">
                <Users size={34} />
                <h3>No cases found</h3>
                <p>There are no cases matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}