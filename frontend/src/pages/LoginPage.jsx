import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const onLogin = (e) => {
    e.preventDefault();
    navigate("/home");
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <img src="/tamu-law-wordmark.png" alt="TAMU Law" className="topbar-logo" />
        </div>
      </div>

      <div style={{ minHeight: "calc(100vh - 64px)", display: "grid", placeItems: "center", padding: "24px" }}>
        <div className="card" style={{ width: "100%", maxWidth: 680, padding: 32 }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem" }}>
            Welcome to TAMU Law Resume Portal
          </h1>

          <p style={{ margin: "8px 0 22px 0", color: "#4b5563", fontSize: "1.1rem" }}>
            Please sign in with your <strong>NETID</strong> to continue.
          </p>

          <form onSubmit={onLogin}>
            <button type="submit" className="btn maroon" style={{ width: "100%", height: 56, fontSize: "1.05rem" }}>
              Login with NETID
            </button>
          </form>

          <div style={{ marginTop: 18, fontSize: 12, color: "#6b7280" }}>
            <em>Note:</em> In production this button redirects to the official TAMU SSO (CAS/SAML/OIDC) portal, then returns you to the landing page.
          </div>
        </div>
      </div>
    </>
  );
}
