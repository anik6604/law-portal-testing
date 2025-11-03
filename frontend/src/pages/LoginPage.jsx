import { API_URL } from "../utils/auth.js";

export default function LoginPage() {
  const handleLogin = () => {
    // Redirect to Azure AD SSO login
    window.location.href = `${API_URL}/auth/login`;
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <img src="/tamu-law-wordmark.png" alt="TAMU Law" className="topbar-logo" />
        </div>
      </div>

      <div style={{ 
        minHeight: "calc(100vh - 64px)", 
        display: "grid", 
        placeItems: "center", 
        padding: "24px",
        backgroundImage: "url('/law-school-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}>
        <div className="card" style={{ width: "100%", maxWidth: 680, padding: 32, backgroundColor: "rgba(255, 255, 255, 0.95)" }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem" }}>
            TAMU Law Faculty Portal
          </h1>

          <p style={{ margin: "8px 0 22px 0", color: "#4b5563", fontSize: "1.1rem" }}>
            Please sign in with your <strong>TAMU NetID</strong> to access the faculty candidate search system.
          </p>

          <button 
            onClick={handleLogin} 
            className="btn maroon" 
            style={{ width: "100%", height: 56, fontSize: "1.05rem" }}
          >
            Sign In with TAMU NetID
          </button>

          <div style={{ marginTop: 18, fontSize: 14, color: "#6b7280", textAlign: "center" }}>
            You will be redirected to the TAMU authentication portal
          </div>
        </div>
      </div>
    </>
  );
}
