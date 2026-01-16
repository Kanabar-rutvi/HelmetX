import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HardHat, Lock, Mail, ArrowRight, Activity, IdCard } from 'lucide-react';
import api from '../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useOtp, setUseOtp] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data } = await api.post('/auth/login', { email, employeeId, password });
      login(data.token, data);
      
      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'supervisor') navigate('/supervisor');
      else navigate('/worker');
      
    } catch (err: unknown) {
      const msg = (typeof err === 'object' && err && 'response' in err && (err as { response?: { data?: { message?: string } } }).response?.data?.message)
        || (err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    setError('');
    try {
      await api.post('/auth/request-otp', { email, employeeId });
      setOtpRequested(true);
    } catch (e: unknown) {
      const msg = (typeof e === 'object' && e && 'response' in e && (e as { response?: { data?: { message?: string } } }).response?.data?.message)
        || (e instanceof Error ? e.message : 'Failed to request OTP');
      setError(msg);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { email, employeeId, otp });
      login(data.token, data);
      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'supervisor') navigate('/supervisor');
      else navigate('/worker');
    } catch (e: unknown) {
      const msg = (typeof e === 'object' && e && 'response' in e && (e as { response?: { data?: { message?: string } } }).response?.data?.message)
        || (e instanceof Error ? e.message : 'Invalid OTP');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600 opacity-20 pattern-grid-lg"></div>
        <div className="z-10">
          <div className="flex items-center gap-3 mb-8">
             <div className="bg-blue-500 p-3 rounded-lg">
                <HardHat size={40} className="text-white" />
             </div>
             <h1 className="text-4xl font-bold">Smart Safety Helmet</h1>
          </div>
          <h2 className="text-3xl font-light mb-6">Next-Gen Industrial Safety Platform</h2>
          <div className="space-y-4 text-slate-300 max-w-lg">
             <div className="flex items-center gap-3">
                <Activity className="text-blue-400" /> 
                <span>Real-time health & environment monitoring</span>
             </div>
             <div className="flex items-center gap-3">
                <Lock className="text-blue-400" /> 
                <span>Secure role-based access control</span>
             </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
             <HardHat size={48} className="mx-auto text-blue-600 mb-2" />
             <h2 className="text-2xl font-bold text-gray-900">Smart Helmet</h2>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h3>
            <p className="text-gray-500 mb-6">Please sign in to your account</p>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 text-sm rounded-r">
                {error}
              </div>
            )}

            {!useOtp ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Employee ID (optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IdCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="W001"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
            ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Email or Employee ID</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="name@company.com"
                  />
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="W001"
                  />
                </div>
              </div>
              {!otpRequested ? (
                <button
                  type="button"
                  onClick={requestOtp}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                  Send OTP
                </button>
              ) : (
                <>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter 6-digit OTP"
                  />
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-70"
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                </>
              )}
            </div>
            )}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setUseOtp(!useOtp)}
                className="text-sm text-blue-600 hover:underline"
              >
                {useOtp ? 'Use Password Login' : 'Use OTP Login'}
              </button>
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-500">
               <p>Demo Credentials:</p>
               <div className="mt-2 space-y-1 text-xs">
                 <div className="bg-gray-100 px-2 py-1 rounded inline-block">admin@example.com (Admin)</div>
                 <div className="bg-gray-100 px-2 py-1 rounded inline-block">worker1@example.com (Worker)</div>
               </div>
               <div className="mt-1 text-xs">Password: password123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
