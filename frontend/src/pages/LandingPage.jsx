import TopBar from "../components/TopBar.jsx";
import TileCard from "../components/TileCard.jsx";

export default function LandingPage() {
  return (
    <>
      <TopBar />

      <header className="page-header container">
        <h1 className="page-title">TAMU Law Faculty Portal</h1>
        <p className="page-subtitle">
          Manage adjunct applications and use the AI assistant to search candidates,
          summarize resumes, and answer program questions.
        </p>
      </header>

      <main className="container">
        <div className="grid">
          <TileCard title="AI Chatbot" to="/chatbot">
            Ask program questions, search candidates, and summarize resumes.
          </TileCard>

          <TileCard title="Adjunct Application Portal" disabled>
            Review adjunct applications and manage candidate materials.
          </TileCard>
        </div>
      </main>

      <footer className="container" style={{ opacity: 0.65, fontSize: 12, paddingTop: 0 }}>
        © {new Date().getFullYear()} Texas A&amp;M University School of Law
      </footer>
    </>
  );
}
