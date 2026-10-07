import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Layers,
  SquareDashedBottom,
  Users,
  Clock,
  Bell,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  TrendingUp,
  Activity,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [services, setServices] = useState([]);
  const [counters, setCounters] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [queuesList, setQueuesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal forms
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgForm, setOrgForm] = useState({
    name: '',
    category: 'Hospital',
    address: '',
    location: '',
    phone: '',
    email: '',
    opening_time: '09:00:00',
    closing_time: '18:00:00',
    status: 'OPEN'
  });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    organization_id: '',
    name: '',
    token_prefix: '',
    average_service_time: 15,
    max_capacity: 100,
    status: 'ACTIVE'
  });

  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterForm, setCounterForm] = useState({
    organization_id: '',
    service_id: '',
    staff_id: '',
    counter_name: '',
    status: 'OPEN'
  });

  const fetchOverview = async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        api('/admin/dashboard'),
        api('/admin/analytics')
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (analyticsRes.success) setAnalytics(analyticsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      const [orgsRes, countersRes, usersRes, queuesRes] = await Promise.all([
        api('/organizations'),
        api('/admin/counters'),
        api('/admin/users'),
        api('/admin/queues')
      ]);

      if (orgsRes.success) setOrganizations(orgsRes.organizations);
      if (countersRes.success) setCounters(countersRes.counters);
      if (usersRes.success) setUsersList(usersRes.users);
      if (queuesRes.success) setQueuesList(queuesRes.queues);

      // If orgs exist, fetch services of first org for service tab
      if (orgsRes.organizations?.length > 0) {
        const srvRes = await api(`/services/${orgsRes.organizations[0].id}`);
        if (srvRes.success) setServices(srvRes.services);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchAllData();
  }, []);

  // Handle Add Organization
  const handleCreateOrg = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/organizations', {
        method: 'POST',
        body: JSON.stringify(orgForm)
      });
      if (res.success) {
        showToast('Organization created successfully!', 'INFO');
        setShowOrgModal(false);
        fetchAllData();
        fetchOverview();
      }
    } catch (err) {
      alert(err.message || 'Error creating organization');
    }
  };

  // Handle Delete Organization
  const handleDeleteOrg = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? All services and queues will be deleted.`)) return;
    try {
      const res = await api(`/organizations/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast('Organization deleted.', 'INFO');
        fetchAllData();
      }
    } catch (err) {
      alert(err.message || 'Error deleting');
    }
  };

  // Handle Add Service
  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/services', {
        method: 'POST',
        body: JSON.stringify(serviceForm)
      });
      if (res.success) {
        showToast('Service created successfully!', 'INFO');
        setShowServiceModal(false);
        fetchAllData();
      }
    } catch (err) {
      alert(err.message || 'Error creating service');
    }
  };

  // Handle Add Counter
  const handleCreateCounter = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/admin/counters', {
        method: 'POST',
        body: JSON.stringify(counterForm)
      });
      if (res.success) {
        showToast('Counter created successfully!', 'INFO');
        setShowCounterModal(false);
        fetchAllData();
      }
    } catch (err) {
      alert(err.message || 'Error creating counter');
    }
  };

  // Handle Delete Counter
  const handleDeleteCounter = async (id) => {
    if (!window.confirm('Delete this counter?')) return;
    try {
      await api(`/admin/counters/${id}`, { method: 'DELETE' });
      showToast('Counter deleted.', 'INFO');
      fetchAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  const sidebarMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'services', label: 'Services', icon: Layers },
    { id: 'counters', label: 'Counters', icon: SquareDashedBottom },
    { id: 'users', label: 'Users & Staff', icon: Users },
    { id: 'queues', label: 'Live Queues', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* ADMIN SIDEBAR */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 p-5 shrink-0 flex flex-col justify-between border-r border-slate-800">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">
              QL
            </div>
            <div>
              <span className="font-black text-white text-base tracking-tight block">
                QueueLess Admin
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                System Command
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            {sidebarMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 px-2 text-[11px] text-slate-500">
          <p className="text-slate-400 font-semibold">{user?.name}</p>
          <p>admin@queueless.com</p>
        </div>
      </aside>

      {/* ADMIN MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8 overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight capitalize">
              {activeTab} Management
            </h1>
            <p className="text-xs text-slate-500">
              Universal system administrative controls and real-time operational monitor.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchOverview(); fetchAllData(); }}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* 1. OVERVIEW DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            
            {/* 7 Key Stats Quad */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Organizations</span>
                <p className="text-3xl font-black text-slate-900 mt-1">{stats?.totalOrganizations || 0}</p>
                <span className="text-[11px] text-emerald-600 font-semibold">{stats?.activeOrganizations || 0} currently active</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Customers</span>
                <p className="text-3xl font-black text-brand-600 mt-1">{stats?.totalCustomers || 0}</p>
                <span className="text-[11px] text-slate-500">{stats?.totalStaff || 0} Staff Members</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Queues Today</span>
                <p className="text-3xl font-black text-amber-600 mt-1">{stats?.activeQueues || 0}</p>
                <span className="text-[11px] text-slate-500">Waiting or in service</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Served Today</span>
                <p className="text-3xl font-black text-emerald-600 mt-1">{stats?.completedToday || 0}</p>
                <span className="text-[11px] text-slate-500">Avg wait: {stats?.avgWaitingTime || 15} mins</span>
              </div>

            </div>

            {/* Quick Chart Preview in Dashboard */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Customer Velocity & Completed Tokens (Last 7 Days)</h3>
                  <p className="text-xs text-slate-500">Trend of processed queue tokens across all organizations</p>
                </div>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="text-xs font-bold text-brand-600 hover:text-brand-800"
                >
                  View Full Analytics →
                </button>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.customersTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date_label" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tokens_completed" name="Tokens Served" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="avg_wait_min" name="Avg Wait (Mins)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Live Queue Tokens Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Real-time Tokens Stream (Today)</h3>
                  <p className="text-xs text-slate-500">Live feed of customers across organizations</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Token #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Organization & Service</th>
                      <th className="py-3 px-4">Joined At</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queuesList.slice(0, 8).map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-brand-600 text-sm">
                          {q.token_number}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">{q.user_name}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {q.org_name} — <span className="text-slate-500">{q.service_name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(q.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={q.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 2. ANALYTICS & CHARTS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Chart 1: Customer Volume Trend */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-1">Customers Processed Per Day</h3>
                <p className="text-xs text-slate-500 mb-6">Daily throughput of virtual queues</p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.customersTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date_label" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="tokens_completed" name="Tokens Served" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Peak Hours Distribution */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-1">Peak Queueing Hours</h3>
                <p className="text-xs text-slate-500 mb-6">Hourly volume of customers joining virtual queues</p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.peakHours || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip />
                      <Line type="monotone" dataKey="customers" name="Customers" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Most Popular Services */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-1">Most Popular Services</h3>
                <p className="text-xs text-slate-500 mb-6">Distribution of tokens across high-demand departments</p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.popularServices || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                      <YAxis type="category" dataKey="service_name" stroke="#94a3b8" fontSize={11} width={140} />
                      <Tooltip />
                      <Bar dataKey="total_tokens" name="Tokens" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Organization Usage Breakdown */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-1">Organization Category Distribution</h3>
                <p className="text-xs text-slate-500 mb-6">Relative volume across sector types</p>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.orgUsage || []}
                        dataKey="total_tokens"
                        nameKey="org_name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {analytics?.orgUsage?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 3. ORGANIZATIONS MANAGEMENT TAB */}
        {activeTab === 'organizations' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Registered Organizations</h3>
                <p className="text-xs text-slate-500">Add, edit, and configure universal institutions.</p>
              </div>
              <button
                onClick={() => setShowOrgModal(true)}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Add Organization
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Hours</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {organizations.map((org) => (
                      <tr key={org.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{org.name}</td>
                        <td className="py-3 px-4 text-slate-600">{org.category}</td>
                        <td className="py-3 px-4 text-slate-600">{org.location}</td>
                        <td className="py-3 px-4 text-slate-500">{org.opening_time.slice(0, 5)} - {org.closing_time.slice(0, 5)}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={org.status} />
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleDeleteOrg(org.id, org.name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. SERVICES MANAGEMENT TAB */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Service Queues Management</h3>
                <p className="text-xs text-slate-500">Configure token prefixes, capacities, and velocity.</p>
              </div>
              <button
                onClick={() => setShowServiceModal(true)}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Add Service
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((srv) => (
                <div key={srv.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                      Prefix: {srv.token_prefix}
                    </span>
                    <StatusBadge status={srv.status} />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">{srv.name}</h4>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>Avg Service Duration: <strong>{srv.average_service_time} mins</strong></p>
                    <p>Maximum Capacity: <strong>{srv.max_capacity} tokens/day</strong></p>
                    <p>Waiting Now: <strong>{srv.waiting_count} people</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. COUNTERS TAB */}
        {activeTab === 'counters' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Physical & Virtual Counters</h3>
                <p className="text-xs text-slate-500">Assign staff officers to designated service windows.</p>
              </div>
              <button
                onClick={() => setShowCounterModal(true)}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Add Counter
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Counter Name</th>
                      <th className="py-3 px-4">Organization</th>
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Assigned Staff</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {counters.map((cnt) => (
                      <tr key={cnt.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{cnt.counter_name}</td>
                        <td className="py-3 px-4 text-slate-600">{cnt.organization_name}</td>
                        <td className="py-3 px-4 text-slate-600">{cnt.service_name}</td>
                        <td className="py-3 px-4 text-slate-600">{cnt.staff_name || 'Unassigned'}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={cnt.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteCounter(cnt.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Registered Users & Staff</h3>
              <p className="text-xs text-slate-500">Full directory of active customers, staff, and admins.</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                        <td className="py-3 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3 px-4 text-slate-600">{u.phone || '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'STAFF'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={u.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 7. ALL LIVE QUEUES TAB */}
        {activeTab === 'queues' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Universal Live Queues Master Table</h3>
              <p className="text-xs text-slate-500">Live tokens across all services and organizations for today.</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Token #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Organization & Service</th>
                      <th className="py-3 px-4">Joined At</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queuesList.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-brand-600 text-sm">{q.token_number}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{q.user_name} ({q.user_email})</td>
                        <td className="py-3 px-4 text-slate-600">{q.org_name} — {q.service_name}</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(q.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-3 px-4"><StatusBadge status={q.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: ADD ORGANIZATION */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-4">Add New Organization</h3>
            <form onSubmit={handleCreateOrg} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro General Hospital"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={orgForm.category}
                    onChange={(e) => setOrgForm({ ...orgForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  >
                    {['Hospital', 'Bank', 'Restaurant', 'Government Office', 'College', 'Salon', 'Pharmacy', 'Diagnostic Center', 'Vehicle Service Center'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Location City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pollachi"
                    value={orgForm.location}
                    onChange={(e) => setOrgForm({ ...orgForm, location: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100 Main Road"
                  value={orgForm.address}
                  onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9876543210"
                    value={orgForm.phone}
                    onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="contact@org.com"
                    value={orgForm.email}
                    onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
                >
                  Create Organization
                </button>
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SERVICE */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-4">Add Service to Organization</h3>
            <form onSubmit={handleCreateService} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Organization</label>
                <select
                  required
                  value={serviceForm.organization_id}
                  onChange={(e) => setServiceForm({ ...serviceForm, organization_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  <option value="">Select Organization...</option>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blood Test & Pathology"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Token Prefix</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. L"
                    value={serviceForm.token_prefix}
                    onChange={(e) => setServiceForm({ ...serviceForm, token_prefix: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Avg Service Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={serviceForm.average_service_time}
                    onChange={(e) => setServiceForm({ ...serviceForm, average_service_time: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Daily Max Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={serviceForm.max_capacity}
                  onChange={(e) => setServiceForm({ ...serviceForm, max_capacity: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
                >
                  Add Service
                </button>
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD COUNTER */}
      {showCounterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-4">Create Service Counter</h3>
            <form onSubmit={handleCreateCounter} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Organization</label>
                <select
                  required
                  value={counterForm.organization_id}
                  onChange={(e) => setCounterForm({ ...counterForm, organization_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  <option value="">Select Organization...</option>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Associated Service</label>
                <select
                  required
                  value={counterForm.service_id}
                  onChange={(e) => setCounterForm({ ...counterForm, service_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  <option value="">Select Service...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.token_prefix})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Counter Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter 1 - Cashier Desk"
                  value={counterForm.counter_name}
                  onChange={(e) => setCounterForm({ ...counterForm, counter_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign Staff Officer (Optional)</label>
                <select
                  value={counterForm.staff_id}
                  onChange={(e) => setCounterForm({ ...counterForm, staff_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  <option value="">None (Unassigned)</option>
                  {usersList.filter(u => u.role === 'STAFF').map((st) => (
                    <option key={st.id} value={st.id}>{st.name} ({st.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
                >
                  Create Counter
                </button>
                <button
                  type="button"
                  onClick={() => setShowCounterModal(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
