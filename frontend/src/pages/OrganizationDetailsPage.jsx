import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { getSocket, joinServiceQueueRoom, leaveServiceQueueRoom } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  Hourglass, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Ticket
} from 'lucide-react';

export const OrganizationDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useNotification();

  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joiningServiceId, setJoiningServiceId] = useState(null);
  const [joinedModalData, setJoinedModalData] = useState(null);

  const fetchOrg = async () => {
    try {
      const res = await api(`/organizations/${id}`);
      if (res.success) {
        setOrganization(res.organization);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();

    const socket = getSocket();
    const handleGlobalQueueChange = () => {
      fetchOrg();
    };

    socket.on('global_queue_change', handleGlobalQueueChange);

    return () => {
      socket.off('global_queue_change', handleGlobalQueueChange);
    };
  }, [id]);

  const handleJoinQueue = async (service) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/organization/' + id);
      return;
    }

    setJoiningServiceId(service.id);
    try {
      const res = await api('/queue/join', {
        method: 'POST',
        body: JSON.stringify({ serviceId: service.id })
      });

      if (res.success) {
        setJoinedModalData({
          ...res.token,
          serviceName: service.name,
          orgName: organization.name
        });
        showToast(`Token ${res.token.token_number} generated successfully!`, 'QUEUE_JOINED');
        fetchOrg();
      }
    } catch (err) {
      alert(err.message || 'Could not join queue.');
    } finally {
      setJoiningServiceId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mb-4" />
        <p className="text-sm text-slate-500">Loading organization details & live services...</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Organization Not Found</h2>
        <Link to="/explore" className="mt-4 inline-block px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold">
          Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Organizations
        </Link>

        {/* Organization Hero Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-100">
                  {organization.category}
                </span>
                <StatusBadge status={organization.status} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {organization.name}
              </h1>
              <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                {organization.address}, {organization.location}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5 min-w-[240px]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>Hours: <strong>{organization.opening_time.slice(0, 5)} - {organization.closing_time.slice(0, 5)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-600" />
                <span>{organization.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-600" />
                <span>{organization.email}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Universal Virtual Queue Active</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Real-time Synchronized
            </span>
          </div>
        </div>

        {/* Available Services Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Available Services & Real-time Counters
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Select a service to view real-time serving tokens, line size, and receive your digital token.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organization.services?.map((srv) => (
              <div
                key={srv.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-brand-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Prefix: {srv.token_prefix}
                    </span>
                    <StatusBadge status={srv.status} />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mt-1">{srv.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Avg Service Time: ~{srv.average_service_time} mins
                  </p>

                  {/* Service Queue Stats */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 my-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Currently Serving:</span>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {srv.current_serving_token || 'None'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Waiting Ahead:</span>
                      <span className="font-bold text-slate-800">
                        {srv.waiting_count} people
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Estimated Wait:</span>
                      <span className="font-bold text-amber-600">
                        {srv.estimated_wait_minutes} mins
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleJoinQueue(srv)}
                  disabled={joiningServiceId === srv.id || srv.status !== 'ACTIVE' || organization.status === 'CLOSED'}
                  className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm ${
                    srv.status === 'ACTIVE' && organization.status !== 'CLOSED'
                      ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {joiningServiceId === srv.id ? (
                    'Generating Token...'
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" /> JOIN QUEUE
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* POPUP MODAL: QUEUE JOINED CONFIRMATION */}
      {joinedModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Queue Joined Successfully
            </span>

            <h3 className="text-xl font-black text-slate-900 mt-3">{joinedModalData.orgName}</h3>
            <p className="text-xs text-slate-500">{joinedModalData.serviceName}</p>

            {/* Big Digital Token Presentation Card */}
            <div className="my-6 p-5 bg-gradient-to-b from-brand-50 to-indigo-50/40 rounded-2xl border-2 border-dashed border-brand-300">
              <p className="text-xs uppercase font-bold text-brand-600 tracking-wider">Your Digital Token</p>
              <p className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight my-1">
                {joinedModalData.token_number}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <StatusBadge status={joinedModalData.status || 'WAITING'} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left bg-slate-50 p-3.5 rounded-xl text-xs mb-6 border border-slate-100">
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Currently Serving</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {joinedModalData.current_serving_token || 'None'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[10px]">People Ahead</span>
                <span className="font-bold text-slate-800 text-sm">
                  {joinedModalData.people_ahead} people
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Estimated Waiting:</span>
                <span className="font-bold text-amber-600 text-sm">
                  ~{joinedModalData.estimated_wait_minutes} minutes
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => navigate('/customer/dashboard')}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-sm"
              >
                VIEW LIVE QUEUE
              </button>
              <button
                onClick={() => setJoinedModalData(null)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
