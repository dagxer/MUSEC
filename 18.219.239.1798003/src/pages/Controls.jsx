import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api.js";

// How long each crane move lasts, in milliseconds. The backend passes this on
// to the crane without checking it.
const CRANE_MOVE_MS = 100;

const craneRequests = {
  "Stop crane": { method: "POST", url: "/api/actions/crane/stop" },
  "Stop hook": { method: "POST", url: "/api/actions/crane/hook/stop" },
  "Magnet on": { method: "POST", url: "/api/actions/crane/magnet/on" },
  "Magnet off": { method: "POST", url: "/api/actions/crane/magnet/off" },
};

function getActionRequest(role, action) {
  if (role === "crane-operator") {
    return (
      craneRequests[action] || {
        method: "POST",
        url: "/api/actions/crane/move",
        body: {
          direction: action.replace("Crane move ", ""),
          duration_ms: CRANE_MOVE_MS,
        },
      }
    );
  }

  const requests = {
    "yard-manager": {
      method: "POST",
      url: "/api/actions/gate/open-temporarily",
    },
    "security-operator": {
      method: "POST",
      url: "/api/actions/cameras/reset-temporarily",
    },
    "cargo-inspector": {
      method: "GET",
      url: "/api/actions/yard-outline/download",
    },
  };
  return requests[role];
}

function formatWait(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function ControlsPage() {
  const navigate = useNavigate();
  const [controls, setControls] = useState(null);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [actionFeedback, setActionFeedback] = useState("");
  const [cooldowns, setCooldowns] = useState({});

  useEffect(() => {
    if (!Object.values(cooldowns).some((seconds) => seconds > 0)) return;

    const timer = window.setTimeout(() => {
      setCooldowns((current) =>
        Object.fromEntries(
          Object.entries(current)
            .map(([action, seconds]) => [action, seconds - 1])
            .filter(([, seconds]) => seconds > 0),
        ),
      );
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldowns]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setControls(null);
    setError("");
    setCooldowns({});
    apiFetch("/api/controls", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          navigate("/login", { replace: true });
          return null;
        }
        if (!response.ok) {
          throw new Error("Unable to load role information.");
        }
        return response.json();
      })
      .then((data) => {
        if (active && data) {
          setControls(data);
          setCooldowns(data.cooldowns || {});
        }
      })
      .catch((requestError) => {
        if (active && requestError.name !== "AbortError") {
          setError(
            requestError.message || "Unable to load role information. Retry.",
          );
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [navigate, retryCount]);

  async function triggerAction(action) {
    const request = getActionRequest(controls.role, action);
    if (!request) return;

    setActionFeedback("");
    try {
      const response = await apiFetch(request.url, {
        method: request.method,
        ...(request.body && {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request.body),
        }),
      });
      const retryAfter = Number(response.headers.get("Retry-After"));
      if (Number.isInteger(retryAfter) && retryAfter > 0) {
        setCooldowns((current) => ({ ...current, [action]: retryAfter }));
      }

      if (response.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if ([409, 501, 503].includes(response.status)) {
        const result = await response.json();
        if (typeof result.detail !== "string") {
          throw new Error("The backend did not return an action message.");
        }
        setActionFeedback(result.detail);
        return;
      }
      if (response.status === 429) {
        const result = await response.json();
        setActionFeedback(
          typeof result.detail === "string"
            ? result.detail
            : `${action} is temporarily unavailable.`,
        );
        return;
      }
      if (!response.ok) {
        throw new Error(`The backend rejected the request (${response.status}).`);
      }
      const result = await response.json().catch(() => ({}));
      setActionFeedback(
        typeof result.detail === "string" ? result.detail : `${action}`,
      );
    } catch (requestError) {
      setActionFeedback(
        `${action}: ${requestError.message || "The request failed."}`,
      );
    }
  }

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
  if (!controls) return <p className="panel loading">Loading user controls...</p>;

  return (
    <section className="panel" aria-labelledby="controls-title">
      <div className="panel-header">
        <div>
          <h2 id="controls-title">Port Actions</h2>
        </div>
      </div>
      <div className="panel-body">
        <div className="role-card">
          <h3>Available Actions:</h3>
          <p>Actions limited to your role within the port.</p>
          <div className="role-actions">
            {(Array.isArray(controls.actions) ? controls.actions : []).map(
              (action) => {
                const remaining = cooldowns[action] || 0;
                const isCoolingDown = remaining > 0;
                return (
                  <div className="role-action-item" key={action}>
                    {controls.role === "cargo-inspector" ? (
                      <>
                        <a
                          aria-disabled={isCoolingDown}
                          className={`role-action-button${isCoolingDown ? " is-disabled" : ""}`}
                          download="cameras.yaml"
                          href={`${import.meta.env.BASE_URL}sample_yard_layout.png`}
                          onClick={(event) => {
                            if (isCoolingDown) {
                              event.preventDefault();
                              return;
                            }
                            void triggerAction(action);
                          }}
                          tabIndex={isCoolingDown ? -1 : undefined}
                        >
                          {action}
                        </a>
                        <a
                          aria-disabled={isCoolingDown}
                          className={`role-action-button${isCoolingDown ? " is-disabled" : ""}`}
                          download="zones.csv"
                          href={`${import.meta.env.BASE_URL}zones.csv`}
                          onClick={(event) => {
                            if (isCoolingDown) {
                              event.preventDefault();
                              return;
                            }
                            void triggerAction(action);
                          }}
                          tabIndex={isCoolingDown ? -1 : undefined}
                        >
                          Download Zones File
                        </a>
                      </>
                    ) : (
                      <button
                        className="role-action-button"
                        disabled={isCoolingDown}
                        onClick={() => void triggerAction(action)}
                        type="button"
                      >
                        {action}
                      </button>
                    )}
                    {isCoolingDown && (
                      <span className="action-cooldown">
                        Available again in {formatWait(remaining)}
                      </span>
                    )}
                  </div>
                );
              },
            )}
          </div>
          {actionFeedback && (
            <p className="action-feedback" role="status">
              {actionFeedback}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default ControlsPage;
