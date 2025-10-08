import { useNavigate } from "react-router-dom";

export default function TopBar({ onLogout }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    if (onLogout) return onLogout();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand" role="img" aria-label="TAMU Law">
          <img src="/tamu-law-wordmark.png" alt="TAMU Law" className="topbar-logo" />
        </div>
        <button className="btn maroon" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
