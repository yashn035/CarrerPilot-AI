import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [toasts, setToasts] = useState([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ old: 1, new: 2 });

  // Add toast notification helper
  const addToast = (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Set auth header for fetch
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch full user profile
  const fetchProfile = async (currentToken = token) => {
    if (!currentToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        // Token might be invalid, logout
        logout();
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  // Login action
  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      addToast(`Welcome back, ${data.user.name}!`, 'success');
      return { success: true };
    } catch (err) {
      addToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  // Register action
  const register = async (name, email, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      addToast("Account created successfully!", 'success');
      return { success: true };
    } catch (err) {
      addToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setActiveTab('Dashboard');
    addToast("Logged out successfully.", 'info');
  };

  // Complete onboarding
  const completeOnboarding = async (targetRole, skills, experienceLevel, college = '', branch = '', graduationYear = '', name = '') => {
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ targetRole, skills, experienceLevel, college, branch, graduationYear, name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Onboarding failed');
      setUser(data.user);
      addToast("Profile setup complete! Welcome to CareerPilot.", 'success');
      return { success: true };
    } catch (err) {
      addToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  // Claim quest reward
  const claimQuest = async (questId) => {
    try {
      const res = await fetch('/api/profile/claim-quest', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ questId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to claim quest');
      
      const oldLevel = user.level;
      setUser(data.user);
      addToast(`+${data.xpGained} XP Earned!`, 'gold');

      if (data.leveledUp) {
        setLevelUpData({ old: oldLevel, new: data.user.level });
        setShowLevelUp(true);
      }
      return { success: true };
    } catch (err) {
      addToast(err.message, 'error');
      return { success: false };
    }
  };

  // Simple local score updater (for client updates until refetched)
  const updateLocalScores = (updatedScores, updatedReadiness) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        scores: { ...prev.scores, ...updatedScores },
        readinessScore: updatedReadiness
      };
    });
  };

  return (
    <UserContext.Provider value={{
      user,
      token,
      loading,
      activeTab,
      toasts,
      showLevelUp,
      levelUpData,
      setActiveTab,
      setShowLevelUp,
      addToast,
      login,
      register,
      logout,
      completeOnboarding,
      claimQuest,
      getAuthHeaders,
      fetchProfile,
      updateLocalScores
    }}>
      {children}
    </UserContext.Provider>
  );
};
