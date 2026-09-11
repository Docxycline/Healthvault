import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { AccessGrant } from '../types';

interface RevokeModalProps {
  grant: AccessGrant | null;
  isOpen: boolean;
  onClose: () => void;
  onRevoked: () => void;
}

export const RevokeModal: React.FC<RevokeModalProps> = ({
  grant,
  isOpen,
  onClose,
  onRevoked,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !grant) return null;

  const handleRevoke = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/access/${grant.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to revoke access');
        setLoading(false);
        return;
      }
      onRevoked();
      onClose();
    } catch {
      setError('Network error while revoking access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Revoke Medical Access</h3>
              <p className="text-xs text-slate-500">Immediate termination of doctor access</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="font-medium text-slate-900">
              Are you sure you want to revoke {grant.doctorName}'s access?
            </p>
            <p className="text-xs text-slate-500">
              Access will be removed immediately. Any open sessions for {grant.doctorName} at {grant.doctorOrganization} will receive HTTP 403 Forbidden.
            </p>
          </div>

          {error && (
            <div className="mt-3 p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-revoke-btn"
              onClick={handleRevoke}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors"
            >
              {loading ? 'Revoking...' : 'Revoke Access'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
