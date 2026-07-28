import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon } from "./Icon";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/catalog", label: "Catalog" },
  { to: "/predict", label: "Predict" },
  { to: "/recommendations", label: "For You" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-parchment-200 bg-parchment-50/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-700 text-gold-300 shadow-glow">
            <Icon name="book" size={20} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-forest-800">
            Book<span className="text-gold-500">Wise</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-forest-700 text-white shadow-sm"
                    : "text-forest-700 hover:bg-parchment-100"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/profile"
                className="hidden items-center gap-2 rounded-full border border-parchment-200 bg-white py-1 pl-1 pr-3 text-sm text-forest-800 shadow-sm transition hover:border-forest-200 sm:flex"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-forest-700 text-xs font-bold text-gold-300">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden font-medium lg:inline">{user.name.split(" ")[0]}</span>
              </Link>
              <button
                className="btn-ghost"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
