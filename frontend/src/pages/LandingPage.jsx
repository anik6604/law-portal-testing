import TopBar from "../components/TopBar.jsx";
import TileCard from "../components/TileCard.jsx";

export default function LandingPage() {
  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: "url('/law-school-bg.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed"
    }}>
      <TopBar />

      <header className="page-header container" style={{ backgroundColor: "rgba(255, 255, 255, 0.9)", padding: "24px", borderRadius: "8px", margin: "24px auto" }}>
        <h1 className="page-title">TAMU Law Faculty Portal</h1>
        <p className="page-subtitle">
          Manage adjunct applications and use the AI assistant to search candidates,
          summarize resumes, and answer program questions.
        </p>
      </header>

      <main className="container">
        <div className="grid">
          <TileCard title="Law Hiring Assistant" to="/chatbot">
            AI-powered candidate search system. Search, filter, and get comprehensive summaries of applicant profiles for any law course.
          </TileCard>

          <TileCard title="Adjunct Application Management" to="/apply">
            Review and manage adjunct faculty applications for TAMU Law School.
          </TileCard>

          <TileCard title="Admin Panel" to="/admin">
            Manage applicant database: search, edit applicant details, update hiring status, and view resumes.
          </TileCard>
        </div>
      </main>

      <footer className="container" style={{ opacity: 0.65, fontSize: 12, paddingTop: 0, backgroundColor: "rgba(255, 255, 255, 0.8)", padding: "12px", borderRadius: "8px", margin: "24px auto" }}>
        © {new Date().getFullYear()} Texas A&amp;M University School of Law
      </footer>
    </div>
  );
}
