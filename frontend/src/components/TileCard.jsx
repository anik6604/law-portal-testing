import { Link } from "react-router-dom";

export default function TileCard({ title, to, children, disabled = false }) {
  // When disabled (or no route yet) we render a real button so it can still
  // show hover/press effects, but it doesn’t navigate anywhere.
  const ComingSoonBtn = (
    <button
      type="button"
      className="btn maroon"
      aria-disabled="true"
      onClick={() => {}}
      title="Coming soon"
    >
      Open
    </button>
  );

  return (
    <div className="card tile">
      <h3>{title}</h3>
      <p>{children}</p>
      <div className="tile-cta">
        {disabled || !to ? ComingSoonBtn : <Link className="btn maroon" to={to}>Open</Link>}
      </div>
    </div>
  );
}
