import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../auth/AuthProvider";

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const isOwner = user?.user_id === userId;

  useEffect(() => {
    setLoading(true);
    API.get(`/profile/${userId}`)
      .then((res) => {
        setProfile(res.data);
        setForm({
          name: res.data.name,
          surf_level: res.data.surf_level,
          goofy_regular_stance: res.data.goofy_regular_stance,
          preferred_wave_direction: res.data.preferred_wave_direction,
          bio: res.data.bio,
          profile_picture_url: res.data.profile_picture_url
        });
      })
      .catch(() => setError("Erro ao carregar perfil."))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await API.put(`/profile/${userId}`, form);
      setProfile(res.data.user);
      setMessage("Perfil atualizado com sucesso!");
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao atualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Carregando...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!profile) return null;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Perfil</h1>

      {message && <div className="bg-green-100 text-green-700 p-2 mb-4">{message}</div>}
      {error && <div className="bg-red-100 text-red-700 p-2 mb-4">{error}</div>}

      <div className="flex gap-4 items-start mb-6">
        {profile.profile_picture_url && (
          <img
            src={profile.profile_picture_url}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover"
          />
        )}
        <div>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Registrado em:</strong> {new Date(profile.registration_timestamp).toLocaleString()}</p>
        </div>
      </div>

      {isOwner && (
        <>
          {!editMode ? (
            <>
              <p><strong>Nome:</strong> {profile.name}</p>
              <p><strong>Nível de Surf:</strong> {profile.surf_level}</p>
              <p><strong>Stance:</strong> {profile.goofy_regular_stance}</p>
              <p><strong>Direção Preferida:</strong> {profile.preferred_wave_direction}</p>
              <p><strong>Bio:</strong> {profile.bio}</p>
              <p><strong>Foto de Perfil:</strong> <br /><a href={profile.profile_picture_url} className="text-blue-700 underline" target="_blank" rel="noopener noreferrer">{profile.profile_picture_url}</a></p>
              <button
                onClick={() => setEditMode(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
              >
                Editar Perfil
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Nome:</label>
                <input
                  className="w-full border p-2"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block mb-1">Nível de Surf:</label>
                <select
                  name="surf_level"
                  value={form.surf_level}
                  onChange={handleChange}
                  className="w-full border p-2"
                >
                  <option value="beginner">Iniciante</option>
                  <option value="maroleiro">Maroleiro</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Stance:</label>
                <div className="flex gap-4">
                  <label>
                    <input
                      type="radio"
                      name="goofy_regular_stance"
                      value="goofy"
                      checked={form.goofy_regular_stance === "goofy"}
                      onChange={handleChange}
                    /> Goofy
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="goofy_regular_stance"
                      value="regular"
                      checked={form.goofy_regular_stance === "regular"}
                      onChange={handleChange}
                    /> Regular
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-1">Direção Preferida da Onda:</label>
                <select
                  name="preferred_wave_direction"
                  value={form.preferred_wave_direction}
                  onChange={handleChange}
                  className="w-full border p-2"
                >
                  <option value="left">Esquerda</option>
                  <option value="right">Direita</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Bio:</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  className="w-full border p-2"
                ></textarea>
              </div>

              <div>
                <label className="block mb-1">URL da Imagem de Perfil:</label>
                <input
                  name="profile_picture_url"
                  value={form.profile_picture_url}
                  onChange={handleChange}
                  className="w-full border p-2"
                />
              </div>

              <button
                onClick={handleUpdate}
                className="bg-green-600 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar Alterações"}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="ml-2 text-gray-600 underline"
              >
                Cancelar
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
