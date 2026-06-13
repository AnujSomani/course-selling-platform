import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const getStoredUser = () => {
    const role = localStorage.getItem("role");
    const token =
      role === "admin"
        ? localStorage.getItem("adminToken")
        : localStorage.getItem("userToken");
    const email =
      role === "admin"
        ? localStorage.getItem("adminEmail")
        : localStorage.getItem("userEmail");

    if (!token || !role) return null;

    // Check token expiry
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && payload.exp * 1000 <= Date.now()) {
        localStorage.removeItem("userToken");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("role");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("adminEmail");
        return null;
      }
    } catch {
      return null;
    }

    return { role, token, email };
  };

  const [user, setUser] = useState(getStoredUser);

  function login(token, role, email = "") {
    if (role === "admin") {
      localStorage.setItem("adminToken", token);
      if (email) localStorage.setItem("adminEmail", email);
    } else {
      localStorage.setItem("userToken", token);
      if (email) localStorage.setItem("userEmail", email);
    }
    localStorage.setItem("role", role);
    setUser({ role, token, email });
  }

  function logout() {
    ["adminToken", "userToken", "role", "adminEmail", "userEmail"].forEach(
      (k) => localStorage.removeItem(k)
    );
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
