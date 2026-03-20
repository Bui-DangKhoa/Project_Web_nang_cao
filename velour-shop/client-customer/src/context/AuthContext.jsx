import { createContext, useContext, useState } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null"),
  );

  const persistUser = (payload) => {
    localStorage.setItem("user", JSON.stringify(payload));
    setUser(payload);
    return payload;
  };

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    return persistUser(data);
  };

  const register = async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    return persistUser(data);
  };

  const socialLogin = async (provider, payload) => {
    const { data } = await authAPI.oauth({ provider, ...payload });
    return persistUser(data);
  };

  const googleTokenLogin = async (idToken) => {
    const { data } = await authAPI.googleTokenLogin(idToken);
    return persistUser(data);
  };

  const facebookTokenLogin = async (accessToken) => {
    const { data } = await authAPI.facebookTokenLogin(accessToken);
    return persistUser(data);
  };

  const firebaseSocialLogin = async (idToken) => {
    const { data } = await authAPI.firebaseLogin(idToken);
    return persistUser(data);
  };

  const refreshSession = async () => {
    const current = JSON.parse(localStorage.getItem("user") || "null");
    if (!current?.refreshToken) return null;

    const { data } = await authAPI.refresh({
      refreshToken: current.refreshToken,
    });
    return persistUser(data);
  };

  const forgotPassword = async (email) => {
    const { data } = await authAPI.forgotPassword({ email });
    return data;
  };

  const resetPassword = async (token, password) => {
    const { data } = await authAPI.resetPassword({ token, password });
    return data;
  };

  const verifyEmail = async (token) => {
    const { data } = await authAPI.verifyEmail({ token });
    return data;
  };

  const logout = async () => {
    try {
      if (user?.token) {
        await authAPI.logout();
      }
    } catch (err) {
      // Ignore logout failures and clear local session anyway.
    }
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        socialLogin,
        googleTokenLogin,
        facebookTokenLogin,
        firebaseSocialLogin,
        refreshSession,
        forgotPassword,
        resetPassword,
        verifyEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
