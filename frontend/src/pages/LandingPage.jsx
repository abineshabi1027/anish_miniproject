import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  ArrowRight, 
  Users, 
  ShieldCheck, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  Landmark, 
  UtensilsCrossed, 
  GraduationCap, 
  Scissors, 
  Pill, 
  Wrench, 
  ChevronRight,
  TrendingDown,
  BellRing,
  HelpCircle
} from 'lucide-react';

const supportedCategories = [
  { name: 'Hospitals & Clinics', icon: Building2, desc: 'Doctors, labs, pharmacy counters with automated triage', count: '4 Departments', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { name: 'Banks & Financial', icon: Landmark, desc: 'Cash counters, loan desks, KYC verification lines', count: '3 Counters', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { name: 'Restaurants & Dining', icon: UtensilsCrossed, desc: 'Table waitlists, party reservations, pickup orders', count: 'Instant SMS', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { name: 'Government Offices', icon: ShieldCheck, desc: 'Aadhaar updates, revenue licenses, civil counters', count: 'Zero Chaos', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { name: 'Colleges & Universities', icon: GraduationCap, desc: 'Admissions, fee verification, certificate distribution', count: 'Fast Pass', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { name: 'Salons & Spas', icon: Scissors, desc: 'Hairstyling, treatments with live queue tracking', count: 'Relax Anywhere', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { name: 'Pharmacies', icon: Pill, desc: 'Prescription fulfillment and drug dispensation', count: 'Speed Dispense', color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { name: 'Vehicle Service Centers', icon: Wrench, desc: 'Periodic maintenance, express diagnostics & delivery', count: 'Status Tracker', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
];

const faqs = [
  { q: 'How does virtual queueing work for customers?', a: 'You simply select an organization and service on QueueLess, click "Join Queue", and receive a unique digital token. You can view your real-time position and estimated wait time without standing in line.' },
  { q: 'How do tokens update in real-time without refreshing?', a: 'QueueLess utilizes bi-directional Socket.IO connections. When staff calls or completes a token, all customer screens update instantaneously within milliseconds.' },
  { q: 'Can organizations run multiple counters and services?', a: 'Yes! QueueLess is universal and multi-service. A hospital can simultaneously manage General OPD, Lab, and Pharmacy with separate counters and staff members.' },
  { q: 'How does the system calculate waiting times?', a: 'The waiting time is dynamically computed based on the number of waiting customers ahead multiplied by the average service time configured for that specific service.' }
];

export const LandingPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  return (
    <div className="bg-slate-50 min-h-screen">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/70 via-slate-50 to-slate-50 -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-bold tracking-wide uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Universal Virtual Queue Management Platform
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              SKIP THE LINE. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600">
                JOIN THE QUEUE DIGITALLY.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              QueueLess helps you save valuable hours by joining virtual queues from anywhere. Get live digital tokens, track exact wait times, and arrive precisely when it's your turn.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                to="/explore"
                className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition group"
              >
                JOIN A QUEUE NOW
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/explore"
                className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition"
              >
                EXPLORE SERVICES
              </Link>
            </div>

            {/* Quick Demo Credentials Reminder Banner */}
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 shadow-sm backdrop-blur text-xs text-slate-600 flex flex-wrap items-center justify-center gap-4 mt-6">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-slate-100 px-2.5 py-1 rounded-md">
                Try Demo Accounts:
              </span>
              <span><strong className="text-brand-600">Admin:</strong> admin@queueless.com (admin123)</span>
              <span><strong className="text-emerald-600">Staff:</strong> staff@queueless.com (staff123)</span>
              <span><strong className="text-indigo-600">Customer:</strong> user@queueless.com (user123)</span>
            </div>

          </div>

          {/* Interactive Live Queue Preview Mockup */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="bg-slate-900 rounded-3xl p-4 sm:p-7 shadow-2xl border border-slate-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <h3 className="font-bold text-base text-white">ABC City Hospital — OPD General</h3>
                    <p className="text-xs text-slate-400">Live Socket.IO Real-time Stream</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                    Live Active Queue
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6">
                <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/60">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Serving Token</p>
                  <p className="text-3xl font-black text-emerald-400 mt-1">H-003</p>
                  <span className="text-[10px] text-slate-400">Doctor Chamber 1</span>
                </div>

                <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/60">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Next Token</p>
                  <p className="text-3xl font-black text-indigo-400 mt-1">H-004</p>
                  <span className="text-[10px] text-indigo-300">Turn Approaching</span>
                </div>

                <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/60">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">People Ahead</p>
                  <p className="text-3xl font-black text-amber-400 mt-1">2</p>
                  <span className="text-[10px] text-slate-400">Moving Smoothly</span>
                </div>

                <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/60">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Est. Wait Time</p>
                  <p className="text-3xl font-black text-white mt-1">15 <span className="text-sm font-normal text-slate-400">min</span></p>
                  <span className="text-[10px] text-slate-400">Avg 10 min/person</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Zero page refresh required
                </span>
                <Link to="/explore" className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1">
                  Browse All Live Queues <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Statistics Bar */}
      <section className="bg-white border-y border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-brand-600 tracking-tight">100%</p>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">Virtual Line Elimination</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">11+</p>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">Supported Public Sectors</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">&lt; 100ms</p>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">Socket.IO Live Broadcasts</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-indigo-600 tracking-tight">35 min</p>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">Average Wait Time Saved</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">Simple 3-Step Process</h2>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">How QueueLess Works</p>
          <p className="text-slate-600 text-sm mt-2">Effortless for customers, seamless and organized for organization staff.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 font-black text-xl flex items-center justify-center mb-6">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Find & Pick Service</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Explore verified organizations in your city. Filter by Hospital, Bank, Restaurant, or Government center and view live queue load.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 font-black text-xl flex items-center justify-center mb-6">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Receive Digital Token</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Click "Join Queue". You immediately get a distinct sequential token (e.g. H-024) with estimated wait time and people ahead.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 font-black text-xl flex items-center justify-center mb-6">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Track & Walk Right In</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Track live queue updates in real-time. Receive instant notifications when your turn approaches and proceed directly to your assigned counter.
            </p>
          </div>

        </div>
      </section>

      {/* Supported Places Grid */}
      <section className="bg-slate-100/70 py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">Universal Versatility</h2>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">Supported Places & Sectors</p>
            <p className="text-slate-600 text-sm mt-2">The exact same platform powers line-management across dozens of industries.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportedCategories.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  to={`/explore?category=${encodeURIComponent(item.name.split(' ')[0])}`}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-lg transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 ${item.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600">
                    <span>{item.count}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why QueueLess Features */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">Why QueueLess</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Designed for Speed, Fair Ordering, and High Service Efficiency
            </h3>
            <p className="text-slate-600 text-sm mt-4 leading-relaxed">
              Physical crowds breed frustration, congestion, and lost revenue. QueueLess transforms traditional queues into digital streams with precision tracking.
            </p>

            <div className="space-y-4 mt-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Drastically Reduces Physical Crowding</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Customers can wait at home, a cafe, or parked in their car until their token is called.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Proactive Turn Approaching Alerts</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Automatic NEAR_TURN status and notifications trigger when only 2 people remain ahead.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Concurrency & Duplicate Protection</h4>
                  <p className="text-xs text-slate-500 mt-0.5">MySQL transaction guarantees prevent double-issued tokens and enforce daily reset cycles.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-brand-600 to-indigo-700 p-8 sm:p-12 rounded-3xl text-white shadow-xl shadow-brand-500/20">
            <h4 className="text-2xl font-bold tracking-tight mb-4">Ready to experience queue-free life?</h4>
            <p className="text-brand-100 text-sm leading-relaxed mb-8">
              Join thousands of happy users saving precious time every day. Start now by exploring available services in your area.
            </p>
            <div className="space-y-3">
              <Link
                to="/explore"
                className="w-full py-3.5 bg-white text-brand-700 hover:bg-slate-100 font-bold rounded-xl text-center block shadow transition"
              >
                BROWSE ORGANIZATIONS
              </Link>
              <Link
                to="/register"
                className="w-full py-3.5 bg-brand-800 hover:bg-brand-900 text-white font-bold rounded-xl text-center block transition border border-brand-500"
              >
                CREATE FREE ACCOUNT
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-white py-20 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">Got Questions?</h2>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div
                key={i}
                className="border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition cursor-pointer"
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 text-sm sm:text-base">
                  <span>{f.q}</span>
                  <span className="text-brand-600 text-xl font-mono">{activeFaq === i ? '−' : '+'}</span>
                </div>
                {activeFaq === i && (
                  <p className="text-xs sm:text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
