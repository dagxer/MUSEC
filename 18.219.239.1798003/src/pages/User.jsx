import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api.js";

function UserPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setUser(null);
    setError("");
    apiFetch("/api/me", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          navigate("/login", { replace: true });
          return null;
        }
        if (!response.ok) {
          throw new Error("Unable to load employee details.");
        }
        return response.json();
      })
      .then((data) => {
        if (active && data) setUser(data);
      })
      .catch((requestError) => {
        if (active && requestError.name !== "AbortError") {
          setError(
            requestError.message || "Unable to load employee details. Retry.",
          );
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [navigate, retryCount]);

  if (error) {
    return (
      <section className="panel service-error" role="alert">
        <p>{error}</p>
        <button
          className="secondary-button"
          onClick={() => setRetryCount((count) => count + 1)}
          type="button"
        >
          Retry
        </button>
      </section>
    );
  }
  if (!user) return <p className="panel loading">Loading employee details...</p>;

  return (
    <section className="panel" aria-labelledby="user-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">PERSONNEL RECORD</p>
          <h2 id="user-title">User Information</h2>
        </div>
      </div>
      <div className="panel-body">
        <dl className="detail-grid">
          <div>
            <dt>Employee ID</dt>
            <dd>{user.employee_id}</dd>
          </div>
          <div>
            <dt>Assigned role</dt>
            <dd>{user.role.replaceAll("-", " ")}</dd>
          </div>
          <div>
            <dt>Session status</dt>
            <dd>
              <span className="inline-status">Authenticated</span>
            </dd>
          </div>
        </dl>
        <Link className="secondary-button" to="/controls">
          Continue to user controls
        </Link>
      </div>
    </section>
  );
}

export default UserPage;
