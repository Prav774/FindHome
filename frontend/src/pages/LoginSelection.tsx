import { useState } from "react";
import { ArrowLeft, HeartHandshake, Loader2, ShieldCheck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loginAuthority, registerAuthority } from "../api/client";
import { startFamilySession } from "../auth/family";

interface LoginSelectionProps {
  defaultView?: "select" | "family-login";
}

function LoginSelection({ defaultView = "select" }: LoginSelectionProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<"select" | "family-login">(defaultView);
  const [tab, setTab] = useState<"login" | "signup">("login");

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleFamilyLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const user = await loginAuthority({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      startFamilySession({
        id: user.id,
        name: user.name,
        email: user.email,
      });
      navigate("/family", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid credentials or network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFamilyRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = registerName.trim();
    const email = registerEmail.trim();
    const password = registerPassword;
    const confirm = registerConfirmPassword;

    if (!name || !email || !password || !confirm) {
      setError("All fields are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      await registerAuthority({ name, email, password });
      setSuccessMessage("Account created successfully! Please log in with your credentials.");
      setTab("login");
      setLoginEmail(email);
      setLoginPassword("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      if (
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("duplicate") ||
        msg.includes("409")
      ) {
        setError("An account with this email already exists. Please log in.");
      } else {
        setError(msg || "Unable to register account. Please check your network connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (view === "select") {
    return (
      <main className="report-page">
        <div className="report-container authority-login-container">
          <button className="back-button" onClick={() => navigate("/")}>
            <ArrowLeft size={18} /> Back to Home
          </button>

          <header className="report-header">
            <div className="report-icon">
              <HeartHandshake size={26} />
            </div>
            <div>
              <h1>Choose Login Type</h1>
              <p>Select your portal to sign in or register for FindHome updates.</p>
            </div>
          </header>

          <div style={{ display: "grid", gap: "16px", marginTop: "24px" }}>
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "24px",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                transition: "box-shadow 0.2s, border-color 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "#ccfbf1",
                    color: "#0f766e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Users size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                    Family Login
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                    Sign in or register to follow case updates and potential matches
                  </p>
                </div>
              </div>

              <p style={{ fontSize: "0.9rem", color: "#475569", margin: "4px 0 12px", lineHeight: "1.5" }}>
                For families and relatives tracking reports of missing loved ones and receiving verified updates.
              </p>

              <button
                type="button"
                className="submit-button"
                style={{ width: "100%", textAlign: "center" }}
                onClick={() => {
                  setError("");
                  setSuccessMessage("");
                  setView("family-login");
                }}
              >
                Continue to Family Login
              </button>
            </div>

            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "24px",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "#e0e7ff",
                    color: "#4338ca",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                    Authority Login
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                    For emergency responders, rescue agencies, and authorized personnel
                  </p>
                </div>
              </div>

              <p style={{ fontSize: "0.9rem", color: "#475569", margin: "4px 0 12px", lineHeight: "1.5" }}>
                Access the official Authority Control Center to review evidence, run matching pipelines, and verify matches.
              </p>

              <button
                type="button"
                className="secondary-button"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => navigate("/authority-login")}
              >
                Continue to Authority Login
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Family Login and Signup View
  return (
    <main className="report-page">
      <div className="report-container authority-login-container">
        <button
          className="back-button"
          onClick={() => {
            setError("");
            setSuccessMessage("");
            setView("select");
          }}
        >
          <ArrowLeft size={18} /> Back to Login Selection
        </button>

        <header className="report-header">
          <div className="report-icon">
            <Users size={26} />
          </div>
          <div>
            <h1>Family Portal</h1>
            <p>
              {tab === "login"
                ? "Sign in to track updates of matched persons with their families."
                : "Create an account to track updates and potential matches."}
            </p>
          </div>
        </header>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "16px",
            marginBottom: "20px",
            background: "#f1f5f9",
            padding: "4px",
            borderRadius: "10px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError("");
              setSuccessMessage("");
            }}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              background: tab === "login" ? "#ffffff" : "transparent",
              color: tab === "login" ? "#0f766e" : "#64748b",
              boxShadow: tab === "login" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              cursor: "pointer",
            }}
          >
            Family Login
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setError("");
              setSuccessMessage("");
            }}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              background: tab === "signup" ? "#ffffff" : "transparent",
              color: tab === "signup" ? "#0f766e" : "#64748b",
              boxShadow: tab === "signup" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              cursor: "pointer",
            }}
          >
            Family Sign Up
          </button>
        </div>

        {successMessage && (
          <div className="form-alert success" role="status">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="form-alert error" role="alert">
            {error}
          </div>
        )}

        {tab === "login" ? (
          <form className="report-form" onSubmit={handleFamilyLogin}>
            <div className="form-group">
              <label htmlFor="family-email">Email Address</label>
              <input
                id="family-email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="e.g. family@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="family-password">Password</label>
              <input
                id="family-password"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <div className="form-footer authority-login-footer">
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setTab("signup");
                    setError("");
                    setSuccessMessage("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#0f766e",
                    fontWeight: 600,
                    textDecoration: "underline",
                    cursor: "pointer",
                    font: "inherit",
                  }}
                >
                  Sign up
                </button>
              </p>
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
        ) : (
          <form className="report-form" onSubmit={handleFamilyRegister}>
            <div className="form-group">
              <label htmlFor="family-reg-name">Full Name</label>
              <input
                id="family-reg-name"
                type="text"
                autoComplete="name"
                required
                disabled={loading}
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="e.g. Maria Gonzalez"
              />
            </div>

            <div className="form-group">
              <label htmlFor="family-reg-email">Email Address</label>
              <input
                id="family-reg-email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="e.g. family@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="family-reg-pass">Password</label>
              <input
                id="family-reg-pass"
                type="password"
                autoComplete="new-password"
                required
                disabled={loading}
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="form-group">
              <label htmlFor="family-reg-confirm">Confirm Password</label>
              <input
                id="family-reg-confirm"
                type="password"
                autoComplete="new-password"
                required
                disabled={loading}
                value={registerConfirmPassword}
                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
              />
            </div>

            <div className="form-footer authority-login-footer">
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    setError("");
                    setSuccessMessage("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#0f766e",
                    fontWeight: 600,
                    textDecoration: "underline",
                    cursor: "pointer",
                    font: "inherit",
                  }}
                >
                  Log in
                </button>
              </p>
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" /> Registering…
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

export default LoginSelection;

