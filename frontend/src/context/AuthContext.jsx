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
    const firstname =
      role === "admin"
        ? localStorage.getItem("adminFirstname")
        : localStorage.getItem("userFirstname");
    const lastname =
      role === "admin"
        ? localStorage.getItem("adminLastname")
        : localStorage.getItem("userLastname");

    if (!token || !role) return null;

    
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && payload.exp * 1000 <= Date.now()) {
        ["userToken", "adminToken", "role", "userEmail", "adminEmail",
         "userFirstname", "adminFirstname", "userLastname", "adminLastname"]
          .forEach((k) => localStorage.removeItem(k));
        return null;
      }
    } catch {
      return null;
    }

    return { role, token, email, firstname: firstname || "", lastname: lastname || "" };
  };

  const [user, setUser] = useState(getStoredUser);

  function login(token, role, email = "", firstname = "", lastname = "") {
    if (role === "admin") {
      localStorage.setItem("adminToken", token);
      if (email)     localStorage.setItem("adminEmail",     email);
      if (firstname) localStorage.setItem("adminFirstname", firstname);
      if (lastname)  localStorage.setItem("adminLastname",  lastname);
    } else {
      localStorage.setItem("userToken", token);
      if (email)     localStorage.setItem("userEmail",     email);
      if (firstname) localStorage.setItem("userFirstname", firstname);
      if (lastname)  localStorage.setItem("userLastname",  lastname);
    }
    localStorage.setItem("role", role);
    setUser({ role, token, email, firstname: firstname || "", lastname: lastname || "" });
  }

  function logout() {
    ["adminToken", "userToken", "role", "adminEmail", "userEmail",
     "adminFirstname", "userFirstname", "adminLastname", "userLastname"]
      .forEach((k) => localStorage.removeItem(k));
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
