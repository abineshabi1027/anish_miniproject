import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getSocket, joinServiceQueueRoom, leaveServiceQueueRoom } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Clock, 
  Users, 
  Hourglass, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  XCircle, 
  Building2,
  BellRing,
  HelpCircle,
  Radio
} from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [activeTokens, setActiveTokens] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [leavingTokenId, setLeavingTokenId] = useState(null);

  const fetchActiveQueues = async () => {
    try {
      const res = await api('/queue/my-active');
      if (res.success) {
        setActiveTokens(res.activeTokens || []);
        setCompletedCount(res.completedVisits || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveQueues();

    const socket = getSocket();

    // Listen to real-time queue updates
    const handleQueueUpdated = (data) => {
      fetchActiveQueues();
    };

    socket.on('queue_updated', handleQueueUpdated);
    socket.on('global_queue_change', handleQueueUpdated);

    return () => {
      socket.off('queue_updated', handleQueueUpdated);
      socket.off('global_queue_change', handleQueueUpdated);
    };
  }, []);

  // Subscribe to service rooms for all active tickets
  useEffect(() => {
    activeTokens.forEach((tok) => {
      joinServiceQueueRoom(tok.service_id);
    });

    return () => {
      activeTokens.forEach((tok) => {
        leaveServiceQueueRoom(tok.service_id);
      });
    };
  }, [activeTokens]);

  const handleLeaveQueue = async (tokenId, tokenNumber) => {
    if (!window.confirm(`Are you sure you want to leave queue for Token ${tokenNumber}?`)) {
      return;
    }

    setLeavingTokenId(tokenId);
    try {
      const res = await api(`/queue/${tokenId}/leave`, { method: 'POST' });
      if (res.success) {
        showToast(res.message, 'QUEUE_CANCELLED');
        fetchActiveQueues();
      }
    } catch (err) {
      alert(err.message || 'Failed to leave queue.');
    } finally {
      setLeavingTokenId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mb-4" />
        <p className="text-sm text-slate-500">Loading your active queues...</p>
      </div>
    );
  }

  const primaryToken = activeTokens.length > 0 ? activeTokens[0] : null;

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded border border-brand-200">
                Customer Live Dashboard
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" /> Live Synchronized
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-xs text-slate-500">
              Real-time monitor for your virtual tokens across all public & private services.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/explore"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-brand-500/20 flex items-center gap-1.5 transition"
            >
              <Building2 className="w-4 h-4" /> Join Another Queue
            </Link>
            <Link
              to="/customer/history"
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition"
            >
              Queue History
            </Link>
          </div>
        </div>

        {/* PRIMARY ACTIVE TOKEN HERO HIGHLIGHT */}
        {primaryToken ? (
          <div className={`rounded-3xl p-6 sm:p-8 border shadow-xl relative overflow-hidden transition-all ${
            primaryToken.status === 'SERVING'
              ? 'bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white border-emerald-500 animate-attention'
              : primaryToken.status === 'NEAR_TURN'
              ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 text-white border-indigo-400'
              : 'bg-white text-slate-900 border-slate-200/90 shadow-slate-200/50'
          }`}>
            
            {/* Turn approaching banner */}
            {primaryToken.status === 'SERVING' && (
              <div className="mb-4 bg-emerald-500 text-white px-4 py-2 rounded-xl text-center font-black tracking-wide text-sm flex items-center justify-center gap-2 shadow-lg animate-pulse">
                <BellRing className="w-5 h-5" /> YOUR TURN NOW! PROCEED TO COUNTER: {primaryToken.current_serving_counter || 'Assigned Desk'}
              </div>
            )}

            {primaryToken.status === 'NEAR_TURN' && (
              <div className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-2 shadow">
                <Sparkles className="w-4 h-4" /> Your turn is approaching! Only {primaryToken.people_ahead} person(s) ahead.
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/20">
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                  primaryToken.status === 'SERVING' || primaryToken.status === 'NEAR_TURN'
                    ? 'bg-white/10 text-white border-white/20'
                    : 'bg-brand-50 text-brand-600 border-brand-100'
                }`}>
                  {primaryToken.organization_category}
                </span>

                <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                  {primaryToken.organization_name}
                </h2>
                <p className={`text-sm mt-0.5 ${
                  primaryToken.status === 'SERVING' || primaryToken.status === 'NEAR_TURN' ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Service: <strong className="font-semibold">{primaryToken.service_name}</strong>
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <StatusBadge status={primaryToken.status} />
                <button
                  onClick={() => handleLeaveQueue(primaryToken.id, primaryToken.token_number)}
                  disabled={leavingTokenId === primaryToken.id}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1 ${
                    primaryToken.status === 'SERVING' || primaryToken.status === 'NEAR_TURN'
                      ? 'border-rose-400/40 text-rose-300 hover:bg-rose-500/20'
                      : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {leavingTokenId === primaryToken.id ? 'Leaving...' : 'Leave Queue'}
                </button>
              </div>
            </div>

            {/* Live Metrics Quad */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
              
              {/* Token Number */}
              <div className={`p-4 rounded-2xl border ${
                primaryToken.status === 'SERVING' || primaryToken.status === 'NEAR_TURN'
                  ? 'bg-white/5 border-white/10'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Your Active Token</p>
                <p className="text-4xl font-black font-mono mt-1 text-brand-500">
                  {primaryToken.token_number}
                </p>
                <span className="text-[10px] opacity-60">Sequence #{primaryToken.sequence_num}</span>
              </div>

              {/* Currently Serving */}
              <div className={`p-4 rounded-2xl border ${
                primaryToken.status === 'SERVING' || primaryToken.status === 'NEAR_TURN'
                  ? 'bg-white/5 border-white/10'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Currently Serving</p>
                <p className="text-4xl font-black font-mono mt-1 text-emerald-500">
                  {primaryToken.current_serving_token || 'None'}
                </p>
                <span className="text-[10px] opacity-60">At Service Counter</span>
              </div>

              {/* People Ahead */}
              <div className={`p-4 rounded-2xl border ${
                primaryToken.status === 'SERVING' || primaryToken.status === 'NEAR_TURN'
                  ? 'bg-white/5 border-white/10'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">People Ahead</p>
                <p className="text-4xl font-black font-mono mt-1 text-amber-500">
                  {primaryToken.people_ahead}
                </p>
                <span className="text-[10px] opacity-60">Customers before you</span>
              </div>

              {/* Estimated Wait Time */}
              <div className={`p-4 rounded-2xl border ${
                primaryToken.status === 'SERVING' || primaryToken.status === 'NEAR_TURN'
                  ? 'bg-white/5 border-white/10'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Estimated Wait</p>
                <p className="text-4xl font-black font-mono mt-1 text-indigo-500">
                  {primaryToken.estimated_wait_minutes} <span className="text-xs font-normal">min</span>
                </p>
                <span className="text-[10px] opacity-60">Based on live velocity</span>
              </div>

            </div>

          </div>
        ) : (
          /* Empty Active Queue State */
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm max-w-xl mx-auto">
            <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-3xl mx-auto flex items-center justify-center mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No Active Virtual Queue</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
              You are currently not waiting in any virtual line. Browse hospitals, banks, restaurants or government services to join now.
            </p>
            <Link
              to="/explore"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Browse Organizations <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Multiple Active Queues (if user joined more than 1 service) */}
        {activeTokens.length > 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Other Active Tokens ({activeTokens.length - 1})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTokens.slice(1).map((tok) => (
                <div key={tok.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                        {tok.token_number}
                      </span>
                      <StatusBadge status={tok.status} />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{tok.organization_name}</h4>
                    <p className="text-xs text-slate-500">{tok.service_name} • Ahead: {tok.people_ahead} • Est: {tok.estimated_wait_minutes} min</p>
                  </div>
                  <button
                    onClick={() => handleLeaveQueue(tok.id, tok.token_number)}
                    className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition"
                  >
                    Leave
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Completed Visits</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{completedCount}</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Tokens successfully served
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Average Wait Saved</p>
            <p className="text-3xl font-black text-brand-600 mt-2">35 <span className="text-sm font-normal text-slate-500">mins/visit</span></p>
            <p className="text-xs text-slate-500 mt-1">Virtual line vs physical queueing</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Quick Actions</p>
            <div className="mt-3 flex gap-2">
              <Link
                to="/explore"
                className="flex-1 py-2 text-center text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                Find Services
              </Link>
              <Link
                to="/customer/history"
                className="flex-1 py-2 text-center text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                View History
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
