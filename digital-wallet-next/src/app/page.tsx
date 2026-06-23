'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Wallet, Send, History, ShieldAlert, BarChart3, LogOut, Copy, 
  Plus, CheckCircle2, Lock, RefreshCw, AlertTriangle, Check, X, 
  TrendingUp, TrendingDown, Eye, ShieldCheck, HelpCircle, Camera
} from 'lucide-react';
import Preloader from '@/components/Preloader';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import ProjectGrid from '@/components/ProjectGrid';
import PageTransition from '@/components/PageTransition';

// TypeScript Interfaces
interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  two_factor_enabled: boolean;
}

interface WalletType {
  wallet_address: string;
  balance: string;
}

interface Transaction {
  id: string;
  amount: string;
  status: string;
  description: string;
  created_at: string;
  sender?: { user_id: number; user: { full_name: string; email: string } };
  receiver?: { user_id: number; user: { full_name: string; email: string } };
}

interface FraudAlert {
  id: string;
  description: string;
  severity: string;
  is_resolved: boolean;
  resolution?: string;
  created_at: string;
}

interface DashboardStats {
  overview: {
    monthly: { total_volume: number; total_transactions: number };
    weekly: { outgoing: number; incoming: number };
  };
  trends: { weekly: Array<{ date?: string; volume?: number; dataValues?: { date: string; volume: number } }> };
  patterns: { monthly: { size_distribution: Array<{ range: string; count: number }> } };
  insights: { monthly: Array<{ type: string; message: string; severity: string; recommendation: string }> };
}

// Axios API setup
const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default function Page() {
  const [preloaderActive, setPreloaderActive] = useState(false);

  // Auth States
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  // Forms States
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91');

  // 2FA States
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const [tfaLoginCode, setTfaLoginCode] = useState('');

  // General App UI States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dashboard Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);

  // Modals States
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [tfaModalOpen, setTfaModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [scanQrModalOpen, setScanQrModalOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');

  // Transfer Forms
  const [transferEmail, setTransferEmail] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [transferTfaCode, setTransferTfaCode] = useState('');
  const [transferRequiresTfa, setTransferRequiresTfa] = useState(false);
  const [transferError, setTransferError] = useState('');

  // Setup 2FA
  const [tfaSecret, setTfaSecret] = useState('');
  const [tfaQrCode, setTfaQrCode] = useState('');
  const [tfaVerifyCode, setTfaVerifyCode] = useState('');
  const [tfaError, setTfaError] = useState('');

  // Fraud Resolution
  const [activeResolveAlert, setActiveResolveAlert] = useState<FraudAlert | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState('authorized');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Local storage token retrieval
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        setToken(savedToken);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Fetch profile when token is active
  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  // Tab dynamic loaders
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

  // QR Code camera scanning handlers
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let html5QrCode: any;

    if (scanQrModalOpen) {
      setScannerError('');
      const timer = setTimeout(() => {
        try {
          const w = window as any;
          if (!w.Html5Qrcode) {
            setScannerError('Camera QR engine not available.');
            return;
          }

          html5QrCode = new w.Html5Qrcode('qr-reader');

          const qrSuccess = (text: string) => {
            setTransferEmail(text);
            setScanQrModalOpen(false);
            setTransferModalOpen(true);
            try {
              html5QrCode.stop();
            } catch (err) {
              console.error(err);
            }
          };

          html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 200, height: 200 } },
            qrSuccess
          ).catch((err: any) => {
            console.error(err);
            setScannerError('Failed to access camera permission.');
          });
        } catch (err) {
          console.error(err);
          setScannerError('Error initializing camera.');
        }
      }, 500);

      return () => {
        clearTimeout(timer);
        if (html5QrCode) {
          try {
            html5QrCode.stop();
          } catch (e) {}
        }
      };
    }
  }, [scanQrModalOpen]);

  const handleFileScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || typeof window === 'undefined') return;

    try {
      const w = window as any;
      if (!w.Html5Qrcode) {
        alert('QR parsing engine not loaded.');
        return;
      }
      const html5QrCode = new w.Html5Qrcode('qr-reader-file');
      html5QrCode
        .scanFile(file, true)
        .then((text: string) => {
          setTransferEmail(text);
          setScanQrModalOpen(false);
          setTransferModalOpen(true);
        })
        .catch(() => {
          alert('Could not detect a valid QR code in this image.');
        });
    } catch (err) {
      console.error(err);
      alert('Error parsing QR image file.');
    }
  };

  const triggerFileSelect = () => {
    const el = document.getElementById('qr-file-input');
    if (el) el.click();
  };

  // Profile loaders
  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data.user);
      setWallet(res.data.data.wallet);
    } catch (err) {
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletData = async () => {
    try {
      const res = await api.get('/wallet/balance');
      setWallet((prev) => (prev ? { ...prev, balance: res.data.data.balance } : null));
    } catch (err) {
      showError('Failed to sync wallet balance.');
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get(`/wallet/transactions?page=${txPage}&limit=6`);
      setTransactions(res.data.data.transactions);
      setTxTotal(res.data.data.total);
    } catch (err) {
      showError('Failed to fetch transactions list.');
    }
  };

  const fetchFraudAlerts = async () => {
    try {
      const res = await api.get('/fraud/alerts');
      setFraudAlerts(res.data.data);
    } catch (err) {
      showError('Failed to sync security alerts.');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      setDashboardStats(res.data.data);
    } catch (err) {
      showError('Failed to fetch analytics metrics.');
    }
  };

  // Helper displays
  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 5000);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Handlers
  const handleManualRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      if (activeTab === 'dashboard') {
        await Promise.all([fetchWalletData(), fetchTransactions(), fetchFraudAlerts()]);
      } else if (activeTab === 'analytics') {
        await fetchAnalytics();
      } else if (activeTab === 'alerts' || activeTab === 'security') {
        await fetchFraudAlerts();
      }
      showSuccess('Balances and metrics refreshed.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.status === 'requires_2fa') {
        setRequires2FA(true);
        setTempUserId(res.data.data.userId);
        return;
      }
      const { token: tk, user: usr, wallet: wlt } = res.data.data;
      localStorage.setItem('token', tk);
      setToken(tk);
      setUser(usr);
      setWallet(wlt);
      showSuccess(`Welcome back, ${usr.full_name}!`);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Login failed.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.post('/auth/register', { email, password, full_name: fullName, phone });
      const { token: tk, user: usr, wallet: wlt } = res.data.data;
      localStorage.setItem('token', tk);
      setToken(tk);
      setUser(usr);
      setWallet(wlt);
      showSuccess('Registration complete. Ledger created with ₹1,000 demo funds.');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Registration failed.');
    }
  };

  const handle2FALogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.post('/auth/2fa/login', { userId: tempUserId, token: tfaLoginCode });
      const { token: tk, user: usr, wallet: wlt } = res.data.data;
      localStorage.setItem('token', tk);
      setToken(tk);
      setUser(usr);
      setWallet(wlt);
      setRequires2FA(false);
      setTfaLoginCode('');
      showSuccess(`Welcome, ${usr.full_name}!`);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Invalid 2FA Authenticator token.');
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

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');

    if (user?.two_factor_enabled && !transferTfaCode) {
      setTransferRequiresTfa(true);
      return;
    }

    try {
      const payload: any = {
        receiverEmail: transferEmail,
        amount: parseFloat(transferAmount),
        description: transferDesc,
      };

      if (transferTfaCode) {
        payload.two_factor_code = transferTfaCode;
      }

      await api.post('/wallet/transfer', payload);
      showSuccess(`Transferred ₹${transferAmount} to ${transferEmail}.`);
      setTransferModalOpen(false);
      setTransferEmail('');
      setTransferAmount('');
      setTransferDesc('');
      setTransferTfaCode('');
      setTransferRequiresTfa(false);
      fetchWalletData();
      fetchTransactions();
    } catch (err: any) {
      if (err.response?.status === 401 && err.response?.data?.requires2FA) {
        setTransferRequiresTfa(true);
        setTransferError('2FA authentication code is required.');
      } else if (err.response?.status === 403 && err.response?.data?.status === 'flagged') {
        showError('Alert: Transaction FLAGGED for security fraud analysis!');
        setTransferModalOpen(false);
        setTransferEmail('');
        setTransferAmount('');
        setTransferDesc('');
        setTransferTfaCode('');
        setTransferRequiresTfa(false);
        fetchTransactions();
        fetchFraudAlerts();
      } else {
        setTransferError(err.response?.data?.message || 'Transfer failed.');
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
      showError('Failed to initialize 2FA credentials.');
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTfaError('');
    try {
      await api.post('/auth/2fa/verify', { token: tfaVerifyCode });
      showSuccess('Google Authenticator 2FA enabled successfully!');
      setTfaModalOpen(false);
      setTfaVerifyCode('');
      setTfaSecret('');
      setTfaQrCode('');
      fetchProfile();
    } catch (err: any) {
      setTfaError(err.response?.data?.message || 'Invalid verification token.');
    }
  };

  const handleDisable2FA = async () => {
    const code = prompt('Enter your 6-digit Authenticator code to disable 2FA:');
    if (!code) return;
    try {
      await api.post('/auth/2fa/disable', { token: code });
      showSuccess('2FA protection disabled.');
      fetchProfile();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to disable 2FA.');
    }
  };

  const handleResolveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResolveAlert) return;
    try {
      await api.post(`/fraud/alerts/${activeResolveAlert.id}/resolve`, {
        resolution: resolutionStatus,
        notes: resolutionNotes,
      });
      showSuccess('Security flag resolved successfully.');
      setActiveResolveAlert(null);
      setResolutionNotes('');
      fetchFraudAlerts();
      fetchWalletData();
      fetchTransactions();
    } catch (err) {
      showError('Failed to resolve security flag.');
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    showSuccess('Wallet address copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-main gap-4">
        <RefreshCw size={36} className="animate-spin text-accent-cream" />
        <span className="font-mono text-xs tracking-widest text-text-muted">INITIALIZING WALLET CLIENT...</span>
      </div>
    );
  }

  const activeAlertsCount = fraudAlerts.filter((a) => !a.is_resolved).length;

  return (
    <>
      {preloaderActive && (
        <Preloader onComplete={() => setPreloaderActive(false)} />
      )}

      {!preloaderActive && (
        <>
          {/* Header navigation overlay */}
          <Nav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isLoggedIn={!!user}
            onLogout={handleLogout}
          />

          <PageTransition>
            {/* Display Notification banners */}
            {errorMsg && (
              <div className="fixed top-24 right-6 z-[200] bg-[#FF3333] text-bg-main px-6 py-4 flex items-center gap-3 font-mono text-xs font-bold tracking-widest animate-slide-in">
                <AlertTriangle size={16} />
                <span>{errorMsg.toUpperCase()}</span>
              </div>
            )}
            {successMsg && (
              <div className="fixed top-24 right-6 z-[200] bg-accent-cream text-bg-main px-6 py-4 flex items-center gap-3 font-mono text-xs font-bold tracking-widest animate-slide-in">
                <CheckCircle2 size={16} />
                <span>{successMsg.toUpperCase()}</span>
              </div>
            )}

            {!user ? (
              /* Public / Marketing & Credentials Login Page */
              <div className="w-full flex flex-col items-center">
                <Hero />
                <ProjectGrid />

                {/* Login Form Panel */}
                <div id="login-section" className="w-full py-24 px-6 md:px-24 bg-bg-surface flex items-center justify-center border-t border-border-glass">
                  <div className="w-full max-w-md border border-border-glass p-8 md:p-12 flex flex-col gap-8 bg-bg-main">
                    <div className="text-center flex flex-col gap-2">
                      <h2 className="text-2xl md:text-3xl font-display font-black">
                        {requires2FA ? 'TWO-FACTOR AUTH' : isRegister ? 'CREATE ACCOUNT' : 'SYSTEM ENTRY'}
                      </h2>
                      <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
                        {requires2FA ? 'Enter Google Authenticator OTP' : isRegister ? 'Register secure payment keys' : 'Sign in to access secure dashboard'}
                      </p>
                    </div>

                    {requires2FA ? (
                      <form onSubmit={handle2FALogin} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase">OTP Verification Code</label>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            className="w-full bg-transparent border border-border-glass focus:border-accent-cream outline-none p-4 font-mono text-center text-lg tracking-widest text-white transition-all duration-300"
                            value={tfaLoginCode}
                            onChange={(e) => setTfaLoginCode(e.target.value)}
                            required
                          />
                        </div>
                        <button type="submit" className="font-display text-xs tracking-widest uppercase px-6 py-4 border border-accent-cream transition-all duration-300 font-bold hover:bg-accent-cream hover:text-bg-main cursor-pointer">
                          Verify Token
                        </button>
                        <button type="button" onClick={() => setRequires2FA(false)} className="text-center font-mono text-[10px] tracking-widest text-text-muted hover:text-white uppercase transition-colors">
                          Cancel
                        </button>
                      </form>
                    ) : !isRegister ? (
                      /* Login Form */
                      <form onSubmit={handleLogin} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Email Address</label>
                          <input
                            type="email"
                            placeholder="vishalsharma@gmail.com"
                            className="w-full bg-transparent border border-border-glass focus:border-accent-cream outline-none p-4 font-mono text-sm tracking-wide text-white transition-all duration-300"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Account Password</label>
                          <input
                            type="password"
                            placeholder="password1234"
                            className="w-full bg-transparent border border-border-glass focus:border-accent-cream outline-none p-4 font-mono text-sm tracking-wide text-white transition-all duration-300"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        <button type="submit" className="font-display text-xs tracking-widest uppercase px-6 py-4 border border-accent-cream transition-all duration-300 font-bold hover:bg-accent-cream hover:text-bg-main cursor-pointer">
                          Authenticate Account
                        </button>
                        <p className="text-center font-mono text-[10px] tracking-widest text-text-muted">
                          NEW TO FINTECH?{' '}
                          <span onClick={() => setIsRegister(true)} className="text-accent-cream hover:text-white cursor-pointer underline">
                            CREATE ACCOUNT
                          </span>
                        </p>
                      </form>
                    ) : (
                      /* Register Form */
                      <form onSubmit={handleRegister} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                          <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Full Name</label>
                          <input
                            type="text"
                            placeholder="Vishal Sharma"
                            className="w-full bg-transparent border border-border-glass focus:border-accent-cream outline-none p-4 font-mono text-sm tracking-wide text-white transition-all duration-300"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Email Address</label>
                          <input
                            type="email"
                            placeholder="vishalsharma@gmail.com"
                            className="w-full bg-transparent border border-border-glass focus:border-accent-cream outline-none p-4 font-mono text-sm tracking-wide text-white transition-all duration-300"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Phone Number</label>
                          <input
                            type="text"
                            placeholder="+91 9876543210"
                            className="w-full bg-transparent border border-border-glass focus:border-accent-cream outline-none p-4 font-mono text-sm tracking-wide text-white transition-all duration-300"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Password</label>
                          <input
                            type="password"
                            placeholder="Min. 8 characters"
                            className="w-full bg-transparent border border-border-glass focus:border-accent-cream outline-none p-4 font-mono text-sm tracking-wide text-white transition-all duration-300"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        <button type="submit" className="font-display text-xs tracking-widest uppercase px-6 py-4 border border-accent-cream transition-all duration-300 font-bold hover:bg-accent-cream hover:text-bg-main cursor-pointer">
                          Register Account Key
                        </button>
                        <p className="text-center font-mono text-[10px] tracking-widest text-text-muted">
                          HAVE AN ACCOUNT?{' '}
                          <span onClick={() => setIsRegister(false)} className="text-accent-cream hover:text-white cursor-pointer underline">
                            SIGN IN
                          </span>
                        </p>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Secured Client Portal Dashboard */
              <div className="w-full min-h-screen pt-32 px-6 md:px-24 pb-24 flex flex-col gap-12 max-w-7xl mx-auto">
                
                {/* Secure Top Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-glass pb-8 gap-6">
                  <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight">
                      {activeTab === 'dashboard' && 'FINANCIAL DESK'}
                      {activeTab === 'analytics' && 'METRICS ANALYTICS'}
                      {activeTab === 'alerts' && 'SECURITY ALERTS'}
                      {activeTab === 'security' && 'SECURITY CENTRE'}
                    </h1>
                    <p className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
                      SECURED LEDGER ID: {wallet?.wallet_address || '0x00'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      className="flex items-center gap-2 border border-border-glass hover:border-accent-cream bg-bg-surface text-accent-cream hover:text-white font-mono text-[10px] tracking-widest uppercase px-5 py-3 transition-all duration-300"
                    >
                      <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                      <span>{isRefreshing ? 'REFRESHING' : 'REFRESH'}</span>
                    </button>

                    {activeTab === 'dashboard' && (
                      <>
                        <button
                          onClick={() => setTransferModalOpen(true)}
                          className="flex items-center gap-2 bg-accent-cream hover:bg-white text-bg-main font-display text-[10px] tracking-widest uppercase px-5 py-3 transition-all duration-300 font-bold border border-accent-cream"
                        >
                          <Send size={12} />
                          <span>SEND FUNDS</span>
                        </button>
                        <button
                          onClick={() => setScanQrModalOpen(true)}
                          className="flex items-center gap-2 border border-border-glass hover:border-accent-cream bg-bg-surface text-accent-cream hover:text-white font-mono text-[10px] tracking-widest uppercase px-5 py-3 transition-all duration-300"
                        >
                          <Camera size={12} />
                          <span>SCAN QR</span>
                        </button>
                        <button
                          onClick={() => setQrModalOpen(true)}
                          className="flex items-center gap-2 border border-border-glass hover:border-accent-cream bg-bg-surface text-accent-cream hover:text-white font-mono text-[10px] tracking-widest uppercase px-5 py-3 transition-all duration-300"
                        >
                          <Eye size={12} />
                          <span>SHOW QR</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Dashboard layout screens */}
                {activeTab === 'dashboard' && (
                  <div className="flex flex-col gap-12">
                    
                    {/* Top balance metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Card Balance */}
                      <div className="border border-accent-cream p-8 md:p-10 flex flex-col justify-between min-h-[220px] bg-bg-surface relative group overflow-hidden">
                        <div className="absolute inset-0 bg-accent-cream/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[9px] tracking-widest text-text-muted">LEDGER CAPACITY</span>
                            <span className="font-display font-black text-2xl md:text-3xl tracking-tight">
                              ₹{wallet ? parseFloat(wallet.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                            </span>
                          </div>
                          <div className="p-3 bg-bg-main border border-border-glass">
                            <Wallet size={24} className="text-accent-cream" />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 mt-6">
                          <span className="font-mono text-[8px] tracking-widest text-text-muted">WALLET KEY</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-white tracking-wider">
                              {wallet ? `${wallet.wallet_address.substring(0, 14)}...${wallet.wallet_address.substring(wallet.wallet_address.length - 12)}` : '0x00'}
                            </span>
                            <button
                              onClick={() => wallet && copyAddress(wallet.wallet_address)}
                              className="text-text-muted hover:text-white transition-colors"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Card security state status */}
                      <div className="border border-border-glass p-8 md:p-10 flex flex-col justify-between bg-bg-surface">
                        <div className="flex items-center gap-3">
                          <ShieldCheck size={20} className="text-accent-cream" />
                          <h4 className="font-display font-bold text-sm tracking-widest uppercase">System Status Check</h4>
                        </div>

                        <div className="flex flex-col gap-3 my-6 font-mono text-[11px] text-text-muted">
                          <div className="flex justify-between border-b border-border-glass/40 pb-2">
                            <span>Two-Factor Auth (2FA)</span>
                            {user.two_factor_enabled ? (
                              <span className="text-green-400 font-bold uppercase">[ ACTIVE ]</span>
                            ) : (
                              <span
                                onClick={() => setActiveTab('security')}
                                className="text-yellow-400 font-bold uppercase hover:underline cursor-pointer"
                              >
                                [ SET UP ]
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between border-b border-border-glass/40 pb-2">
                            <span>Active Fraud Flags</span>
                            {activeAlertsCount > 0 ? (
                              <span className="text-red-400 font-bold uppercase">[{activeAlertsCount} FLAGGED]</span>
                            ) : (
                              <span className="text-green-400 font-bold uppercase">[ SECURE ]</span>
                            )}
                          </div>
                          <div className="flex justify-between">
                            <span>Network Node</span>
                            <span className="text-green-400 font-bold uppercase">[ ONLINE ]</span>
                          </div>
                        </div>

                        <div className="p-3 bg-bg-main border border-border-glass text-[10px] font-mono text-text-muted flex gap-2 items-center">
                          <CheckCircle2 size={12} className="text-green-400 shrink-0" />
                          <span>Ledger operations validated and certified.</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Transactions List */}
                    <div className="border border-border-glass p-8 md:p-10 bg-bg-surface flex flex-col gap-8">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-glass pb-6 gap-4">
                        <div className="flex items-center gap-3">
                          <History size={18} className="text-accent-cream" />
                          <h4 className="font-display font-bold text-sm tracking-widest uppercase">Transaction Ledger Activity</h4>
                        </div>

                        <div className="flex items-center gap-3 font-mono text-[10px] tracking-widest">
                          <button
                            onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                            disabled={txPage === 1}
                            className="border border-border-glass hover:border-accent-cream bg-bg-main px-3 py-2 disabled:opacity-30 disabled:hover:border-border-glass"
                          >
                            PREV
                          </button>
                          <span className="text-white">PAGE {txPage}</span>
                          <button
                            onClick={() => setTxPage((p) => p + 1)}
                            disabled={transactions.length < 6}
                            className="border border-border-glass hover:border-accent-cream bg-bg-main px-3 py-2 disabled:opacity-30 disabled:hover:border-border-glass"
                          >
                            NEXT
                          </button>
                        </div>
                      </div>

                      {transactions.length === 0 ? (
                        <div className="text-center py-16 text-text-muted font-mono text-xs flex flex-col items-center gap-2">
                          <History size={24} className="opacity-30" />
                          <span>No transaction records found on this ledger node.</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {transactions.map((tx) => {
                            const isSender = tx.sender && tx.sender.user_id === user.id;
                            const counterpart = isSender ? tx.receiver?.user : tx.sender?.user;
                            const amt = parseFloat(tx.amount);
                            const dateStr = new Date(tx.created_at).toLocaleString();

                            return (
                              <div
                                key={tx.id}
                                className="border border-border-glass bg-bg-main p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all duration-300 hover:border-accent-cream/50"
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`p-3 border ${
                                    isSender ? 'border-red-500/20 text-red-400 bg-red-950/10' : 'border-green-500/20 text-green-400 bg-green-950/10'
                                  }`}>
                                    {isSender ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <span className="font-display font-bold text-sm tracking-tight text-white">
                                      {isSender ? 'SENT TO' : 'RECEIVED FROM'} {counterpart ? counterpart.full_name.toUpperCase() : 'UNKNOWN LEDGER'}
                                    </span>
                                    <span className="font-mono text-[9px] text-text-muted tracking-wider">
                                      {counterpart ? counterpart.email : 'EXTERNAL'} • {dateStr}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                                  <span className={`font-display font-extrabold text-base ${
                                    isSender ? 'text-red-400' : 'text-green-400'
                                  }`}>
                                    {isSender ? '-' : '+'}₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  <span className={`text-[8px] font-mono border px-2 py-0.5 uppercase ${
                                    tx.status === 'completed' ? 'border-green-500/30 text-green-400' :
                                    tx.status === 'flagged' ? 'border-red-500/30 text-red-400 bg-red-950/20' :
                                    'border-yellow-500/30 text-yellow-400'
                                  }`}>
                                    {tx.status}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                    </div>

                  </div>
                )}

                {/* Analytics Panel */}
                {activeTab === 'analytics' && (
                  <div className="flex flex-col gap-12">
                    
                    {!dashboardStats ? (
                      <div className="text-center py-16">
                        <RefreshCw size={24} className="animate-spin mx-auto text-accent-cream" />
                      </div>
                    ) : (
                      <>
                        {/* Highlights row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="border border-border-glass p-6 bg-bg-surface flex flex-col gap-1">
                            <span className="font-mono text-[9px] tracking-widest text-text-muted">MONTHLY VOLUME</span>
                            <span className="font-display font-black text-xl text-white">₹{dashboardStats.overview.monthly.total_volume.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="border border-border-glass p-6 bg-bg-surface flex flex-col gap-1">
                            <span className="font-mono text-[9px] tracking-widest text-text-muted">WEEKLY OUTFLOW</span>
                            <span className="font-display font-black text-xl text-red-400">-₹{dashboardStats.overview.weekly.outgoing.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="border border-border-glass p-6 bg-bg-surface flex flex-col gap-1">
                            <span className="font-mono text-[9px] tracking-widest text-text-muted">WEEKLY INFLOW</span>
                            <span className="font-display font-black text-xl text-green-400">+₹{dashboardStats.overview.weekly.incoming.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="border border-border-glass p-6 bg-bg-surface flex flex-col gap-1">
                            <span className="font-mono text-[9px] tracking-widest text-text-muted">TRANSACTION COUNT</span>
                            <span className="font-display font-black text-xl text-white">{dashboardStats.overview.monthly.total_transactions} TXs</span>
                          </div>
                        </div>

                        {/* Graphic SVG Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Trends visual panel */}
                          <div className="border border-border-glass p-8 bg-bg-surface lg:col-span-2 flex flex-col gap-6">
                            <h4 className="font-display font-bold text-sm tracking-widest uppercase">Weekly Volume Analytics</h4>
                            
                            {dashboardStats.trends.weekly.length === 0 ? (
                              <div className="text-center py-24 text-text-muted font-mono text-xs">No records available for the current weekly cycles.</div>
                            ) : (
                              <div className="w-full aspect-[2/1] min-h-[220px]">
                                <svg viewBox="0 0 500 200" className="w-full h-full">
                                  <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                                  <line x1="40" y1="80" x2="480" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                                  <line x1="40" y1="140" x2="480" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                                  <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.15)" />

                                  {(() => {
                                    const raw = dashboardStats.trends.weekly;
                                    const maxVal = Math.max(...raw.map(d => {
                                      const val = d.dataValues ? d.dataValues.volume : (d.volume || 0);
                                      return parseFloat(val.toString());
                                    }), 100);
                                    const count = raw.length;
                                    const barWidth = Math.min(30, 320 / count);
                                    const spacing = (440 - barWidth * count) / (count + 1);

                                    return raw.map((d, index) => {
                                      const val = d.dataValues ? d.dataValues.volume : (d.volume || 0);
                                      const vol = parseFloat(val.toString());
                                      const barHeight = (vol / maxVal) * 140;
                                      const x = 50 + index * (barWidth + spacing);
                                      const y = 170 - barHeight;

                                      const dateStr = d.dataValues ? d.dataValues.date : (d.date || '');
                                      const displayDate = dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr;

                                      return (
                                        <g key={index}>
                                          <rect
                                            x={x}
                                            y={y}
                                            width={barWidth}
                                            height={barHeight}
                                            fill="var(--color-accent-cream)"
                                            opacity="0.8"
                                          />
                                          <text x={x + barWidth / 2} y="190" fill="var(--color-text-muted)" fontSize="8" textAnchor="middle" fontFamily="monospace">
                                            {displayDate.substring(displayDate.length - 5)}
                                          </text>
                                          <text x={x + barWidth / 2} y={y - 5} fill="white" fontSize="8" fontWeight="600" textAnchor="middle" fontFamily="monospace">
                                            ₹{Math.round(vol)}
                                          </text>
                                        </g>
                                      );
                                    });
                                  })()}
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Spending Distributions patterns list */}
                          <div className="border border-border-glass p-8 bg-bg-surface flex flex-col gap-6">
                            <h4 className="font-display font-bold text-sm tracking-widest uppercase">Transaction Distribution</h4>
                            
                            <div className="flex flex-col gap-6">
                              {dashboardStats.patterns.monthly.size_distribution.map((dist, idx) => {
                                const totalCounts = dashboardStats.patterns.monthly.size_distribution.reduce((acc, curr) => acc + curr.count, 0);
                                const pct = totalCounts > 0 ? (dist.count / totalCounts) * 100 : 0;

                                return (
                                  <div key={idx} className="flex flex-col gap-2">
                                    <div className="flex justify-between font-mono text-xs">
                                      <span className="text-text-muted">₹{dist.range} range</span>
                                      <span className="text-white font-bold">{dist.count} TXs ({Math.round(pct)}%)</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-bg-main border border-border-glass">
                                      <div
                                        className="h-full bg-accent-cream"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* System Analytics Insights recommendation logs */}
                        <div className="border border-border-glass p-8 bg-bg-surface flex flex-col gap-6">
                          <div className="flex items-center gap-3">
                            <HelpCircle size={18} className="text-accent-cream" />
                            <h4 className="font-display font-bold text-sm tracking-widest uppercase">Anomaly Detection & System Insights</h4>
                          </div>

                          {dashboardStats.insights.monthly.length === 0 ? (
                            <p className="font-mono text-xs text-text-muted">Anomalies check passed: Zero velocity flags or volume outliers detected.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {dashboardStats.insights.monthly.map((insight, idx) => (
                                <div
                                  key={idx}
                                  className={`border p-6 flex flex-col gap-4 bg-bg-main ${
                                    insight.severity === 'medium' ? 'border-yellow-500/20' : 'border-accent-cream/20'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-display font-bold text-xs tracking-wider uppercase">
                                      {insight.type} INDICATOR
                                    </span>
                                    <span className={`text-[8px] font-mono border px-2 py-0.5 uppercase ${
                                      insight.severity === 'medium' ? 'border-yellow-500/40 text-yellow-400' : 'border-accent-cream/40 text-accent-cream'
                                    }`}>
                                      {insight.severity} SEVERITY
                                    </span>
                                  </div>

                                  <p className="font-mono text-xs text-text-muted leading-relaxed">
                                    {insight.message}
                                  </p>

                                  <div className="border-t border-border-glass pt-3 mt-2 text-[10px] font-mono text-accent-cream">
                                    <strong>ACTION RECO:</strong> {insight.recommendation}
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

                {/* Fraud Alerts List */}
                {activeTab === 'alerts' && (
                  <div className="flex flex-col gap-8">
                    
                    {fraudAlerts.length === 0 ? (
                      <div className="border border-border-glass p-12 bg-bg-surface text-center flex flex-col items-center gap-4">
                        <ShieldCheck size={40} className="text-green-400" />
                        <h4 className="font-display font-bold text-sm tracking-widest uppercase">All System Engines Clear</h4>
                        <p className="font-mono text-xs text-text-muted">No suspicious indicators recorded on your payment credentials.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        {fraudAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className={`border bg-bg-surface p-6 md:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6 ${
                              alert.is_resolved ? 'border-border-glass' : 'border-red-500/30'
                            }`}
                          >
                            <div className="flex flex-col gap-3 flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="font-display font-black text-sm text-white">SUSPICIOUS ACTIVITY SCORING FLAG</span>
                                <span className={`text-[8px] font-mono border px-2 py-0.5 uppercase ${
                                  alert.severity === 'high' ? 'border-red-500/40 text-red-400' : 'border-yellow-500/40 text-yellow-400'
                                }`}>
                                  {alert.severity} SEVERITY
                                </span>
                                {alert.is_resolved && (
                                  <span className="text-[8px] font-mono border border-green-500/40 text-green-400 px-2 py-0.5 uppercase">
                                    RESOLVED: {alert.resolution}
                                  </span>
                                )}
                              </div>

                              <p className="font-mono text-xs text-text-muted leading-relaxed">
                                {alert.description}
                              </p>

                              <div className="flex items-center gap-4 font-mono text-[9px] text-text-dim mt-2">
                                <span>FLAG ID: {alert.id}</span>
                                <span>RECORDED: {new Date(alert.created_at).toLocaleString()}</span>
                              </div>
                            </div>

                            {!alert.is_resolved && (
                              <button
                                onClick={() => setActiveResolveAlert(alert)}
                                className="border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-bg-main font-mono text-[10px] tracking-widest uppercase px-5 py-3 transition-all duration-300 font-bold shrink-0 self-start md:self-center"
                              >
                                RESOLVE FLAG
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                )}

                {/* Security Config settings */}
                {activeTab === 'security' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* 2FA setup details */}
                    <div className="border border-border-glass p-8 bg-bg-surface flex flex-col justify-between min-h-[300px]">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <Lock size={18} className="text-accent-cream" />
                          <h4 className="font-display font-bold text-sm tracking-widest uppercase">Google Authenticator (2FA)</h4>
                        </div>
                        <p className="font-sans text-xs text-text-muted leading-relaxed">
                          Secure your transactions and account edits. Once enabled, executing any payments transfer or login challenge requires entering the 6-digit OTP code from your Authenticator app.
                        </p>
                      </div>

                      <div className="border border-border-glass bg-bg-main p-5 flex items-center justify-between mt-8 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[8px] text-text-muted tracking-widest">OTP STATUS</span>
                          <span className={`font-display font-extrabold text-sm ${
                            user.two_factor_enabled ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {user.two_factor_enabled ? 'PROTECTED / ENFORCED' : 'NOT CONFIGURED'}
                          </span>
                        </div>

                        {user.two_factor_enabled ? (
                          <button
                            onClick={handleDisable2FA}
                            className="border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-bg-main font-mono text-[10px] tracking-widest uppercase px-4 py-2.5 transition-all duration-300"
                          >
                            DISABLE 2FA
                          </button>
                        ) : (
                          <button
                            onClick={handleSetup2FA}
                            className="bg-accent-cream hover:bg-white text-bg-main font-display text-[10px] tracking-widest uppercase px-4 py-2.5 transition-all duration-300 font-bold border border-accent-cream"
                          >
                            SET UP 2FA
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Policy list */}
                    <div className="border border-border-glass p-8 bg-bg-surface flex flex-col gap-6">
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={18} className="text-accent-cream" />
                        <h4 className="font-display font-bold text-sm tracking-widest uppercase">Enforced Ledger Security Policies</h4>
                      </div>

                      <div className="flex flex-col gap-5 font-sans text-xs text-text-muted leading-relaxed">
                        <div className="flex gap-3">
                          <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-white">JWT Session Signature:</strong> Token validity is set to 24 hours. Sign-ins are cryptographically sealed.
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-white">Flag Engine Velocity Check:</strong> High frequency transfers, outlier limits, and volume caps are monitored in real time.
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-white">AES Passwords Hashing:</strong> Credentials database is encrypted with unique security hashes.
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

            {/* MODAL: Send Funds */}
            {transferModalOpen && user && (
              <div className="fixed inset-0 w-full h-full bg-bg-main/90 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
                <div className="border border-border-glass p-8 md:p-10 w-full max-w-md bg-bg-surface relative flex flex-col gap-6 animate-slide-in">
                  <button
                    onClick={() => setTransferModalOpen(false)}
                    className="absolute top-6 right-6 text-text-muted hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>

                  <div className="flex flex-col gap-1">
                    <h3 className="font-display font-black text-xl text-white">Execute Transfer</h3>
                    <span className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Send P2P digital funds securely</span>
                  </div>

                  {transferError && (
                    <div className="bg-red-950/20 border border-red-500/20 text-red-400 p-4 font-mono text-xs flex gap-2 items-center">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{transferError.toUpperCase()}</span>
                    </div>
                  )}

                  <form onSubmit={handleTransfer} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Recipient Email Address</label>
                      <input
                        type="text"
                        placeholder="recipient@example.com"
                        className="w-full bg-transparent border border-border-glass focus:border-accent-cream outline-none p-4 font-mono text-sm tracking-wide text-white transition-all duration-300"
                        value={transferEmail}
                        onChange={(e) => setTransferEmail(e.target.value)}
                        disabled={transferRequiresTfa}
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Transfer Amount (INR)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="w-full bg-transparent border border-border-glass focus:border-accent-cream outline-none p-4 font-mono text-sm tracking-wide text-white transition-all duration-300"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        disabled={transferRequiresTfa}
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Description / Memo</label>
                      <input
                        type="text"
                        placeholder="Service payment"
                        className="w-full bg-transparent border border-border-glass focus:border-accent-cream outline-none p-4 font-mono text-sm tracking-wide text-white transition-all duration-300"
                        value={transferDesc}
                        onChange={(e) => setTransferDesc(e.target.value)}
                        disabled={transferRequiresTfa}
                      />
                    </div>

                    {/* Authenticator Challenge inner box */}
                    {transferRequiresTfa && (
                      <div className="border border-accent-cream p-5 bg-bg-main flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-white">
                          <Lock size={12} className="text-accent-cream animate-pulse" />
                          <span className="font-mono text-[10px] tracking-widest uppercase font-bold">2FA Verification Challenge</span>
                        </div>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          className="w-full bg-transparent border border-border-glass focus:border-accent-cream outline-none p-3 font-mono text-center text-lg tracking-widest text-white transition-all duration-300"
                          value={transferTfaCode}
                          onChange={(e) => setTransferTfaCode(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div className="flex gap-4 mt-2">
                      <button
                        type="button"
                        onClick={() => setTransferModalOpen(false)}
                        className="flex-1 border border-border-glass hover:border-accent-cream/50 bg-transparent text-text-muted hover:text-white font-mono text-[10px] tracking-widest uppercase py-3.5 transition-all duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-accent-cream hover:bg-white text-bg-main font-display text-[10px] tracking-widest uppercase py-3.5 transition-all duration-300 font-bold border border-accent-cream"
                      >
                        {transferRequiresTfa ? 'CONFIRM SEND' : 'SEND FUNDS'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL: Show QR */}
            {qrModalOpen && wallet && (
              <div className="fixed inset-0 w-full h-full bg-bg-main/90 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
                <div className="border border-border-glass p-8 w-full max-w-sm bg-bg-surface relative flex flex-col items-center gap-6 text-center animate-slide-in">
                  <button
                    onClick={() => setQrModalOpen(false)}
                    className="absolute top-6 right-6 text-text-muted hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>

                  <div className="flex flex-col gap-1">
                    <h3 className="font-display font-black text-lg text-white">Receive Payments</h3>
                    <span className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Scan this QR key to transfer funds</span>
                  </div>

                  <div className="bg-white p-4 border border-accent-cream shadow-2xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${wallet.wallet_address}&color=0f172a`}
                      alt="Wallet QR key"
                      className="w-44 h-44"
                    />
                  </div>

                  <div className="w-full bg-bg-main border border-border-glass p-4 font-mono text-[10px] text-text-muted break-all">
                    {wallet.wallet_address}
                  </div>

                  <button
                    onClick={() => copyAddress(wallet.wallet_address)}
                    className="w-full bg-accent-cream hover:bg-white text-bg-main font-display text-[10px] tracking-widest uppercase py-3.5 transition-all duration-300 font-bold border border-accent-cream"
                  >
                    Copy Address Key
                  </button>
                </div>
              </div>
            )}

            {/* MODAL: Camera QR Scanner */}
            {scanQrModalOpen && (
              <div className="fixed inset-0 w-full h-full bg-bg-main/95 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
                <div className="border border-border-glass p-8 w-full max-w-sm bg-bg-surface relative flex flex-col items-center gap-6 text-center animate-slide-in">
                  <button
                    onClick={() => setScanQrModalOpen(false)}
                    className="absolute top-6 right-6 text-text-muted hover:text-white transition-colors z-20"
                  >
                    <X size={18} />
                  </button>

                  <div className="flex flex-col gap-1">
                    <h3 className="font-display font-black text-lg text-white">Scan Wallet QR</h3>
                    <span className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Position camera over scanner code</span>
                  </div>

                  {scannerError ? (
                    <div className="w-full flex flex-col gap-4">
                      <div className="bg-red-950/20 border border-red-500/20 text-red-400 p-4 font-mono text-[11px] leading-relaxed">
                        Camera access blocked or unsupported. Use the file photo scanner below.
                      </div>
                      <button
                        onClick={triggerFileSelect}
                        className="w-full bg-accent-cream hover:bg-white text-bg-main font-display text-[10px] tracking-widest uppercase py-3.5 transition-all duration-300 font-bold border border-accent-cream"
                      >
                        Upload QR Image
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col gap-4">
                      <div className="w-full aspect-square border border-border-glass bg-black overflow-hidden flex items-center justify-center relative">
                        <div id="qr-reader" className="w-full h-full" />
                      </div>
                      <button
                        onClick={triggerFileSelect}
                        className="w-full border border-border-glass hover:border-accent-cream/50 bg-bg-main text-text-muted hover:text-white font-mono text-[10px] tracking-widest uppercase py-3 transition-all duration-300"
                      >
                        Choose Photo Gallery
                      </button>
                    </div>
                  )}

                  <input
                    id="qr-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileScan}
                    className="hidden"
                  />
                  <div id="qr-reader-file" className="hidden" />

                  <button
                    onClick={() => setScanQrModalOpen(false)}
                    className="w-full border border-border-glass hover:border-accent-cream bg-transparent text-text-muted hover:text-white font-mono text-[10px] tracking-widest uppercase py-3 transition-all duration-300"
                  >
                    Cancel Scan
                  </button>
                </div>
              </div>
            )}

            {/* MODAL: Setup 2FA OTP details */}
            {tfaModalOpen && (
              <div className="fixed inset-0 w-full h-full bg-bg-main/90 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
                <div className="border border-border-glass p-8 md:p-10 w-full max-w-md bg-bg-surface relative flex flex-col gap-6 animate-slide-in">
                  <button
                    onClick={() => setTfaModalOpen(false)}
                    className="absolute top-6 right-6 text-text-muted hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>

                  <div className="flex flex-col gap-1">
                    <h3 className="font-display font-black text-xl text-white">Enable 2FA Protection</h3>
                    <span className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Scan the code in Authenticator</span>
                  </div>

                  {tfaError && (
                    <div className="bg-red-950/20 border border-red-500/20 text-red-400 p-4 font-mono text-xs flex gap-2 items-center">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{tfaError.toUpperCase()}</span>
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-6">
                    <div className="bg-white p-3 border border-accent-cream shadow-2xl">
                      {tfaQrCode ? (
                        <img src={tfaQrCode} alt="2FA QR setup" className="w-36 h-36" />
                      ) : (
                        <div className="w-36 h-36 flex items-center justify-center font-mono text-xs text-bg-main font-bold">
                          GENERATING QR...
                        </div>
                      )}
                    </div>

                    <div className="w-full flex flex-col gap-1">
                      <span className="font-mono text-[8px] text-text-muted tracking-widest text-center">MANUAL SECRET KEY</span>
                      <div className="bg-bg-main border border-border-glass p-3 font-mono text-xs text-center font-bold tracking-wider text-white">
                        {tfaSecret}
                      </div>
                    </div>

                    <form onSubmit={handleVerify2FA} className="w-full flex flex-col gap-5">
                      <div className="flex flex-col gap-2">
                        <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Verify 6-digit Authenticator Code</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          className="w-full bg-transparent border border-border-glass focus:border-accent-cream outline-none p-3 font-mono text-center text-lg tracking-widest text-white transition-all duration-300"
                          value={tfaVerifyCode}
                          onChange={(e) => setTfaVerifyCode(e.target.value)}
                          required
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setTfaModalOpen(false)}
                          className="flex-1 border border-border-glass hover:border-accent-cream/50 bg-transparent text-text-muted hover:text-white font-mono text-[10px] tracking-widest uppercase py-3 transition-all duration-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-accent-cream hover:bg-white text-bg-main font-display text-[10px] tracking-widest uppercase py-3 transition-all duration-300 font-bold border border-accent-cream"
                        >
                          Verify Key
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL: Resolve Fraud Flags Review */}
            {activeResolveAlert && (
              <div className="fixed inset-0 w-full h-full bg-bg-main/90 z-[200] flex items-center justify-center p-6 backdrop-blur-sm">
                <div className="border border-border-glass p-8 md:p-10 w-full max-w-md bg-bg-surface relative flex flex-col gap-6 animate-slide-in">
                  <button
                    onClick={() => setActiveResolveAlert(null)}
                    className="absolute top-6 right-6 text-text-muted hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>

                  <div className="flex flex-col gap-1">
                    <h3 className="font-display font-black text-xl text-white">Clear Security Flag</h3>
                    <span className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Submit resolution review logs</span>
                  </div>

                  <form onSubmit={handleResolveAlert} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Resolution Action</label>
                      <select
                        className="w-full bg-bg-main border border-border-glass focus:border-accent-cream outline-none p-4 font-mono text-xs tracking-wide text-white transition-all duration-300 rounded-none cursor-pointer"
                        value={resolutionStatus}
                        onChange={(e) => setResolutionStatus(e.target.value)}
                      >
                        <option value="authorized">Authorize (I executed this transaction)</option>
                        <option value="unauthorized_refund">Unauthorized (Fraudulent - Terminate & Refund)</option>
                        <option value="false_alarm">False Alarm (Dismiss security flag)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-mono text-[9px] tracking-widest text-text-muted uppercase">Review Note Comments</label>
                      <textarea
                        placeholder="Provide details of this payment verification review..."
                        className="w-full bg-transparent border border-border-glass focus:border-accent-cream outline-none p-4 font-mono text-xs tracking-wide text-white transition-all duration-300 h-24 resize-none"
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex gap-4 mt-2">
                      <button
                        type="button"
                        onClick={() => setActiveResolveAlert(null)}
                        className="flex-1 border border-border-glass hover:border-accent-cream/50 bg-transparent text-text-muted hover:text-white font-mono text-[10px] tracking-widest uppercase py-3.5 transition-all duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-accent-cream hover:bg-white text-bg-main font-display text-[10px] tracking-widest uppercase py-3.5 transition-all duration-300 font-bold border border-accent-cream"
                      >
                        Clear Flag
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Ambient Footer Marquee for public view */}
            {!user && (
              <footer className="w-full border-t border-border-glass py-12 px-6 md:px-24 bg-bg-main overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 font-mono text-[9px] tracking-widest text-text-muted">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span>ALL SYSTEMS SECURE & OPERATIONAL</span>
                </div>
                <span>© 2026 FINTECH WALLET CLIENT OVERHAUL.</span>
              </footer>
            )}

          </PageTransition>
        </>
      )}
    </>
  );
}
