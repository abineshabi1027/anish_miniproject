import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getSocket, joinServiceQueueRoom, leaveServiceQueueRoom } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Users, 
  PhoneCall, 
  CheckCircle, 
  SkipForward, 
  PauseCircle, 
  PlayCircle, 
  XCircle, 
  Clock, 
  Building2, 
  Radio, 
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [assignment, setAssignment] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [queueState, setQueueState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch initial staff counter and assigned service
  const fetchStaffData = async () => {
    try {
      const res = await api('/queue/staff/assignment');
      if (res.success) {
        setAssignment(res);
        if (!selectedServiceId) {
          setSelectedServiceId(res.assignedServiceId || (res.allServices?.[0]?.id));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceQueue = async (srvId) => {
    if (!srvId) return;
    try {
      const res = await api(`/queue/service/${srvId}`);
      if (res.success) {
        setQueueState(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  useEffect(() => {
    if (selectedServiceId) {
      fetchServiceQueue(selectedServiceId);
      joinServiceQueueRoom(selectedServiceId);

      const socket = getSocket();
      const handleStaffUpdate = (data) => {
        fetchServiceQueue(selectedServiceId);
      };

      socket.on('staff_queue_updated', handleStaffUpdate);
      socket.on('queue_updated', handleStaffUpdate);

      return () => {
        leaveServiceQueueRoom(selectedServiceId);
        socket.off('staff_queue_updated', handleStaffUpdate);
        socket.off('queue_updated', handleStaffUpdate);
      };
    }
  }, [selectedServiceId]);

  // Action: CALL NEXT
  const handleCallNext = async () => {
    setActionLoading(true);
    try {
      const res = await api('/queue/call-next', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: selectedServiceId,
          counterId: assignment?.assignedCounter?.id || null
        })
      });

      if (res.success) {
        showToast(`Token ${res.calledToken.token_number} called to your desk!`, 'TOKEN_CALLED');
        setQueueState(res.queueState);
      }
    } catch (err) {
      alert(err.message || 'Error calling next token');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: COMPLETE
  const handleComplete = async () => {
    setActionLoading(true);
    try {
      const res = await api('/queue/complete', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: selectedServiceId
        })
      });

      if (res.success) {
        showToast('Current customer visit completed.', 'QUEUE_COMPLETED');
        setQueueState(res.queueState);
      }
    } catch (err) {
      alert(err.message || 'Error completing token');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: SKIP
  const handleSkip = async () => {
    if (!window.confirm('Mark currently serving token as SKIPPED (absent)?')) return;
    setActionLoading(true);
    try {
      const res = await api('/queue/skip', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: selectedServiceId
        })
      });

      if (res.success) {
        showToast('Token skipped.', 'INFO');
        setQueueState(res.queueState);
      }
    } catch (err) {
      alert(err.message || 'Error skipping token');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: HOLD
  const handleHold = async () => {
    setActionLoading(true);
    try {
      const res = await api('/queue/hold', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: selectedServiceId
        })
      });

      if (res.success) {
        showToast('Token placed on hold.', 'ON_HOLD');
        setQueueState(res.queueState);
      }
    } catch (err) {
      alert(err.message || 'Error holding token');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: RESUME ON-HOLD TOKEN
  const handleResume = async (tokenId) => {
    setActionLoading(true);
    try {
      const res = await api('/queue/resume', {
        method: 'POST',
        body: JSON.stringify({
          tokenId,
          serviceId: selectedServiceId
        })
      });

      if (res.success) {
        showToast('Token resumed and placed back into active queue.', 'INFO');
        setQueueState(res.queueState);
      }
    } catch (err) {
      alert(err.message || 'Error resuming token');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: CANCEL SPECIFIC TOKEN
  const handleCancel = async (tokenId) => {
    const reason = window.prompt('Enter cancellation reason (e.g. Ineligible documents / Client request):');
    if (reason === null) return;

    setActionLoading(true);
    try {
      const res = await api('/queue/cancel', {
        method: 'POST',
        body: JSON.stringify({
          tokenId,
          serviceId: selectedServiceId,
          reason
        })
      });

      if (res.success) {
        showToast('Token cancelled.', 'QUEUE_CANCELLED');
        setQueueState(res.queueState);
      }
    } catch (err) {
      alert(err.message || 'Error cancelling token');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mb-4" />
        <p className="text-sm text-slate-500">Loading Staff Calling Desk...</p>
      </div>
    );
  }

  const currentServing = queueState?.currentServing;
  const waitingList = queueState?.waitingList?.filter(t => t.status !== 'ON_HOLD') || [];
  const onHoldList = queueState?.onHoldList || [];
  const nextToken = queueState?.nextToken;

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Control Bar & Service Switcher */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                Staff Counter Station
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-brand-600">
                <Radio className="w-3.5 h-3.5 text-brand-600 animate-pulse" /> Live Socket Calling Desk
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Officer: {user?.name}
            </h1>
            <p className="text-xs text-slate-500">
              Counter: <strong>{assignment?.assignedCounter?.counter_name || 'General Counter #1'}</strong>
            </p>
          </div>

          {/* Switch Active Queue / Service */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
              Assigned Service:
            </span>
            <select
              value={selectedServiceId || ''}
              onChange={(e) => setSelectedServiceId(Number(e.target.value))}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {assignment?.allServices?.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.organization_name} — {srv.name} ({srv.token_prefix})
                </option>
              ))}
            </select>

            <button
              onClick={() => fetchServiceQueue(selectedServiceId)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
              title="Refresh queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CURRENT SERVING & ACTION COMMAND CENTER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Calling Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  Current Token Station
                </span>
                <h2 className="text-xl font-bold mt-2 text-white">
                  {queueState?.service?.name || 'Service Queue'}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Waiting In Line</span>
                <span className="text-2xl font-black text-amber-400">
                  {queueState?.waitingCount || 0}
                </span>
              </div>
            </div>

            {/* Serving Token Banner */}
            <div className="py-8 text-center">
              {currentServing ? (
                <div className="space-y-3">
                  <p className="text-xs uppercase font-bold tracking-widest text-emerald-400 animate-pulse">
                    CURRENTLY AT YOUR COUNTER
                  </p>
                  <p className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white">
                    {currentServing.token_number}
                  </p>
                  <div className="text-sm font-semibold text-slate-300">
                    Customer: <strong className="text-white">{currentServing.user_name}</strong>
                  </div>
                  <div className="inline-block">
                    <StatusBadge status={currentServing.status} />
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-2">
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Counter Idle</p>
                  <p className="text-4xl sm:text-5xl font-black text-slate-600 font-mono">---</p>
                  <p className="text-xs text-slate-400">No customer is currently called. Click "CALL NEXT" to begin.</p>
                </div>
              )}
            </div>

            {/* STAFF CONTROL BUTTONS */}
            <div className="pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              {/* CALL NEXT */}
              <button
                onClick={handleCallNext}
                disabled={actionLoading || waitingList.length === 0}
                className={`py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg ${
                  waitingList.length > 0 && !actionLoading
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <PhoneCall className="w-4 h-4" />
                CALL NEXT
              </button>

              {/* COMPLETE */}
              <button
                onClick={handleComplete}
                disabled={actionLoading || !currentServing}
                className={`py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg ${
                  currentServing && !actionLoading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                COMPLETE
              </button>

              {/* HOLD */}
              <button
                onClick={handleHold}
                disabled={actionLoading || !currentServing}
                className={`py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                  currentServing && !actionLoading
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <PauseCircle className="w-4 h-4" />
                HOLD
              </button>

              {/* SKIP */}
              <button
                onClick={handleSkip}
                disabled={actionLoading || !currentServing}
                className={`py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                  currentServing && !actionLoading
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <SkipForward className="w-4 h-4" />
                SKIP
              </button>

            </div>
          </div>

          {/* Quick Metrics Column */}
          <div className="space-y-4">
            
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Upcoming Token</span>
              <p className="text-3xl font-black text-indigo-600 font-mono mt-1">
                {nextToken ? nextToken.token_number : 'None'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {nextToken ? `Next customer: ${nextToken.user_name}` : 'Queue is empty'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Served Today</span>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {queueState?.completedToday || 0}
              </p>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Handled successfully today
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Service Velocity</span>
              <p className="text-3xl font-black text-amber-600 mt-1">
                ~{queueState?.service?.average_service_time || 15} <span className="text-sm font-normal text-slate-500">min/person</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">Total wait in line: ~{queueState?.estimatedWaitMinutes || 0} mins</p>
            </div>

          </div>

        </div>

        {/* ACTIVE WAITING QUEUE TABLE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Active Waiting Line</h3>
                <p className="text-xs text-slate-400">{waitingList.length} customer(s) queued</p>
              </div>
              <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                Service Prefix: {queueState?.service?.token_prefix}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Pos</th>
                    <th className="py-3 px-4">Token #</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Joined At</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitingList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No customers currently waiting in line.
                      </td>
                    </tr>
                  ) : (
                    waitingList.map((tok, idx) => (
                      <tr key={tok.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-500">#{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-brand-600 text-sm">
                          {tok.token_number}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">{tok.user_name}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(tok.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={tok.status} />
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => handleCancel(tok.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ON-HOLD CUSTOMERS LIST */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <PauseCircle className="w-4 h-4 text-amber-500" /> On-Hold Customers
                </h3>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {onHoldList.length}
                </span>
              </div>

              {onHoldList.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No customers on hold.
                </p>
              ) : (
                <div className="space-y-3">
                  {onHoldList.map((tok) => (
                    <div
                      key={tok.id}
                      className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-amber-800 text-sm">
                            {tok.token_number}
                          </span>
                          <span className="text-[10px] text-amber-600">On Hold</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium">{tok.user_name}</p>
                      </div>

                      <button
                        onClick={() => handleResume(tok.id)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Resume
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
              Holding allows customers to temporarily step away and resume without losing place in queue.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
