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

      <header className="page-header container" style={{ 
        backgroundColor: "rgba(255, 255, 255, 0.92)", 
        padding: "32px 40px", 
        borderRadius: "16px", 
        margin: "32px auto",
        maxWidth: "1200px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        textAlign: "center"
      }}>
        <h1 className="page-title" style={{ fontSize: "2.25rem", marginBottom: "12px" }}>TAMU Law Faculty Portal</h1>
        <p className="page-subtitle" style={{ fontSize: "1.1rem", maxWidth: "800px", margin: "0 auto" }}>
          Manage adjunct applications and use the AI assistant to search candidates,
          summarize resumes, and answer program questions.
        </p>
      </header>

      <main className="container" style={{ paddingTop: "16px", paddingBottom: "48px" }}>
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

          <TileCard title="Course Catalog Manager" to="/courses">
            Manage TAMU Law course catalog: add, edit, and delete courses with descriptions and credit hours.
          </TileCard>
        </div>
      </main>

      <footer style={{ 
        opacity: 0.55, 
        fontSize: 11, 
        backgroundColor: "rgba(255, 255, 255, 0.7)", 
        padding: "8px 32px", 
        borderRadius: "6px", 
        position: "fixed",
        bottom: "12px",
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center",
        color: "#555"
      }}>
        © {new Date().getFullYear()} Texas A&amp;M University School of Law
      </footer>
    </div>
  );
}
