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
    <div className="editorial-page-surface min-h-[calc(100vh-5rem)] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#ebe5da] dark:bg-[#342d27] text-[#5f4b3b] dark:text-[#d8cdbc] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] rounded-none">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#24211e] dark:text-[#f5f2ec] tracking-tight">
              System Settings
            </h1>
          </div>
          <p className="text-sm text-[#6b665e] dark:text-[#c8bfb3] mt-1">
            Configure society-wide operational rules and automated calculation parameters.
          </p>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError(null)} />

        {successMsg && (
          <div className="p-4 bg-[#eef2eb] dark:bg-[#223023] border border-[#b8c9af] dark:border-[#4d6b49] text-[#52634a] dark:text-[#a3c99b] flex items-center justify-between text-xs sm:text-sm shadow-sm rounded-none">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#52634a] dark:text-[#a3c99b]" />
              <span className="font-semibold">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-[#52634a] dark:text-[#a3c99b] hover:text-[#24211e] dark:hover:text-[#f5f2ec] text-xs font-bold uppercase tracking-wider">
              Dismiss
            </button>
          </div>
        )}

        <div className="bg-[#faf8f3] dark:bg-[#24211e] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] shadow-sm p-6 sm:p-10 space-y-6 rounded-none">
          <div className="border-b border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] pb-4">
            <h2 className="font-serif text-xl font-normal text-[#24211e] dark:text-[#f5f2ec] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#8a6843] dark:text-[#e0a96d]" />
              Complaint Resolution Overdue Threshold
            </h2>
            <p className="text-xs text-[#6b665e] dark:text-[#c8bfb3] mt-1.5 leading-relaxed">
              Complaints that remain in <strong>OPEN</strong> or <strong>IN_PROGRESS</strong> status past this number of days are dynamically flagged as overdue in the dashboard and sorted to the top of the admin queue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
            <div>
              <label htmlFor="overdue_threshold_days" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] dark:text-[#d8cdbc] mb-1.5">
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
                className="block w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#2a2520] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-[#24211e] dark:text-[#f5f2ec] focus:border-[#5f4b3b] focus:outline-none text-sm shadow-sm disabled:opacity-50 rounded-none"
              />
              <p className="text-[11px] text-[#8F8778] dark:text-[#a89e91] mt-1.5">Valid range: 1 to 365 days.</p>
            </div>

            <div className="p-4 bg-[#FAF8F5] dark:bg-[#2b2723] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] flex items-start space-x-3 text-xs text-[#6b665e] dark:text-[#c8bfb3] rounded-none">
              <AlertOctagon className="w-4 h-4 text-[#8a4d43] dark:text-[#efb2a8] flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Changes take effect immediately across all live queries and dashboards without requiring a database migration.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || saving}
                className="inline-flex items-center px-6 py-2.5 font-semibold text-xs uppercase tracking-wider text-[#FAF8F5] bg-[#24211e] hover:bg-[#3f3025] dark:bg-[#342d27] dark:hover:bg-[#433931] disabled:opacity-50 border border-[#24211e] dark:border-[rgba(245,242,236,0.2)] shadow-sm transition-all rounded-none"
              >
                <Save className="w-3.5 h-3.5 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
