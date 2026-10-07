import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Heart, Shield, Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Queue<span className="text-brand-500">Less</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Universal multi-service virtual queue management platform designed to eliminate physical waiting lines across hospitals, banks, restaurants, government offices, and commercial institutions.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-400">
              <Sparkles className="w-4 h-4" /> Real-time Socket.IO Synchronized
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Supported Sectors</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/explore?category=Hospital" className="hover:text-white transition">Hospitals & Clinics</Link></li>
              <li><Link to="/explore?category=Bank" className="hover:text-white transition">Banks & Finance</Link></li>
              <li><Link to="/explore?category=Restaurant" className="hover:text-white transition">Restaurants & Cafes</Link></li>
              <li><Link to="/explore?category=Government Office" className="hover:text-white transition">Government Services</Link></li>
              <li><Link to="/explore?category=College" className="hover:text-white transition">Colleges & Universities</Link></li>
              <li><Link to="/explore?category=Vehicle Service Center" className="hover:text-white transition">Vehicle & Tech Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Platform Roles</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/login" className="hover:text-white transition">Customer Portal</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Staff Calling Desk</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Organization Admin Panel</Link></li>
              <li><Link to="/explore" className="hover:text-white transition">Live Public Queue Explorer</Link></li>
            </ul>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-400" /> College Project Demo
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fully functional MySQL + Express + React + Socket.IO project with production-grade architecture.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              Demo logins: <span className="text-brand-300 font-mono">admin@queueless.com</span> / <span className="text-brand-300 font-mono">staff@queueless.com</span> / <span className="text-brand-300 font-mono">user@queueless.com</span>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 QueueLess Universal System. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with modern React, Tailwind CSS, Node.js & MySQL.
          </p>
        </div>
      </div>
    </footer>
  );
};
