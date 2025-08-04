import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Spots from "./pages/Spots";
import Forecasts from "./pages/Forecasts";
import Recommendations from "./pages/Recommendations";
import { AuthProvider } from "./auth/AuthProvider";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/spots" element={<Spots />} />
          <Route path="/forecasts" element={<Forecasts />} />
          <Route path="/recommendations" element={<Recommendations />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
