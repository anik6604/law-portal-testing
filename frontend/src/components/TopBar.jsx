import { useNavigate } from "react-router-dom";
import { logout } from "../utils/auth.js";

export default function TopBar({ onLogout, showLogout = true }) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout(); // Azure AD logout
    }
  };

  const handleHome = () => {
    navigate("/home");
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand" role="img" aria-label="TAMU Law">
          <img src="/tamu-law-wordmark.png" alt="TAMU Law" className="topbar-logo" />
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn maroon" onClick={handleHome}>Home</button>
          {showLogout && (
            <button className="btn maroon" onClick={handleLogout}>Logout</button>
          )}
        </div>
      </div>
    </header>
  );
}
