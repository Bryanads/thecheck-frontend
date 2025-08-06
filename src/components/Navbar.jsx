import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-blue-800 text-white px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold hover:text-gray-300">
          TheCheck
        </Link>
        <div className="flex gap-4 items-center text-sm sm:text-base">
          <Link to="/spots" className="hover:text-gray-300">Spots</Link>
          <Link to="/forecasts" className="hover:text-gray-300">Previsões</Link>
          <Link to="/recommendations" className="hover:text-gray-300">Recomendações</Link>

          {user ? (
            <>
              <Link to={`/profile/${user.user_id}`} className="hover:text-gray-300">Perfil</Link>
              <button
                onClick={handleLogout}
                className="ml-2 border border-white rounded px-2 py-1 hover:bg-white hover:text-blue-800"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-300">Login</Link>
              <Link to="/register" className="hover:text-gray-300">Registrar</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
