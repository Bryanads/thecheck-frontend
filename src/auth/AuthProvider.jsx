import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/api"; // Importa sua instância axios configurada

const AuthContext = createContext(null); // Definir null como valor padrão para o contexto

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Inicia como null
  const [loading, setLoading] = useState(true); // Adiciona um estado de carregamento para o AuthProvider

  // Efeito para carregar o usuário do localStorage e, se houver um token, buscar o perfil completo
  useEffect(() => {
    const loadStoredUser = async () => {
      const storedToken = localStorage.getItem("jwt");
      const storedUser = localStorage.getItem("user"); // Pode conter apenas {user_id, email}

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Usar o user_id do objeto parseado ou do token (se você decodificasse o token aqui)
          const userId = parsedUser.user_id; 

          if (userId) {
            // Fazer uma chamada para a rota de perfil para obter todos os dados do usuário (incluindo o nome)
            const profileRes = await API.get(`/profile/${userId}`);
            // Armazena o objeto de usuário completo no estado
            setUser(profileRes.data); 
          }
        } catch (error) {
          console.error("Erro ao carregar usuário do localStorage ou perfil:", error);
          // Limpa tudo se houver um erro (token/user inválido)
          localStorage.removeItem("jwt");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      setLoading(false); // Carregamento inicial concluído
    };

    loadStoredUser();
  }, []); // Executa apenas uma vez na montagem inicial do AuthProvider

  const login = async (email, password) => {
    setLoading(true); // Define loading para true durante o processo de login
    try {
        const res = await API.post("/login", { email, password });
        const { token, user_id } = res.data; // Backend retorna token e user_id
        
        // Armazenar o token
        localStorage.setItem("jwt", token);
        
        // Fazer uma chamada adicional para obter o perfil completo do usuário
        const profileRes = await API.get(`/profile/${user_id}`);
        const fullUserData = profileRes.data;

        // Armazenar o user data completo no localStorage e no estado
        localStorage.setItem("user", JSON.stringify(fullUserData));
        setUser(fullUserData);
        
        setLoading(false); // Login concluído
        return fullUserData; // Retorna os dados completos do usuário
    } catch (err) {
        console.error("Falha no login:", err.response?.data || err.message);
        localStorage.removeItem("jwt");
        localStorage.removeItem("user");
        setUser(null);
        setLoading(false); // Login falhou
        throw err; // Rejeita a promise para que o componente Login possa tratar o erro
    }
  };

  const logout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    setUser(null);
    // Nota: API.interceptors já removerá o header Authorization automaticamente
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user, loading }} // Exporta o estado de loading
    >
      {/* Renderiza children apenas quando o AuthProvider tiver terminado de carregar o estado do usuário */}
      {!loading && children} 
      {loading && <div>Carregando aplicação...</div>} {/* Opcional: Mostra um loading global */}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);