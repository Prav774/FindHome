import { useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginAuthority } from "../api/client";
import { startAuthoritySession } from "../auth/authority";

function AuthorityLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const stateMessage = (location.state as { message?: string } | undefined)?.message;
  const [infoMessage, setInfoMessage] = useState(stateMessage || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const authorityId = String(values.get("authorityId") ?? "").trim();
    const password = String(values.get("password") ?? "");

    if (!authorityId || !password) {
      setError("Enter your Authority ID or email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setInfoMessage("");
      const user = await loginAuthority({ email: authorityId, password });
      startAuthoritySession({
        id: user.id,
        name: user.name,
        email: user.email,
      });
      navigate("/authority", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid credentials or network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="report-page">
      <div className="report-container authority-login-container">
        <button className="back-button" onClick={() => navigate("/")}>
          <ArrowLeft size={18} /> Back to Home
        </button>
        <header className="report-header">
          <div className="report-icon"><ShieldCheck size={26} /></div>
          <div>
            <h1>Authority Login</h1>
            <p>Sign in to open the FindHome response workspace.</p>
          </div>
        </header>

        <form className="report-form" onSubmit={handleSubmit}>
          {infoMessage && <div className="form-alert success" role="status">{infoMessage}</div>}
          {error && <div className="form-alert error" role="alert">{error}</div>}
          <div className="form-group">
            <label htmlFor="authority-id">Authority ID / Email</label>
            <input
              id="authority-id"
              name="authorityId"
              type="text"
              autoComplete="username"
              required
              disabled={loading}
              placeholder="e.g. authority@example.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="authority-password">Password</label>
            <input
              id="authority-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>
          <div className="form-footer authority-login-footer">
            <div>
              <p>
                Don't have an account?{" "}
                <Link to="/authority-register" style={{ color: "#0f766e", fontWeight: 600, textDecoration: "underline" }}>
                  Register
                </Link>
              </p>
              <p style={{ marginTop: "6px", fontSize: "0.85rem", color: "#64748b" }}>
                Looking for family updates?{" "}
                <Link to="/login" style={{ color: "#0f766e", fontWeight: 600, textDecoration: "underline" }}>
                  Family Login
                </Link>
              </p>
            </div>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Logging in…
                </>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default AuthorityLogin;
