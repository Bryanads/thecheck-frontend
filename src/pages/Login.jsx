import { useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await API.post("/login", form);
      const { token, user_id } = res.data;

      login({ user_id, email: form.email }, token); // Atualiza AuthContext
      navigate(`/profile/${user_id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      {error && <div className="bg-red-100 text-red-700 p-2 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border p-2"
          name="email"
          placeholder="Email"
          type="email"
          required
          onChange={handleChange}
        />
        <input
          className="w-full border p-2"
          name="password"
          placeholder="Senha"
          type="password"
          required
          onChange={handleChange}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
