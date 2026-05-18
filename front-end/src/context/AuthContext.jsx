import { authMeService } from "@/services/user.service";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [user, setUser] = useState(null);
  const login = (newToken) => {
    localStorage.setItem("accessToken", newToken);
    setToken(newToken); 
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setToken(null); 
  };

  //lấy info user
  useEffect(() => {
    const fetchUser = async () => {
      if(token) {
        try {
          const res = await authMeService();
          // console.log("ME RESPONSE:", res);
          setUser(res);
        } catch (error) {
          console.error("Lỗi khi lấy thông tin user:", error);
          logout(); // Nếu token không hợp lệ, tự động logout
        }
      } else {
        setUser(null);
      }
    };
    fetchUser();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        isLoggedIn: !!token,
        user,
        setUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);