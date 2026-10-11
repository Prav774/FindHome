import { useEffect, useState } from "react";
import {
  Clock,
  Eye,
  HeartHandshake,
  LogOut,
  MapPin,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  createMissingPersonCase,
  getCase,
  getCaseMatches,
  type CaseResponse,
  type MatchResponse,
} from "../api/client";
import { clearFamilySession, getFamilyUser } from "../auth/family";

interface TrackedCaseWithMatches {
  caseData: CaseResponse;
  publicCaseId?: string;
  matches: MatchResponse[];
}

function FamilyDashboard() {
  const navigate = useNavigate();
  const familyUser = getFamilyUser();
  const userEmail = familyUser?.email || "guest";

  const [activeTab, setActiveTab] = useState<"report" | "updates">("report");

  // Missing form states
  const [submitting, setSubmitting] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccessId, setReportSuccessId] = useState("");

  const [formName, setFormName] = useState("");
  const [formAge, setFormAge] = useState("");
  const [formGender, setFormGender] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formClothing, setFormClothing] = useState("");
  const [formMarks, setFormMarks] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Tracked cases state
  const [trackedItems, setTrackedItems] = useState<TrackedCaseWithMatches[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [lookupInput, setLookupInput] = useState("");
  const [lookupError, setLookupError] = useState("");

  const getStorageKey = () => `findhome_family_cases_${userEmail}`;

  const getSavedCaseIds = (): string[] => {
    try {
      const raw = sessionStorage.getItem(getStorageKey());
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveCaseId = (id: string) => {
    const list = getSavedCaseIds();
    if (!list.includes(id)) {
      const updated = [id, ...list];
      sessionStorage.setItem(getStorageKey(), JSON.stringify(updated));
    }
  };

  const loadCaseDetails = async (caseIds: string[]) => {
    if (caseIds.length === 0) {
      setTrackedItems([]);
      return;
    }
    setLoadingCases(true);
    try {
      const results: TrackedCaseWithMatches[] = [];
      for (const id of caseIds) {
        try {
          const caseData = await getCase(id);
          let matches: MatchResponse[] = [];
          try {
            matches = await getCaseMatches(caseData.id);
          } catch {
            matches = [];
          }
          const isPublic = /^FH-\d+$/i.test(id);
          results.push({
            caseData,
            publicCaseId: isPublic ? id.toUpperCase() : undefined,
            matches,
          });
        } catch (err) {
          console.warn(`Could not load case ${id}:`, err);
        }
      }
      setTrackedItems(results);
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    const saved = getSavedCaseIds();
    if (saved.length > 0) {
      void loadCaseDetails(saved);
    }
  }, [userEmail]);

  // Handle Missing Person Form Submission
  const handleReportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    if (!formName.trim()) {
      setReportError("Please enter the full name of the missing person.");
      return;
    }

    try {
      setSubmitting(true);
      setReportError("");

      const result = await createMissingPersonCase({
        name: formName.trim(),
        age: formAge ? Number(formAge) : null,
        gender: formGender || null,
        last_seen_location: formLocation.trim() || null,
        clothing: formClothing.trim() || null,
        identifying_marks: formMarks.trim() || null,
        description: formDescription.trim() || null,
      });

      const newId = result.case_id;
      setReportSuccessId(newId);
      saveCaseId(newId);

      // Reset form fields
      setFormName("");
      setFormAge("");
      setFormGender("");
      setFormLocation("");
      setFormClothing("");
      setFormMarks("");
      setFormDescription("");

      // Refresh tracked cases list
      const updatedIds = [newId, ...getSavedCaseIds().filter((id) => id !== newId)];
      await loadCaseDetails(updatedIds);
    } catch (err) {
      setReportError(
        err instanceof Error
          ? err.message
          : "Failed to submit the missing person report. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle tracking another existing Case ID
  const handleLookupCase = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = lookupInput.trim();
    if (!query) return;

    setLookupError("");
    try {
      setLoadingCases(true);
      await getCase(query);
      saveCaseId(query);
      const saved = [query, ...getSavedCaseIds().filter((id) => id !== query)];
      await loadCaseDetails(saved);
      setLookupInput("");
    } catch (err) {
      setLookupError(
        err instanceof Error
          ? err.message
          : "Case not found. Please verify the Case ID (e.g. FH-5492 or numeric ID)."
      );
    } finally {
      setLoadingCases(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "VERIFIED":
        return "Approved by Responder";
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
      case "PENDING":
        return "potential";
      default:
        return "pending";
    }
  };

  return (
    <div className="authority-page">
      <div className="authority-container">
        {/* HEADER */}
        <div className="authority-header">
          <div>
            <div className="authority-eyebrow">
              <HeartHandshake size={18} />
              FAMILY REUNIFICATION PORTAL
            </div>

            <h1>Family Portal</h1>

            <p>
              {familyUser?.name
                ? `Welcome back, ${familyUser.name}. Submit missing person reports and follow live match updates.`
                : "Submit missing person reports and follow live match updates for your family."}
            </p>
          </div>

          <div className="authority-header-actions">
            <button
              className="refresh-button"
              onClick={() => void loadCaseDetails(getSavedCaseIds())}
              disabled={loadingCases}
            >
              <RefreshCw size={17} className={loadingCases ? "spin" : undefined} />
              Refresh Updates
            </button>

            <button
              type="button"
              className="refresh-button"
              onClick={() => {
                clearFamilySession();
                navigate("/login", { replace: true });
              }}
              title="Sign out of family session"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            margin: "20px 0 28px",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "14px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("report")}
            style={{
              padding: "10px 22px",
              borderRadius: "8px",
              border: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: activeTab === "report" ? "#0f766e" : "#f1f5f9",
              color: activeTab === "report" ? "#ffffff" : "#475569",
              cursor: "pointer",
              boxShadow: activeTab === "report" ? "0 2px 4px rgba(15,118,110,0.2)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <UserRound size={18} /> Report Missing Person Form
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("updates")}
            style={{
              padding: "10px 22px",
              borderRadius: "8px",
              border: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: activeTab === "updates" ? "#0f766e" : "#f1f5f9",
              color: activeTab === "updates" ? "#ffffff" : "#475569",
              cursor: "pointer",
              boxShadow: activeTab === "updates" ? "0 2px 4px rgba(15,118,110,0.2)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <HeartHandshake size={18} />
            Case & Match Updates {trackedItems.length > 0 && `(${trackedItems.length})`}
          </button>
        </div>

        {/* TAB 1: MISSING PERSON FORM */}
        {activeTab === "report" && (
          <div className="authority-panel" style={{ padding: "28px" }}>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                Report a Missing Person
              </h2>
              <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>
                Provide details about your missing family member. Once submitted, your report receives a public Case ID and is instantly added to your updates tracker.
              </p>
            </div>

            {reportSuccessId && (
              <div
                className="form-alert success"
                role="status"
                style={{
                  padding: "18px 20px",
                  borderRadius: "10px",
                  marginBottom: "24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <strong style={{ fontSize: "1.05rem", display: "block" }}>
                    ✓ Report submitted successfully!
                  </strong>
                  <span>
                    Your Case ID is <strong>{reportSuccessId}</strong>. It has been saved to your Case & Match Updates page.
                  </span>
                </div>
                <button
                  type="button"
                  className="submit-button"
                  style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                  onClick={() => {
                    setReportSuccessId("");
                    setActiveTab("updates");
                  }}
                >
                  View Match Updates Now →
                </button>
              </div>
            )}

            {reportError && (
              <div className="form-alert error" role="alert" style={{ marginBottom: "20px" }}>
                {reportError}
              </div>
            )}

            <form className="report-form" onSubmit={handleReportSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="family-name">
                    Full Name <span style={{ color: "#e11d48" }}>*</span>
                  </label>
                  <input
                    id="family-name"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Maria Gonzalez"
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="family-age">Age</label>
                  <input
                    id="family-age"
                    type="number"
                    min="0"
                    max="130"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    placeholder="e.g. 24"
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="family-gender">Gender</label>
                  <select
                    id="family-gender"
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    disabled={submitting}
                  >
                    <option value="">Select if known</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="family-location">Last Seen Location</label>
                  <div className="input-with-icon">
                    <MapPin size={18} aria-hidden="true" />
                    <input
                      id="family-location"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="e.g. North Community Shelter, Sector 4"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="family-clothing">Clothing</label>
                  <input
                    id="family-clothing"
                    value={formClothing}
                    onChange={(e) => setFormClothing(e.target.value)}
                    placeholder="e.g. Blue jacket, gray trousers, sneakers"
                    disabled={submitting}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="family-marks">Identifying Marks</label>
                  <textarea
                    id="family-marks"
                    rows={2}
                    value={formMarks}
                    onChange={(e) => setFormMarks(e.target.value)}
                    placeholder="e.g. Birthmark on right arm, scar on forehead"
                    disabled={submitting}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="family-description">Additional Information</label>
                  <textarea
                    id="family-description"
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Any medical needs, languages spoken, or contact details"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-footer" style={{ marginTop: "24px" }}>
                <p>
                  Your report will be registered in FindHome and matched continuously against field responder records.
                </p>
                <button type="submit" className="submit-button" disabled={submitting}>
                  {submitting ? "Submitting Report…" : "Submit Missing Person Report"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: CASE & MATCH UPDATES */}
        {activeTab === "updates" && (
          <div>
            {/* Quick-add lookup bar */}
            <div
              className="authority-panel"
              style={{
                padding: "20px 24px",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                  Track Case Updates
                </h3>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                  Tracking updates for your reported family members and potential candidate matches.
                </p>
              </div>

              <form
                onSubmit={handleLookupCase}
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <div className="authority-search" style={{ margin: 0 }}>
                  <Search size={16} />
                  <input
                    value={lookupInput}
                    onChange={(e) => setLookupInput(e.target.value)}
                    placeholder="Enter Case ID (e.g. FH-5492)..."
                    style={{ minWidth: "220px" }}
                  />
                </div>
                <button type="submit" className="secondary-button" disabled={loadingCases}>
                  Track
                </button>
              </form>
            </div>

            {lookupError && (
              <div className="form-alert error" role="alert" style={{ marginBottom: "20px" }}>
                {lookupError}
              </div>
            )}

            {/* List of tracked cases with their matches */}
            {trackedItems.length === 0 ? (
              <div className="authority-panel" style={{ padding: "48px 24px", textAlign: "center" }}>
                <HeartHandshake size={42} style={{ color: "#0f766e", margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                  No Reported Cases Tracked Yet
                </h3>
                <p style={{ color: "#64748b", maxWidth: "520px", margin: "0 auto 24px" }}>
                  Submit a missing person report to monitor match updates, or enter an existing Case ID (like FH-5492) above to track it here.
                </p>
                <button
                  type="button"
                  className="submit-button"
                  onClick={() => setActiveTab("report")}
                >
                  <UserRound size={16} /> Fill Missing Person Form
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "24px" }}>
                {trackedItems.map(({ caseData, publicCaseId, matches }) => {
                  return (
                    <article
                      key={caseData.id}
                      className="authority-panel"
                      style={{ padding: "24px", position: "relative" }}
                    >
                      {/* Case Overview Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          borderBottom: "1px solid #e2e8f0",
                          paddingBottom: "16px",
                          marginBottom: "20px",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                            <span
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                background: "#ccfbf1",
                                color: "#0f766e",
                                padding: "3px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              {publicCaseId ? `PUBLIC ID · ${publicCaseId}` : `CASE #${caseData.id}`}
                            </span>
                            <span className={`match-status ${caseData.status === "RESOLVED" ? "verified" : "pending"}`}>
                              {caseData.status}
                            </span>
                          </div>

                          <h3
                            style={{
                              fontSize: "1.35rem",
                              fontWeight: 700,
                              color: "#0f172a",
                              margin: "4px 0",
                              cursor: "pointer",
                            }}
                            onClick={() => navigate(`/case/${caseData.id}`)}
                          >
                            {caseData.name}
                          </h3>

                          {caseData.last_seen_location && (
                            <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                              <MapPin size={14} /> Last seen: {caseData.last_seen_location}
                            </p>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => navigate(`/case/${caseData.id}`)}
                            style={{ fontSize: "0.875rem", padding: "8px 14px" }}
                          >
                            View Case Record
                          </button>
                        </div>
                      </div>

                      {/* MATCH UPDATES SECTION */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                          <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                            Potential Matches & Updates
                          </h4>
                          <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
                            {matches.length} candidate {matches.length === 1 ? "match" : "matches"} found
                          </span>
                        </div>

                        {matches.length === 0 ? (
                          <div
                            style={{
                              background: "#f8fafc",
                              border: "1px dashed #cbd5e1",
                              borderRadius: "10px",
                              padding: "24px",
                              display: "flex",
                              alignItems: "center",
                              gap: "16px",
                            }}
                          >
                            <Clock size={24} style={{ color: "#64748b", flexShrink: 0 }} />
                            <div>
                              <strong style={{ display: "block", color: "#1e293b", fontSize: "0.95rem" }}>
                                No match found yet
                              </strong>
                              <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "0.875rem", lineHeight: "1.5" }}>
                                FindHome is continuously scanning shelter intake and responder records. As soon as a candidate match is identified, updates will appear here.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "grid", gap: "14px" }}>
                            {matches.map((match) => (
                              <div
                                key={match.id}
                                style={{
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "10px",
                                  padding: "18px 20px",
                                  background: "#ffffff",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: "16px",
                                }}
                              >
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>
                                      {match.person_id != null
                                        ? `Candidate #${match.person_id}`
                                        : `Source Record #${match.source_record_id ?? "—"}`}
                                    </strong>
                                    <span className={`match-status ${getStatusClass(match.status)}`}>
                                      {getStatusLabel(match.status)}
                                    </span>
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                                    <div className="confidence" style={{ margin: 0 }}>
                                      <strong style={{ fontSize: "0.95rem" }}>
                                        {match.score} / 100
                                      </strong>
                                      <div className="confidence-bar" style={{ width: "80px" }}>
                                        <div
                                          style={{
                                            width: `${Math.min(Math.max(match.score, 0), 100)}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                      System confidence score
                                    </span>
                                  </div>

                                  {match.explanation && (
                                    <p
                                      style={{
                                        margin: "6px 0 0",
                                        fontSize: "0.875rem",
                                        color: "#475569",
                                        lineHeight: "1.5",
                                        maxWidth: "680px",
                                      }}
                                    >
                                      <strong>Why suggested:</strong> {match.explanation}
                                    </p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  className="review-button"
                                  style={{ padding: "10px 18px", alignSelf: "center" }}
                                  onClick={() => navigate(`/review/${caseData.id}`)}
                                >
                                  <Eye size={16} /> View Match Updates
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FamilyDashboard;
