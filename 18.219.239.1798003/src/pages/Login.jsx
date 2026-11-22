import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../api.js";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notice, setNotice] = useState(location.state?.notice || "");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function retrySignOut() {
    try {
      const response = await apiFetch("/api/logout", { method: "POST" });
      if (!response.ok && response.status !== 401) {
        throw new Error("The portal could not confirm sign-out. Please retry.");
      }
      setNotice("");
    } catch (requestError) {
      setNotice(
        requestError.message ||
          "The portal service could not be reached. Please retry sign-out.",
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId.trim(),
          password,
        }),
      });
      if (!response.ok) {
        if (response.status === 409) {
          setError(
            "This employee ID is assigned to multiple teams. Contact an organizer.",
          );
        } else {
          setError("Sign-in failed. Check your employee ID and password.");
        }
        return;
      }
      navigate("/me");
    } catch (requestError) {
      setError(requestError.message || "The portal could not be reached. Retry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel login-panel" aria-labelledby="login-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">SECURE ACCESS</p>
          <h2 id="login-title">Employee sign in</h2>
        </div>
      </div>
      <div className="panel-body">
        <p className="intro-copy">
          Sign in with your employee credentials.
        </p>
        {notice && (
          <div className="form-notice" role="status">
            <p>{notice}</p>
            <button
              className="text-button"
              onClick={retrySignOut}
              type="button"
            >
              Retry sign out
            </button>
          </div>
        )}
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Employee ID
            <input
              autoComplete="username"
              onChange={(event) => setEmployeeId(event.target.value)}
              placeholder="e.g. E-1059"
              required
              type="text"
              value={employeeId}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="form-note">
          Access is limited to registered port personnel.
        </p>
      </div>
    </section>
  );
}

export default LoginPage;
