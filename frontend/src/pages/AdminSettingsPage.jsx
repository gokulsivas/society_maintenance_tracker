import React, { useState, useEffect } from 'react';
import { getOverdueThreshold, updateOverdueThreshold } from '../api/settings';
import { getErrorMessage, isRequestCanceled } from '../api/client';
import ErrorAlert from '../components/common/ErrorAlert';
import { Settings, Save, CheckCircle2, AlertOctagon, Clock } from 'lucide-react';

export default function AdminSettingsPage() {
  const [days, setDays] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSettings() {
      try {
        setLoading(true);
        setError(null);
        const data = await getOverdueThreshold({ signal: controller.signal });
        setDays(data?.overdue_threshold_days || 3);
      } catch (err) {
        if (isRequestCanceled(err)) return;
        setError(getErrorMessage(err, 'Failed to fetch settings.'));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    loadSettings();

    return () => {
      controller.abort();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = parseInt(days, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 365) {
      setError('Please enter a valid number of days between 1 and 365.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updated = await updateOverdueThreshold(parsed);
      setDays(updated.overdue_threshold_days);
      setSuccessMsg(`Overdue threshold successfully updated to ${updated.overdue_threshold_days} days.`);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update overdue threshold.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-blue-600" />
          System Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure society-wide operational rules and automated calculation parameters.
        </p>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Complaint Resolution Overdue Threshold
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Complaints that remain in <strong>OPEN</strong> or <strong>IN_PROGRESS</strong> status past this number of days are dynamically flagged as overdue in the dashboard and sorted to the top of the admin queue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="overdue_threshold_days" className="block text-sm font-semibold text-gray-700 mb-1">
              Overdue Threshold (Days)
            </label>
            <input
              id="overdue_threshold_days"
              type="number"
              min={1}
              max={365}
              required
              disabled={loading || saving}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-400 mt-1.5">Valid range: 1 to 365 days.</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start space-x-3 text-xs text-gray-600">
            <AlertOctagon className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <p>
              Changes take effect immediately across all live queries and dashboards without requiring a database migration.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || saving}
              className="inline-flex items-center px-5 py-2.5 font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
