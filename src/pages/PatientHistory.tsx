import React, { useState, useEffect } from 'react';
import { 
  History, 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Filter, 
  RefreshCw,
  Search
} from 'lucide-react';
import { AccessEvent, AuditEventType } from '../types';

interface PatientHistoryProps {
  onNavigate: (route: string) => void;
}

export const PatientHistory: React.FC<PatientHistoryProps> = ({ onNavigate }) => {
  const [events, setEvents] = useState<AccessEvent[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/access/history');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredEvents = events.filter(e => {
    if (filterType === 'ALL') return true;
    if (filterType === 'GRANTED') return e.eventType === 'ACCESS_GRANTED';
    if (filterType === 'DENIED') return e.eventType === 'ACCESS_DENIED';
    if (filterType === 'VIEWED') return e.eventType === 'RECORD_VIEWED';
    if (filterType === 'REVOKED') return e.eventType === 'ACCESS_REVOKED' || e.eventType === 'ACCESS_EXPIRED';
    if (filterType === 'EMERGENCY') return e.eventType === 'EMERGENCY_ACCESS';
    return true;
  });

  const getEventBadge = (type: AuditEventType) => {
    switch (type) {
      case 'ACCESS_GRANTED':
        return {
          icon: ShieldCheck,
          label: 'ACCESS GRANTED',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'ACCESS_DENIED':
        return {
          icon: XCircle,
          label: 'ACCESS DENIED (403)',
          color: 'bg-red-50 text-red-700 border-red-200',
        };
      case 'RECORD_VIEWED':
        return {
          icon: Eye,
          label: 'RECORD VIEWED',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'ACCESS_REVOKED':
        return {
          icon: AlertTriangle,
          label: 'ACCESS REVOKED',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'ACCESS_EXPIRED':
        return {
          icon: Clock,
          label: 'ACCESS EXPIRED (24h)',
          color: 'bg-slate-100 text-slate-700 border-slate-300',
        };
      case 'EMERGENCY_ACCESS':
        return {
          icon: ShieldAlert,
          label: 'EMERGENCY ACCESS',
          color: 'bg-rose-100 text-rose-800 border-rose-300',
        };
      default:
        return {
          icon: History,
          label: type,
          color: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access History & Audit Trail</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Immutable
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-0.5">
            Cryptographically timestamped log of all access attempts, views, and modifications.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Log
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'All Events' },
          { id: 'GRANTED', label: 'Access Granted' },
          { id: 'VIEWED', label: 'Records Viewed' },
          { id: 'DENIED', label: 'Denied (403)' },
          { id: 'REVOKED', label: 'Revoked / Expired' },
          { id: 'EMERGENCY', label: 'Emergency' },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setFilterType(filter.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap border ${
              filterType === filter.id
                ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>Activity Log ({filteredEvents.length} records)</span>
          <span>Zero-Trust Verification</span>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No audit events found for this filter.
            </div>
          ) : (
            filteredEvents.map(event => {
              const badge = getEventBadge(event.eventType);
              const Icon = badge.icon;
              const dateObj = new Date(event.timestamp);
              const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const formattedDate = dateObj.toLocaleDateString();

              return (
                <div key={event.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${badge.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{event.actorName}</span>
                        {event.actorRole && (
                          <span className="text-[10px] text-slate-400">({event.actorRole})</span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 mt-1">{event.description}</p>

                      {event.category && (
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                          <span>Target Category: <strong className="text-slate-800">{event.category}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-xs shrink-0 pl-12 sm:pl-0">
                    <div className="font-semibold text-slate-800">{formattedTime}</div>
                    <div className="text-[11px] text-slate-400">{formattedDate}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      ip: {event.ipAddress || '127.0.0.1'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
