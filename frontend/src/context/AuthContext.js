import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const connectSocket = (userData) => {
    socket.connect();
    // Kullanıcı kendi odasına katılır
    socket.emit('join', `customer_${userData.id}`);
    // Kurye ise ortak kurye odasına da katılır
    if (userData.role === 'courier') socket.emit('join', 'couriers');
    // Esnaf ise restoran odasına katılmak için restaurant_id lazım — MerchantPanel halleder
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => { setUser(res.data); connectSocket(res.data); })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    connectSocket(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    socket.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
