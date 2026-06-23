import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Wallet, Send, History, User, ShieldAlert, 
  BarChart3, LogOut, Copy, Plus, CheckCircle2, 
  Lock, RefreshCw, AlertTriangle, Check, X, 
  TrendingUp, TrendingDown, Eye, ShieldCheck, HelpCircle,
  Camera
} from 'lucide-react';

// API Client Setup
const API_URL = '/api/v1';
const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [hasEntered, setHasEntered] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const ringPosRef = useRef({ x: -100, y: -100 });
  const dotPosRef = useRef({ x: -100, y: -100 });

  // Custom Cursor mouse movement tracking effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId;
    const updateCursor = () => {
      dotPosRef.current.x += (mouseRef.current.x - dotPosRef.current.x) * 0.9;
      dotPosRef.current.y += (mouseRef.current.y - dotPosRef.current.y) * 0.9;

      ringPosRef.current.x += (mouseRef.current.x - ringPosRef.current.x) * 0.15;
      ringPosRef.current.y += (mouseRef.current.y - ringPosRef.current.y) * 0.15;

      if (cursorDotRef.current) {
        cursorDotRef.current.style.left = `${dotPosRef.current.x}px`;
        cursorDotRef.current.style.top = `${dotPosRef.current.y}px`;
      }
      if (cursorRingRef.current) {
        cursorRingRef.current.style.left = `${ringPosRef.current.x}px`;
        cursorRingRef.current.style.top = `${ringPosRef.current.y}px`;
      }

      animationFrameId = requestAnimationFrame(updateCursor);
    };

    updateCursor();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Custom Cursor hover event delegation effect
  useEffect(() => {
    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;
      const isInteractive = target.closest('a, button, input, select, textarea, [role="button"], span[style*="cursor: pointer"]');
      if (isInteractive) {
        document.body.classList.add('custom-cursor-hovered');
      } else {
        document.body.classList.remove('custom-cursor-hovered');
      }
    };

    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      document.body.classList.remove('custom-cursor-hovered');
    };
  }, []);

  const handleEnter = () => {
    setIsExiting(true);
    setTimeout(() => {
      setHasEntered(true);
    }, 500);
  };

  // Auth Forms state
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91');
  
  // 2FA Auth Login state
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [tfaLoginCode, setTfaLoginCode] = useState('');

  // General App UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dashboard state
  const [transactions, setTransactions] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [fraudAlerts, setFraudAlerts] = useState([]);

  // Modals state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [tfaModalOpen, setTfaModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [scanQrModalOpen, setScanQrModalOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');

  // Handle QR Scan start/stop
  useEffect(() => {
    let html5QrCode;
    
    if (scanQrModalOpen) {
      setScannerError('');
      // Delay initialization slightly to ensure the DOM element is mounted
      const timer = setTimeout(() => {
        try {
          if (!window.Html5Qrcode) {
            setScannerError('QR Scanner library not loaded. Please check internet connection.');
            return;
          }
          
          html5QrCode = new window.Html5Qrcode("qr-reader");
          
          const qrCodeSuccessCallback = (decodedText) => {
            setTransferEmail(decodedText);
            setScanQrModalOpen(false);
            setTransferModalOpen(true);
            
            try {
              html5QrCode.stop();
            } catch (err) {
              console.error("Failed to stop scanner after scan", err);
            }
          };
          
          const config = { fps: 10, qrbox: { width: 200, height: 200 } };
          
          html5QrCode.start(
            { facingMode: "environment" }, 
            config, 
            qrCodeSuccessCallback
          ).catch(err => {
            console.error("Camera start error", err);
            setScannerError('Could not start camera. Please check camera permissions.');
          });
        } catch (err) {
          console.error("Scanner init error", err);
          setScannerError('Failed to initialize scanner.');
        }
      }, 500);
      
      return () => clearTimeout(timer);
    };
  }, [scanQrModalOpen]);

  const handleFileScan = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (!window.Html5Qrcode) {
        alert("QR scanner library not loaded. Please try again.");
        return;
      }
      const html5QrCode = new window.Html5Qrcode("qr-reader-file");
      html5QrCode.scanFile(file, true)
        .then(decodedText => {
          setTransferEmail(decodedText);
          setScanQrModalOpen(false);
          setTransferModalOpen(true);
        })
        .catch(err => {
          console.error("QR Code parse error", err);
          alert("Could not detect a valid QR code in this image. Please make sure the QR is clear and well-lit.");
        });
    } catch (err) {
      console.error("File scanner init error", err);
      alert("Failed to read image file. Please try again.");
    }
  };

  const triggerFileSelect = () => {
    const fileInput = document.getElementById("qr-file-input");
    if (fileInput) fileInput.click();
  };
  
  // Transfer Form state
  const [transferEmail, setTransferEmail] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [transferTfaCode, setTransferTfaCode] = useState('');
  const [transferRequiresTfa, setTransferRequiresTfa] = useState(false);
  const [transferError, setTransferError] = useState('');

  // Enable 2FA setup state
  const [tfaSecret, setTfaSecret] = useState('');
  const [tfaQrCode, setTfaQrCode] = useState('');
  const [tfaVerifyCode, setTfaVerifyCode] = useState('');
  const [tfaError, setTfaError] = useState('');

  // Resolve Fraud Alert state
  const [activeResolveAlert, setActiveResolveAlert] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('authorized');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Effect to fetch initial profile & data
  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Load dashboard data when active tab changes
  useEffect(() => {
    if (user) {
      if (activeTab === 'dashboard') {
        fetchWalletData();
        fetchTransactions();
        fetchFraudAlerts();
      } else if (activeTab === 'analytics') {
        fetchAnalytics();
      } else if (activeTab === 'alerts' || activeTab === 'security') {
        fetchFraudAlerts();
      }
    }
  }, [user, activeTab, txPage]);


  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      if (activeTab === 'dashboard') {
        await Promise.all([
          fetchWalletData(),
          fetchTransactions(),
          fetchFraudAlerts()
        ]);
      } else if (activeTab === 'analytics') {
        await fetchAnalytics();
      } else if (activeTab === 'alerts' || activeTab === 'security') {
        await fetchFraudAlerts();
      }
    } catch (err) {
      console.error("Manual refresh failed", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data.user);
      setWallet(res.data.data.wallet);
      setLoading(false);
    } catch (err) {
      loggerError('Profile fetch error', err);
      handleLogout();
      setLoading(false);
    }
  };

  const fetchWalletData = async () => {
    try {
      const res = await api.get('/wallet/balance');
      setWallet(prev => prev ? { ...prev, balance: res.data.data.balance } : null);
    } catch (err) {
      showError('Failed to fetch wallet balance');
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get(`/wallet/transactions?page=${txPage}&limit=6`);
      setTransactions(res.data.data.transactions);
      setTxTotal(res.data.data.total);
    } catch (err) {
      showError('Failed to fetch transactions');
    }
  };

  const fetchFraudAlerts = async () => {
    try {
      const res = await api.get('/fraud/alerts');
      setFraudAlerts(res.data.data);
    } catch (err) {
      showError('Failed to fetch fraud alerts');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      setDashboardStats(res.data.data);
    } catch (err) {
      showError('Failed to fetch analytics');
    }
  };

  const loggerError = (msg, err) => {
    console.error(msg, err.response?.data || err.message);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 5000);
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.status === 'requires_2fa') {
        setRequires2FA(true);
        setTempUserId(res.data.data.userId);
        return;
      }

      const { token: receivedToken, user: receivedUser, wallet: receivedWallet } = res.data.data;
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      setWallet(receivedWallet);
      showSuccess(`Welcome back, ${receivedUser.full_name}!`);
    } catch (err) {
      showError(err.response?.data?.message || 'Login failed');
    }
  };

  const handle2FALogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.post('/auth/2fa/login', { 
        userId: tempUserId, 
        token: tfaLoginCode 
      });

      const { token: receivedToken, user: receivedUser, wallet: receivedWallet } = res.data.data;
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      setWallet(receivedWallet);
      setRequires2FA(false);
      setTempUserId(null);
      setTfaLoginCode('');
      showSuccess(`Welcome back, ${receivedUser.full_name}!`);
    } catch (err) {
      showError(err.response?.data?.message || 'Invalid 2FA code');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.post('/auth/register', { 
        email, 
        password, 
        full_name: fullName, 
        phone 
      });

      const { token: receivedToken, user: receivedUser, wallet: receivedWallet } = res.data.data;
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      setWallet(receivedWallet);
      showSuccess('Registration successful! Wallet created with ₹1000 demo funds.');
    } catch (err) {
      showError(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setWallet(null);
    setRequires2FA(false);
    setActiveTab('dashboard');
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferError('');

    // If user has 2FA enabled, but hasn't entered the code in this form yet, show the OTP input
    if (user.two_factor_enabled && !transferTfaCode) {
      setTransferRequiresTfa(true);
      return;
    }

    try {
      const payload = {
        receiverEmail: transferEmail,
        amount: parseFloat(transferAmount),
        description: transferDesc
      };

      if (transferTfaCode) {
        payload.two_factor_code = transferTfaCode;
      }

      await api.post('/wallet/transfer', payload);

      showSuccess(`Transferred ₹${transferAmount} to ${transferEmail} successfully!`);
      setTransferModalOpen(false);
      setTransferEmail('');
      setTransferAmount('');
      setTransferDesc('');
      setTransferTfaCode('');
      setTransferRequiresTfa(false);

      // Refresh data
      fetchWalletData();
      fetchTransactions();
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.requires2FA) {
        setTransferRequiresTfa(true);
        setTransferError('2FA code is required for this transfer');
      } else if (err.response?.status === 403 && err.response?.data?.status === 'flagged') {
        showError('Transaction FLAGGED for fraud analysis review!');
        setTransferModalOpen(false);
        setTransferEmail('');
        setTransferAmount('');
        setTransferDesc('');
        setTransferTfaCode('');
        setTransferRequiresTfa(false);
        fetchTransactions();
        fetchFraudAlerts();
      } else {
        setTransferError(err.response?.data?.message || 'Transfer failed');
      }
    }
  };

  const handleSetup2FA = async () => {
    setTfaError('');
    try {
      const res = await api.post('/auth/2fa/enable');
      setTfaSecret(res.data.data.secret);
      setTfaQrCode(res.data.data.qrCode);
      setTfaModalOpen(true);
    } catch (err) {
      showError('Failed to fetch 2FA details');
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setTfaError('');
    try {
      await api.post('/auth/2fa/verify', { token: tfaVerifyCode });
      showSuccess('2FA enabled successfully!');
      setTfaModalOpen(false);
      setTfaVerifyCode('');
      setTfaSecret('');
      setTfaQrCode('');
      fetchProfile();
    } catch (err) {
      setTfaError(err.response?.data?.message || '2FA verification failed. Check the code.');
    }
  };

  const handleDisable2FA = async () => {
    const code = prompt('Please enter your 2FA Google Authenticator code to disable:');
    if (!code) return;
    
    try {
      await api.post('/auth/2fa/disable', { token: code });
      showSuccess('2FA disabled successfully');
      fetchProfile();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to disable 2FA');
    }
  };

  const handleResolveAlert = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/fraud/alerts/${activeResolveAlert.id}/resolve`, {
        resolution: resolutionStatus,
        notes: resolutionNotes
      });

      showSuccess('Fraud alert resolved');
      setActiveResolveAlert(null);
      setResolutionNotes('');
      fetchFraudAlerts();
      fetchWalletData();
      fetchTransactions();
    } catch (err) {
      showError('Failed to resolve alert');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess('Wallet address copied to clipboard!');
  };

  if (!hasEntered) {
    return (
      <>
        <div className="noise-overlay" />
        <div ref={cursorDotRef} className="custom-cursor-dot" style={{ left: '-20px', top: '-20px' }} />
        <div ref={cursorRingRef} className="custom-cursor-ring" style={{ left: '-20px', top: '-20px' }} />
        <div 
          className="loader-container" 
          style={{
            opacity: isExiting ? 0 : 1,
            transition: 'opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
            pointerEvents: isExiting ? 'none' : 'all'
          }}
        >
          <div className="loader-cube-wrap">
            <div className="loader-cube">
              <div className="front">F</div>
              <div className="right">I</div>
              <div className="back">N</div>
              <div className="left">T</div>
              <div className="top">E</div>
              <div className="bottom">C</div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <h1 className="loader-title">FINTECH WALLET</h1>
            <p className="loader-tagline">
              Secure peer-to-peer digital payments system. High-performance creative ledger built with Unseen Studio styling guidelines.
            </p>
          </div>

          <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                <RefreshCw size={14} className="animate-spin" />
                <span>INITIALIZING SECURE WALLET LEDGER...</span>
              </div>
            ) : (
              <button 
                onClick={handleEnter}
                className="btn btn-primary"
                style={{
                  padding: '16px 40px',
                  fontSize: '0.9rem',
                  letterSpacing: '3px',
                  borderWidth: '1px'
                }}
              >
                ENTER SYSTEM
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  // Not Logged In
  if (!user) {
    return (
      <>
        <div className="noise-overlay" />
        <div ref={cursorDotRef} className="custom-cursor-dot" style={{ left: '-20px', top: '-20px' }} />
        <div ref={cursorRingRef} className="custom-cursor-ring" style={{ left: '-20px', top: '-20px' }} />
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', textAlign: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '25px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-main)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', boxShadow: '4px 4px 0px 0px var(--border-color)' }}>
                <Wallet size={36} />
              </div>
              <h1 className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: 800 }}>FinTech Wallet</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Secure peer-to-peer digital payments system</p>
            </div>

            {errorMsg && (
              <div className="badge-danger" style={{ padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem' }}>
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="badge-success" style={{ padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* 2FA input state */}
            {requires2FA ? (
              <form onSubmit={handle2FALogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Two-Factor Authenticator Code</label>
                  <input 
                    id="tfa_login_code"
                    type="text" 
                    maxLength={6}
                    placeholder="Enter 6-digit Google Auth code" 
                    className="form-input"
                    value={tfaLoginCode}
                    onChange={(e) => setTfaLoginCode(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px' }}>
                  Verify & Sign In
                </button>

                <button type="button" className="btn btn-secondary" onClick={() => setRequires2FA(false)} style={{ width: '100%' }}>
                  Back to Login
                </button>
              </form>
            ) : (
              <>
                {!isRegister ? (
                  // Login Form
                  <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email Address</label>
                      <input 
                        id="login_email"
                        type="email" 
                        placeholder="you@example.com" 
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Password</label>
                      <input 
                        id="login_password"
                        type="password" 
                        placeholder="••••••••" 
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', marginTop: '10px' }}>
                      Sign In
                    </button>

                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      New to FinTech?{' '}
                      <span onClick={() => { setIsRegister(true); setErrorMsg(''); }} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                        Create an account
                      </span>
                    </p>
                  </form>
                ) : (
                  // Register Form
                  <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Full Name</label>
                      <input 
                        id="reg_fullname"
                        type="text" 
                        placeholder="John Doe" 
                        className="form-input"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email Address</label>
                      <input 
                        id="reg_email"
                        type="email" 
                        placeholder="john@example.com" 
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Phone Number</label>
                      <input 
                        id="reg_phone"
                        type="text" 
                        placeholder="+91 98765 43210" 
                        className="form-input"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Password</label>
                      <input 
                        id="reg_password"
                        type="password" 
                        placeholder="Min. 8 characters" 
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', marginTop: '10px' }}>
                      Register Account
                    </button>

                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      Already have an account?{' '}
                      <span onClick={() => { setIsRegister(false); setErrorMsg(''); }} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                        Sign in instead
                      </span>
                    </p>
                  </form>
                )}
              </>
            )}

          </div>
        </div>
      </>
    );
  }

  // Active Alerts Count
  const activeAlerts = fraudAlerts.filter(a => !a.is_resolved);

  // Logged In Dashboard Layout
  return (
    <>
      <div className="noise-overlay" />
      <div ref={cursorDotRef} className="custom-cursor-dot" style={{ left: '-20px', top: '-20px' }} />
      <div ref={cursorRingRef} className="custom-cursor-ring" style={{ left: '-20px', top: '-20px' }} />
      <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        
        <div className="sidebar-logo">
          <div style={{ padding: '8px', background: 'var(--primary-glow)', borderRadius: '10px', color: 'var(--primary)' }}>
            <Wallet size={24} />
          </div>
          <span className="gradient-text logo-text" style={{ fontSize: '1.3rem', fontWeight: 700 }}>FinTech Wallet</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            id="nav_dashboard"
            onClick={() => setActiveTab('dashboard')} 
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
          >
            <Wallet size={18} />
            <span>Dashboard</span>
          </button>

          <button 
            id="nav_analytics"
            onClick={() => setActiveTab('analytics')} 
            className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
          >
            <BarChart3 size={18} />
            <span>Analytics</span>
          </button>

          <button 
            id="nav_alerts"
            onClick={() => setActiveTab('alerts')} 
            className={`btn ${activeTab === 'alerts' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ justifyContent: 'flex-start', padding: '12px 16px', position: 'relative' }}
          >
            <ShieldAlert size={18} />
            <span>Fraud Alerts</span>
            {activeAlerts.length > 0 && (
              <span style={{ 
                position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', 
                background: 'var(--accent-crimson)', color: 'white', fontSize: '0.75rem', fontWeight: 700,
                padding: '2px 8px', borderRadius: '99px', animation: 'pulse 2s infinite' 
              }}>
                {activeAlerts.length}
              </span>
            )}
          </button>

          <button 
            id="nav_security"
            onClick={() => setActiveTab('security')} 
            className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
          >
            <Lock size={18} />
            <span>Security Center</span>
          </button>

          <button 
            id="nav_logout_mobile"
            onClick={handleLogout} 
            className="btn btn-secondary mobile-only" 
            style={{ padding: '12px 16px' }}
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className="user-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-color)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#100E0E', fontWeight: 800 }}>
              {user.full_name.charAt(0)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.full_name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email}</span>
            </div>
          </div>

          <button id="btn_logout" onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main">
        
        {/* Status Messages */}
        {errorMsg && (
          <div className="badge-danger animate-fade-in" style={{ position: 'fixed', top: '20px', right: '50px', zIndex: 100, padding: '12px 24px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <AlertTriangle size={18} />
            <span style={{ fontWeight: 600 }}>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="badge-success animate-fade-in" style={{ position: 'fixed', top: '20px', right: '50px', zIndex: 100, padding: '12px 24px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <CheckCircle2 size={18} />
            <span style={{ fontWeight: 600 }}>{successMsg}</span>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Header */}
            <header className="dashboard-header">
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Financial Dashboard</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Welcome back, {user.full_name}. Monitor your assets and payments.</p>
              </div>

              <div className="btn-group">
                <button id="btn_send_money" onClick={() => setTransferModalOpen(true)} className="btn btn-primary">
                  <Send size={16} />
                  <span>Send Money</span>
                </button>
                <button id="btn_scan_qr" onClick={() => setScanQrModalOpen(true)} className="btn btn-secondary">
                  <Camera size={16} />
                  <span>Scan QR</span>
                </button>
                <button id="btn_show_qr" onClick={() => setQrModalOpen(true)} className="btn btn-secondary">
                  <Eye size={16} />
                  <span>Show QR</span>
                </button>
              </div>
            </header>

            {/* Top Grid: Wallet Card & Active Alerts summary */}
            <div className="dashboard-grid-top">
              
              {/* Digital Wallet Card */}
              <div className="credit-card" style={{ padding: '30px 40px', minHeight: '230px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Available Balance</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '5px' }}>
                      <h3 style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'white', margin: 0 }}>
                        ₹{wallet ? parseFloat(wallet.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </h3>
                      <button 
                        type="button"
                        onClick={handleManualRefresh} 
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.1)', 
                          border: '1px solid rgba(255, 255, 255, 0.2)', 
                          color: 'white', 
                          cursor: 'pointer', 
                          display: 'inline-flex', 
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px', 
                          borderRadius: '50%',
                          transition: 'all 0.2s ease',
                          alignSelf: 'center'
                        }}
                        title="Refresh Account Balance"
                        disabled={isRefreshing}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                      >
                        <RefreshCw size={18} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none', transition: 'transform 0.2s ease' }} />
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', color: 'white' }}>
                    <Wallet size={28} />
                  </div>
                </div>

                <div style={{ zIndex: 2 }}>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>WALLET ADDRESS</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.95rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.85)', letterSpacing: '1px' }}>
                      {wallet ? `${wallet.wallet_address.substring(0, 10)}...${wallet.wallet_address.substring(wallet.wallet_address.length - 8)}` : '0x00'}
                    </span>
                    <button 
                      onClick={() => wallet && copyToClipboard(wallet.wallet_address)} 
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '4px', hover: { color: 'white', background: 'rgba(255,255,255,0.1)' } }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                  <div>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>CARDHOLDER</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', marginTop: '2px' }}>{user.full_name}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255, 0, 128, 0.6)' }}></div>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.6)', marginLeft: '-12px' }}></div>
                  </div>
                </div>

              </div>

              {/* Status & Alerts summary panel */}
              <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h4 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} className="gradient-text-primary" />
                  <span>Security & System Status</span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', margin: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Two-Factor Auth (2FA)</span>
                    {user.two_factor_enabled ? (
                      <span className="badge badge-success">Enabled</span>
                    ) : (
                      <span className="badge badge-pending" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('security')}>Set Up</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Active Fraud Alerts</span>
                    {activeAlerts.length > 0 ? (
                      <span className="badge badge-danger">{activeAlerts.length} Flagged</span>
                    ) : (
                      <span className="badge badge-success">0 Alerts</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Payments Network</span>
                    <span className="badge badge-success">Online (Stripe Mock)</span>
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: 'var(--accent-emerald)' }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Your account is in good standing and ready for transfers.</p>
                </div>
              </div>

            </div>

            {/* Transactions History Section */}
            <div className="glass-panel" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={20} className="gradient-text-primary" />
                  <span>Recent Activity</span>
                </h4>

                <div style={{ display: 'flex', gap: '5px' }}>
                  <button 
                    onClick={() => setTxPage(p => Math.max(1, p - 1))} 
                    disabled={txPage === 1}
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    Prev
                  </button>
                  <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0 8px' }}>
                    Page {txPage}
                  </span>
                  <button 
                    onClick={() => setTxPage(p => p + 1)} 
                    disabled={transactions.length < 6}
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    Next
                  </button>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <History size={32} style={{ marginBottom: '10px', opacity: 0.4 }} />
                  <p>No transactions found. Make your first transfer above!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {transactions.map((tx) => {
                    const isSender = tx.sender && tx.sender.user_id === user.id;
                    const counterpart = isSender ? tx.receiver?.user : tx.sender?.user;
                    const amt = parseFloat(tx.amount);
                    const dateStr = new Date(tx.created_at).toLocaleString();

                    let statusBadge = <span className="badge badge-success">Completed</span>;
                    if (tx.status === 'pending') statusBadge = <span className="badge badge-pending">Pending</span>;
                    if (tx.status === 'failed') statusBadge = <span className="badge badge-danger">Failed</span>;
                    if (tx.status === 'flagged') statusBadge = <span className="badge badge-danger" style={{ background: 'rgba(239, 68, 68, 0.25)', color: '#FF8A8A' }}>Flagged (Fraud Check)</span>;

                    return (
                      <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                          <div style={{ 
                            padding: '10px', 
                            background: isSender ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)', 
                            borderRadius: '10px',
                            color: isSender ? 'var(--accent-crimson)' : 'var(--accent-emerald)' 
                          }}>
                            {isSender ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                              {isSender ? 'Sent to' : 'Received from'} {counterpart ? counterpart.full_name : 'Unknown Wallet'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {counterpart ? counterpart.email : ''} • {dateStr}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                            <span style={{ 
                              fontWeight: 700, 
                              fontSize: '1.1rem',
                              color: isSender ? 'var(--accent-crimson)' : 'var(--accent-emerald)'
                            }}>
                              {isSender ? '-' : '+'}₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {tx.description && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>"{tx.description}"</span>}
                          </div>
                          <div style={{ minWidth: '90px', display: 'flex', justifyContent: 'flex-end' }}>
                            {statusBadge}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            <header>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Financial Analytics</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Deep-dive payment metrics, spending trends, and system insights.</p>
            </header>

            {!dashboardStats ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                <RefreshCw style={{ animation: 'spin 2s linear infinite' }} size={32} className="gradient-text-primary" />
              </div>
            ) : (
              <>
                {/* Stats row cards */}
                <div className="analytics-grid-cards">
                  
                  <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Monthly Volume</span>
                    <h5 style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{dashboardStats.overview.monthly.total_volume.toLocaleString('en-IN')}</h5>
                    <span className="badge badge-info" style={{ marginTop: '5px', alignSelf: 'flex-start' }}>Monthly Period</span>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Weekly Outflow</span>
                    <h5 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-crimson)' }}>-₹{dashboardStats.overview.weekly.outgoing.toLocaleString('en-IN')}</h5>
                    <span className="badge badge-danger" style={{ marginTop: '5px', alignSelf: 'flex-start' }}>Weekly Sent</span>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Weekly Inflow</span>
                    <h5 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>+₹{dashboardStats.overview.weekly.incoming.toLocaleString('en-IN')}</h5>
                    <span className="badge badge-success" style={{ marginTop: '5px', alignSelf: 'flex-start' }}>Weekly Received</span>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Transactions</span>
                    <h5 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{dashboardStats.overview.monthly.total_transactions} txs</h5>
                    <span className="badge badge-info" style={{ marginTop: '5px', alignSelf: 'flex-start' }}>Monthly Count</span>
                  </div>

                </div>

                {/* Visual Section: Charts */}
                <div className="analytics-grid-charts">
                  
                  {/* Trend chart using SVG */}
                  <div className="glass-panel" style={{ padding: '30px' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>Weekly Volume & Trends</h4>
                    
                    {dashboardStats.trends.weekly.length === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        No transactions recorded in this period.
                      </div>
                    ) : (
                      <div style={{ position: 'relative', height: '240px', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        {/* Rendering a pure, fully responsive SVG bar graph */}
                        <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%' }}>
                          {/* Y-axis helper lines */}
                          <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                          <line x1="40" y1="80" x2="480" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                          <line x1="40" y1="140" x2="480" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                          <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.1)" />

                          {/* SVG Bars */}
                          {(() => {
                            const maxVal = Math.max(...dashboardStats.trends.weekly.map(d => parseFloat(d.dataValues?.volume || d.volume || 10)), 100);
                            const count = dashboardStats.trends.weekly.length;
                            const barWidth = Math.min(30, 320 / count);
                            const spacing = (440 - barWidth * count) / (count + 1);

                            return dashboardStats.trends.weekly.map((d, index) => {
                              const vol = parseFloat(d.dataValues?.volume || d.volume || 0);
                              const barHeight = (vol / maxVal) * 140; // max height 140px
                              const x = 50 + index * (barWidth + spacing);
                              const y = 170 - barHeight;

                              const dateStr = d.dataValues?.date || d.date || '';
                              const displayDate = dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr;

                              return (
                                <g key={index}>
                                  <rect 
                                    x={x} 
                                    y={y} 
                                    width={barWidth} 
                                    height={barHeight} 
                                    fill="url(#primaryGradient)" 
                                    rx="4"
                                  />
                                  <text x={x + barWidth/2} y="190" fill="var(--text-secondary)" fontSize="8" textAnchor="middle">
                                    {displayDate.substring(displayDate.length - 5)}
                                  </text>
                                  <text x={x + barWidth/2} y={y - 5} fill="white" fontSize="8" fontWeight="600" textAnchor="middle">
                                    ₹{Math.round(vol)}
                                  </text>
                                </g>
                              );
                            });
                          })()}

                          <defs>
                            <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--primary)" />
                              <stop offset="100%" stopColor="var(--secondary)" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Size distribution chart / spending patterns list */}
                  <div className="glass-panel" style={{ padding: '30px' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>Transaction Size Distribution</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {dashboardStats.patterns.monthly.size_distribution.map((dist, idx) => {
                        const totalCounts = dashboardStats.patterns.monthly.size_distribution.reduce((acc, curr) => acc + curr.count, 0);
                        const pct = totalCounts > 0 ? (dist.count / totalCounts) * 100 : 0;

                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>₹{dist.range} range</span>
                              <span style={{ fontWeight: 600 }}>{dist.count} transactions ({Math.round(pct)}%)</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent-cyan))', borderRadius: '99px' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Insights and AI Recommendation Cards */}
                <div className="glass-panel" style={{ padding: '30px' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HelpCircle size={20} className="gradient-text-primary" />
                    <span>System Analytics Insights</span>
                  </h4>

                  {dashboardStats.insights.monthly.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No spending anomalies detected. Your digital wallet flow is balanced!</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                      {dashboardStats.insights.monthly.map((insight, index) => (
                        <div 
                          key={index} 
                          style={{ 
                            padding: '20px', 
                            background: insight.severity === 'medium' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(99, 102, 241, 0.05)', 
                            borderRadius: 'var(--radius-md)', 
                            border: `1px solid ${insight.severity === 'medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                              padding: '6px', 
                              background: insight.severity === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)', 
                              borderRadius: '6px',
                              color: insight.severity === 'medium' ? 'var(--accent-amber)' : 'var(--primary)'
                            }}>
                              <AlertTriangle size={16} />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'capitalize' }}>{insight.type} Insight</span>
                          </div>
                          
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{insight.message}</p>
                          
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '4px', borderLeft: '3px solid var(--primary)' }}>
                            <strong>Recommendation:</strong> {insight.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        )}

        {/* Fraud Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            <header>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Fraud Protection Alerts</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time automated transaction scoring and alert center.</p>
            </header>

            {fraudAlerts.length === 0 ? (
              <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <ShieldCheck size={48} style={{ marginBottom: '15px', color: 'var(--accent-emerald)', opacity: 0.8 }} />
                <h4>No Fraud Flags Detected</h4>
                <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>Your wallet transactions match standard velocity thresholds.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {fraudAlerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className="glass-panel" 
                    style={{ 
                      padding: '24px 30px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      borderLeft: `4px solid ${alert.is_resolved ? 'var(--accent-emerald)' : 'var(--accent-crimson)'}`,
                      background: alert.is_resolved ? 'rgba(16, 185, 129, 0.02)' : 'rgba(239, 68, 68, 0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', flexFlow: 'column', gap: '8px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h5 style={{ fontWeight: 700, fontSize: '1.05rem', color: alert.is_resolved ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                          Suspicious Activity Flag
                        </h5>
                        <span className={`badge ${alert.severity === 'high' ? 'badge-danger' : 'badge-pending'}`}>
                          {alert.severity} Severity
                        </span>
                        {alert.is_resolved && (
                          <span className="badge badge-success">Resolved: {alert.resolution}</span>
                        )}
                      </div>

                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {alert.description}
                      </p>

                      <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Alert ID: {alert.id}</span>
                        <span>Date Flagged: {new Date(alert.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    {!alert.is_resolved && (
                      <button 
                        id={`btn_resolve_alert_${alert.id.substring(0,8)}`}
                        onClick={() => setActiveResolveAlert(alert)} 
                        className="btn btn-secondary" 
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        Resolve Alert
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* Security Center Tab */}
        {activeTab === 'security' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            <header>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Security Configuration</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enable advanced protection policies, audit sessions, and configure two-factor authentication.</p>
            </header>

            <div className="security-grid">
              
              {/* 2FA Setup Panel */}
              <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '10px', background: 'var(--primary-glow)', borderRadius: '12px', color: 'var(--primary)' }}>
                      <Lock size={20} />
                    </div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.15rem' }}>Google Authenticator (2FA)</h4>
                  </div>
                  
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Protect your transactions and account changes. Enabling 2FA requires entering a code from your Google Authenticator app for transfer confirmations and sign ins.
                  </p>
                </div>

                <div style={{ marginTop: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>STATUS</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: user.two_factor_enabled ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                      {user.two_factor_enabled ? 'Active / Protected' : 'Not Configured'}
                    </span>
                  </div>

                  {user.two_factor_enabled ? (
                    <button id="btn_disable_2fa" onClick={handleDisable2FA} className="btn btn-danger">
                      Disable 2FA
                    </button>
                  ) : (
                    <button id="btn_setup_2fa" onClick={handleSetup2FA} className="btn btn-primary">
                      Set Up 2FA
                    </button>
                  )}
                </div>
              </div>

              {/* Security Audit panel */}
              <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', color: 'var(--accent-emerald)' }}>
                    <ShieldCheck size={20} />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.15rem' }}>Security Policies Enforced</h4>
                </div>

                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', paddingLeft: 0 }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)', marginTop: '2px' }} />
                    <div>
                      <strong>JWT Session Token:</strong> Valid for 24 hours. Sign-ins are cryptographically authenticated.
                    </div>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)', marginTop: '2px' }} />
                    <div>
                      <strong>Fraud Engine Scored:</strong> Each transaction runs real-time checks matching transaction volume thresholds, high speed frequencies, and daily caps.
                    </div>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)', marginTop: '2px' }} />
                    <div>
                      <strong>AES Hashed Credentials:</strong> Personal logins, passwords, and 2FA secrets are hashed and stored using industry standard security algorithms.
                    </div>
                  </li>
                </ul>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* MODAL: Send Money */}
      {transferModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '35px', position: 'relative' }}>
            <button onClick={() => setTransferModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '5px' }}>Send P2P Transfer</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '25px' }}>Transfer funds immediately and securely to any email address.</p>

            {transferError && (
              <div className="badge-danger" style={{ padding: '10px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem' }}>
                <AlertTriangle size={16} />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Recipient Email or Wallet Address</label>
                <input 
                  id="transfer_email"
                  type="text" 
                  placeholder="email@example.com or 0x..." 
                  className="form-input"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  disabled={transferRequiresTfa}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Amount (INR)</label>
                <input 
                  id="transfer_amount"
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  placeholder="0.00" 
                  className="form-input"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  disabled={transferRequiresTfa}
                  required
                />
              </div>


              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Memo / Description (Optional)</label>
                <input 
                  id="transfer_description"
                  type="text" 
                  placeholder="Dinner, rent, etc." 
                  className="form-input"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  disabled={transferRequiresTfa}
                />
              </div>

              {/* If 2FA verified step */}
              {transferRequiresTfa && (
                <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.04)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--primary)', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={14} className="gradient-text-primary" />
                    <span>Google Authenticator Verification</span>
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>This transfer requires your 6-digit Google Authenticator code.</p>
                  <input 
                    id="transfer_2fa_code"
                    type="text" 
                    maxLength={6}
                    placeholder="Enter 6-digit code" 
                    className="form-input"
                    value={transferTfaCode}
                    onChange={(e) => setTransferTfaCode(e.target.value)}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTransferModalOpen(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" id="btn_submit_transfer" className="btn btn-primary" style={{ flex: 1 }}>
                  {transferRequiresTfa ? 'Confirm & Send' : 'Send Transfer'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Show QR Code */}
      {qrModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '380px', padding: '35px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
            <button onClick={() => setQrModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Receive Payments</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Scan this QR code or share address to receive transfers.</p>
            </div>

            {/* Rendering pure canvas or SVG styling for QR container */}
            <div style={{ background: 'white', padding: '16px', borderRadius: '14px', boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${wallet ? wallet.wallet_address : '0x00'}&color=0f172a`} 
                alt="Wallet Address QR" 
                style={{ display: 'block', width: '180px', height: '180px' }}
              />
            </div>

            <div style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--text-secondary)' }}>
              {wallet ? wallet.wallet_address : '0x00'}
            </div>

            <button onClick={() => wallet && copyToClipboard(wallet.wallet_address)} className="btn btn-secondary" style={{ width: '100%' }}>
              <Copy size={16} />
              <span>Copy Wallet Address</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Scan QR Code */}
      {scanQrModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '380px', padding: '35px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
            <button 
              onClick={() => setScanQrModalOpen(false)} 
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', zIndex: 10 }}
            >
              <X size={20} />
            </button>

            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Scan QR Code</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Point your camera at a recipient's wallet QR code.</p>
            </div>

            {scannerError ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', alignItems: 'center' }}>
                <div className="badge-danger" style={{ padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', width: '100%' }}>
                  <span>Camera blocked (requires HTTPS on mobile devices). Use the photo scanner below instead:</span>
                </div>
                
                <button 
                  type="button"
                  onClick={triggerFileSelect} 
                  className="btn btn-primary" 
                  style={{ width: '100%', height: '48px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Camera size={18} />
                  <span>Take Photo / Choose Image</span>
                </button>
              </div>
            ) : (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                <div style={{ width: '100%', overflow: 'hidden', borderRadius: '12px', background: '#000', border: '1px solid var(--border-glass)', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div id="qr-reader" style={{ width: '100%', height: '100%' }}></div>
                </div>
                
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Or scan from a photo:</span>
                <button 
                  type="button"
                  onClick={triggerFileSelect} 
                  className="btn btn-secondary" 
                  style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Camera size={16} />
                  <span>Choose from Gallery</span>
                </button>
              </div>
            )}
            
            <input 
              id="qr-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileScan}
              style={{ display: 'none' }}
            />
            <div id="qr-reader-file" style={{ display: 'none' }}></div>

            <button onClick={() => setScanQrModalOpen(false)} className="btn btn-secondary" style={{ width: '100%' }}>
              Cancel Scan
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Setup 2FA */}
      {tfaModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '35px', position: 'relative' }}>
            <button onClick={() => setTfaModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '5px' }}>Enable 2FA Protection</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>Scan the code using Google Authenticator or manual entry.</p>

            {tfaError && (
              <div className="badge-danger" style={{ padding: '10px', borderRadius: 'var(--radius-md)', marginBottom: '15px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem' }}>
                <AlertTriangle size={16} />
                <span>{tfaError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: 'white', padding: '12px', borderRadius: '12px' }}>
                {tfaQrCode ? (
                  <img src={tfaQrCode} alt="2FA QR Code" style={{ display: 'block', width: '160px', height: '160px' }} />
                ) : (
                  <div style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
                    Generating QR...
                  </div>
                )}
              </div>

              <div style={{ width: '100%' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '4px' }}>SECRET KEY</span>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'monospace', textAlign: 'center', letterSpacing: '1px', fontWeight: 'bold' }}>
                  {tfaSecret}
                </div>
              </div>

              <form onSubmit={handleVerify2FA} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Verify 6-digit Authenticator Code</label>
                  <input 
                    id="tfa_verify_code"
                    type="text" 
                    maxLength={6}
                    placeholder="Enter code shown on your app" 
                    className="form-input"
                    value={tfaVerifyCode}
                    onChange={(e) => setTfaVerifyCode(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setTfaModalOpen(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" id="btn_verify_2fa" className="btn btn-primary" style={{ flex: 1 }}>
                    Verify & Activate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Resolve Fraud Alert */}
      {activeResolveAlert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: '35px', position: 'relative' }}>
            <button onClick={() => setActiveResolveAlert(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '5px' }}>Resolve Security Flag</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>Provide review details to clear this suspicious activity status.</p>

            <form onSubmit={handleResolveAlert} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Resolution Status</label>
                <select 
                  id="resolution_status"
                  className="form-input" 
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  style={{ background: 'var(--bg-surface)' }}
                >
                  <option value="authorized">Authorize (I made this transaction)</option>
                  <option value="unauthorized_refund">Unauthorized (Fraudulent - Cancel & Refund)</option>
                  <option value="false_alarm">False Alarm (Ignore alert)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Review Notes / Comments</label>
                <textarea 
                  id="resolution_notes"
                  placeholder="Provide any additional details or feedback..." 
                  className="form-input"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  style={{ height: '90px', resize: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveResolveAlert(null)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" id="btn_submit_resolution" className="btn btn-primary" style={{ flex: 1 }}>
                  Clear Security Alert
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      </div>
    </>
  );
}
