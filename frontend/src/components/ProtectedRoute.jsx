import { useEffect, useState } from "react";
import { checkAuthStatus, redirectToLogin } from "../utils/auth.js";

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const authStatus = await checkAuthStatus();
        if (authStatus.authenticated) {
          setIsAuthenticated(true);
        } else {
          redirectToLogin();
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        redirectToLogin();
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        fontSize: "1.2rem",
        color: "#666"
      }}>
        Verifying authentication...
      </div>
    );
  }

  return isAuthenticated ? children : null;
}
