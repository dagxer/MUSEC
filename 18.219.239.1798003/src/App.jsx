import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { apiFetch } from "./api.js";
import LoginPage from "./pages/Login.jsx";
import UserPage from "./pages/User.jsx";
import ControlsPage from "./pages/Controls.jsx";

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/login";

  async function handleLogout() {
    let notice;
    try {
      const response = await apiFetch("/api/logout", {
        method: "POST",
      });
      if (!response.ok && response.status !== 401) {
        notice =
          "The portal could not confirm sign-out. Check the service and try again.";
      }
    } catch (error) {
      notice =
        error.message ||
        "The portal service could not be reached, so server sign-out could not be confirmed.";
    }
    navigate("/login", {
      replace: true,
      state: notice ? { notice } : null,
    });
  }

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          PA
        </span>
        <span>
          <strong>PORT AUTHORITY</strong>
          <small>EMPLOYEE SERVICES</small>
        </span>
      </div>
      {!isLoginPage && (
        <>
          <nav className="primary-nav" aria-label="Main navigation">
            <NavLink to="/me">Your user</NavLink>
            <NavLink to="/controls">User controls</NavLink>
          </nav>
          <button className="nav-logout" type="button" onClick={handleLogout}>
            Sign out
          </button>
        </>
      )}
    </header>
  );
}

function App() {
  return (
    <div className="app-shell">
      <Navigation />
      <main className="page-frame">
        <div className="page-heading">
          <div>
            <p className="eyebrow">PORTAL / EMPLOYEE ACCESS</p>
            <h1>Employee Services</h1>
          </div>
        </div>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/me" element={<UserPage />} />
          <Route path="/controls" element={<ControlsPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <footer className="page-footer">
          <span>PORT AUTHORITY INTRANET</span>
          <span>EMPLOYEE PORTAL · INTERNAL USE</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
