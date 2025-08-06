import { useEffect, useState } from "react";
import API from "../api/api";
import { useAuth } from "../auth/AuthProvider";

export default function Spots() {
  const [spots, setSpots] = useState([]);
  const [presets, setPresets] = useState([]);
  const [newPreset, setNewPreset] = useState({
    preset_name: "",
    spot_ids: [],
    start_time: "08:00:00",
    end_time: "12:00:00",
    day_offset_default: [0],
    is_default: false,
  });

  const { user } = useAuth();

  useEffect(() => {
    API.get("/spots")
      .then((res) => setSpots(res.data))
      .catch((err) => console.error("Erro ao buscar spots:", err));
    
    if (user?.user_id) {
      API.get(`/presets?user_id=${user.user_id}`)
        .then((res) => setPresets(res.data))
        .catch((err) => console.error("Erro ao buscar presets:", err));
    }
  }, [user]);

  const toggleSpot = (spotId) => {
    const updated = newPreset.spot_ids.includes(spotId)
      ? newPreset.spot_ids.filter((id) => id !== spotId)
      : [...newPreset.spot_ids, spotId];
    setNewPreset((prev) => ({ ...prev, spot_ids: updated }));
  };

  const handleCreatePreset = async () => {
    try {
      const payload = { ...newPreset, user_id: user.user_id };
      const res = await API.post("/presets", payload);
      alert("Preset criado com sucesso!");
      setPresets((prev) => [...prev, { ...newPreset, preset_id: res.data.preset_id }]);
      setNewPreset({ ...newPreset, preset_name: "", spot_ids: [] });
    } catch (err) {
      console.error(err);
      alert("Erro ao criar preset.");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-blue-800">Spots Disponíveis</h2>
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {spots.map((spot) => (
          <li
            key={spot.spot_id}
            className={`p-3 rounded border cursor-pointer ${
              newPreset.spot_ids.includes(spot.spot_id)
                ? "bg-blue-100 border-blue-400"
                : "hover:bg-gray-100"
            }`}
            onClick={() => toggleSpot(spot.spot_id)}
          >
            {spot.spot_name}
          </li>
        ))}
      </ul>

      {user && (
        <>
          <h2 className="text-xl font-semibold mb-2">Criar novo Preset</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded mb-6">
            <input
              type="text"
              placeholder="Nome do preset"
              className="border p-2 rounded"
              value={newPreset.preset_name}
              onChange={(e) =>
                setNewPreset((prev) => ({ ...prev, preset_name: e.target.value }))
              }
            />
            <div className="flex gap-2">
              <input
                type="time"
                value={newPreset.start_time}
                className="border p-2 rounded"
                onChange={(e) =>
                  setNewPreset((prev) => ({ ...prev, start_time: e.target.value }))
                }
              />
              <span className="self-center">até</span>
              <input
                type="time"
                value={newPreset.end_time}
                className="border p-2 rounded"
                onChange={(e) =>
                  setNewPreset((prev) => ({ ...prev, end_time: e.target.value }))
                }
              />
            </div>
            <input
              type="text"
              placeholder="Offsets (ex: 0,1,2)"
              className="border p-2 rounded"
              value={newPreset.day_offset_default.join(",")}
              onChange={(e) =>
                setNewPreset((prev) => ({
                  ...prev,
                  day_offset_default: e.target.value.split(",").map((n) => parseInt(n)),
                }))
              }
            />
            <label className="flex gap-2 items-center">
              <input
                type="checkbox"
                checked={newPreset.is_default}
                onChange={(e) =>
                  setNewPreset((prev) => ({ ...prev, is_default: e.target.checked }))
                }
              />
              Tornar preset padrão
            </label>
            <button
              className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 md:col-span-2"
              onClick={handleCreatePreset}
            >
              Criar Preset
            </button>
          </div>

          <h2 className="text-xl font-semibold mb-2">Seus Presets</h2>
          <ul className="space-y-2">
            {presets.map((p) => (
              <li key={p.preset_id} className="p-3 bg-white border rounded shadow-sm">
                <strong>{p.preset_name}</strong><br />
                Spots: {p.spot_ids?.join(", ")}<br />
                Horário: {p.start_time} - {p.end_time}<br />
                Offsets: {p.day_offset_default?.join(", ")}<br />
                {p.is_default && <span className="text-sm text-green-600 font-semibold">Preset padrão</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
