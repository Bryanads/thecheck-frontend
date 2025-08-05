import { useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    surf_level: "beginner",
    goofy_regular_stance: "regular",
    preferred_wave_direction: "north",
    bio: "",
    profile_picture_url: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await API.post("/register", form);
      setSuccessMsg("Usuário registrado com sucesso!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao registrar usuário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Registro</h1>
      {error && <div className="bg-red-100 text-red-700 p-2 mb-4">{error}</div>}
      {successMsg && <div className="bg-green-100 text-green-700 p-2 mb-4">{successMsg}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full border p-2" name="name" placeholder="Nome" required onChange={handleChange} />
        <input className="w-full border p-2" name="email" placeholder="Email" type="email" required onChange={handleChange} />
        <input className="w-full border p-2" name="password" placeholder="Senha" type="password" required onChange={handleChange} />
        
        <select className="w-full border p-2" name="surf_level" value={form.surf_level} onChange={handleChange}>
          <option value="beginner">Iniciante</option>
          <option value="maroleiro">Maroleiro</option>
          <option value="intermediate">Intermediário</option>
          <option value="expert">Expert</option>
        </select>

        <div className="flex gap-4">
          <label>
            <input type="radio" name="goofy_regular_stance" value="goofy" checked={form.goofy_regular_stance === "goofy"} onChange={handleChange} />
            Goofy
          </label>
          <label>
            <input type="radio" name="goofy_regular_stance" value="regular" checked={form.goofy_regular_stance === "regular"} onChange={handleChange} />
            Regular
          </label>
        </div>

        <select className="w-full border p-2" name="preferred_wave_direction" value={form.preferred_wave_direction} onChange={handleChange}>
          <option value="left">Esquerda</option>
          <option value="right">Direita</option>
        </select>

        <textarea className="w-full border p-2" name="bio" placeholder="Bio" rows="3" onChange={handleChange}></textarea>
        <input className="w-full border p-2" name="profile_picture_url" placeholder="URL da Imagem de Perfil" onChange={handleChange} />

        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? "Registrando..." : "Registrar"}
        </button>
      </form>
    </div>
  );
}
