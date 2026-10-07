import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Search, 
  MapPin, 
  Clock, 
  Building2, 
  Filter, 
  ArrowRight, 
  Users, 
  Hourglass,
  Layers
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Hospital',
  'Bank',
  'Restaurant',
  'Government Office',
  'College',
  'Salon',
  'Pharmacy',
  'Diagnostic Center',
  'Vehicle Service Center',
  'Customer Service Center'
];

export const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || 'All');

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedLocation && selectedLocation !== 'All') params.append('location', selectedLocation);

      const res = await api(`/organizations?${params.toString()}`);
      if (res.success) {
        setOrganizations(res.organizations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, [selectedCategory, selectedLocation]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrgs();
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" /> Universal Directory
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Browse Organizations & Services
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Choose a location, select your desired department, and join the virtual queue in seconds.
          </p>
        </div>

        {/* Global Search and Filter Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm mb-8 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by organization name, service or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Quick Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Organization Listing Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-64" />
            ))}
          </div>
        ) : organizations.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-md mx-auto">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No organizations found</h3>
            <p className="text-xs text-slate-500 mt-1">Try relaxing your search terms or category filters.</p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchTerm(''); }}
              className="mt-4 px-4 py-2 text-xs font-bold text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                <div className="p-6">
                  {/* Category & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-100">
                      {org.category}
                    </span>
                    <StatusBadge status={org.status} />
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {org.name}
                  </h3>

                  {/* Location & Address */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{org.location} — {org.address}</span>
                  </div>

                  {/* Timing */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{org.opening_time.slice(0, 5)} - {org.closing_time.slice(0, 5)} hrs</span>
                  </div>

                  {/* Live Queue Stat Badges */}
                  <div className="grid grid-cols-2 gap-2 mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Queue</p>
                      <p className="text-lg font-black text-slate-900 mt-0.5 flex items-center justify-center gap-1">
                        <Users className="w-4 h-4 text-brand-500" />
                        {org.current_queue_size} <span className="text-xs font-normal text-slate-500">people</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estimated Wait</p>
                      <p className="text-lg font-black text-amber-600 mt-0.5 flex items-center justify-center gap-1">
                        <Hourglass className="w-4 h-4 text-amber-500" />
                        {org.estimated_wait_minutes} <span className="text-xs font-normal text-slate-500">min</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    {org.active_services_count} Service(s)
                  </span>
                  <Link
                    to={`/organization/${org.id}`}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition"
                  >
                    VIEW SERVICES
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
