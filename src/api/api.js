// src/api/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:5000", // ou o endereço onde a API estiver rodando
});

// Intercepta requisições para adicionar o token JWT (se existir)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
