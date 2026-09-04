import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div
      style={{
        minHeight: "70dvh",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: 24,
      }}
    >
      <div>
        <p
          className="num"
          style={{ fontSize: 40, fontWeight: 700, color: "var(--primary)" }}
        >
          404
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", margin: "8px 0" }}>
          Página no encontrada
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: 20 }}>
          El enlace no existe o se movió.
        </p>
        <Link className="btn btn-primary" to="/">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
