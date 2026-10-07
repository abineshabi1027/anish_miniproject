import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { 
  History, 
  Clock, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  ArrowLeft
} from 'lucide-react';

export const QueueHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api('/queue/my-history');
        if (res.success) {
          setHistory(res.history);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              to="/customer/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 mb-2 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Queue History
            </h1>
            <p className="text-xs text-slate-500">
              Detailed chronological record of past tokens, wait durations, and service outcomes.
            </p>
          </div>
        </div>

        {/* Table / Cards */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center animate-pulse">
            Loading past queue records...
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center max-w-md mx-auto">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 text-lg">No past queue history yet</h3>
            <p className="text-xs text-slate-500 mt-1">Once you complete or cancel virtual tokens, they will appear here.</p>
            <Link
              to="/explore"
              className="mt-4 inline-block px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl"
            >
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Token #</th>
                    <th className="py-3.5 px-4">Organization & Service</th>
                    <th className="py-3.5 px-4">Counter / Desk</th>
                    <th className="py-3.5 px-4">Joined Time</th>
                    <th className="py-3.5 px-4">Completed / Left</th>
                    <th className="py-3.5 px-4">Wait Duration</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-600 text-sm">
                        {row.token_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{row.organization_name}</div>
                        <div className="text-[11px] text-slate-500">{row.service_name} • {row.organization_location}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {row.counter_name || 'Desk 1'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(row.joined_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {row.completed_at
                          ? new Date(row.completed_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {row.waiting_minutes > 0 ? `${row.waiting_minutes} mins` : '< 5 mins'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
