import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStyle = () => {
    switch (status) {
      case 'WAITING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'NEAR_TURN':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse font-bold';
      case 'SERVING':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold ring-2 ring-emerald-500/30';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ON_HOLD':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'SKIPPED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'OPEN':
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CLOSED':
      case 'INACTIVE':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'NEAR_TURN':
        return 'Near Turn';
      case 'ON_HOLD':
        return 'On Hold';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyle()}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === 'SERVING'
            ? 'bg-emerald-600'
            : status === 'WAITING'
            ? 'bg-amber-500'
            : status === 'NEAR_TURN'
            ? 'bg-indigo-600'
            : status === 'CANCELLED'
            ? 'bg-rose-600'
            : 'bg-slate-500'
        }`}
      />
      {getLabel()}
    </span>
  );
};
