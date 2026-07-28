import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Home } from "./pages/Home";
import { Catalog } from "./pages/Catalog";
import { BookDetail } from "./pages/BookDetail";
import { Predict } from "./pages/Predict";
import { Recommendations } from "./pages/Recommendations";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Profile } from "./pages/Profile";

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <footer className="mt-10 border-t border-parchment-200 bg-parchment-100/60 py-8 text-center text-xs text-stone-500">
        <span className="font-display text-sm font-semibold text-forest-700">
          Book<span className="text-gold-500">Wise</span>
        </span>
        <p className="mt-2">Discover, predict and organize your next great read.</p>
      </footer>
    </div>
  );
}
