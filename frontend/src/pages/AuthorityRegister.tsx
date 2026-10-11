import { useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registerAuthority } from "../api/client";

function AuthorityRegister() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify and try again.");
      return;
    }

    try {
      setLoading(true);
      await registerAuthority({ name, email, password });
      navigate("/authority-login", {
        replace: true,
        state: {
          message: "Registration successful. Please log in with your credentials.",
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      if (
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("duplicate") ||
        msg.includes("409")
      ) {
        setError("An account with this email already exists. Please log in or use a different email.");
      } else {
        setError(msg || "Unable to register authority. Please check your network and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="report-page">
      <div className="report-container authority-login-container">
        <button className="back-button" onClick={() => navigate("/authority-login")}>
          <ArrowLeft size={18} /> Back to Login
        </button>
        <header className="report-header">
          <div className="report-icon">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1>Authority Registration</h1>
            <p>Create an authorized responder account for FindHome.</p>
          </div>
        </header>

        <form className="report-form" onSubmit={handleSubmit}>
          {error && (
            <div className="form-alert error" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              disabled={loading}
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Officer Alex Rivera"
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={loading}
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. authority@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              disabled={loading}
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-confirm-password">Confirm password</label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              disabled={loading}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
            />
          </div>

          <div className="form-footer authority-login-footer">
            <p>
              Already have an account?{" "}
              <Link
                to="/authority-login"
                style={{
                  color: "#0f766e",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Log in
              </Link>
            </p>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Registering…
                </>
              ) : (
                "Register"
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default AuthorityRegister;

