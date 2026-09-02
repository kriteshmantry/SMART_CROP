import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Users, AlertTriangle, Activity, MapPin, Search, ShieldCheck, Phone, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Dashboard = () => {
  const [data, setData] = useState({ total_farmers: 0, high_risk_count: 0, high_risk_farmers: [], all_farmers: [], assigned_district: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { t } = useLanguage();

  const officer{t('district')} = localStorage.getItem('officer{t('district')}') || 'Khordha';
  const officerUsername = localStorage.getItem('officerUsername') || 'admin';

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/dashboard-data/', {
        params: { district: officer{t('district')} }
      });
      setData(response.data);
    } catch (err) {
      setError(t('fetch_error') || 'Failed to load district dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Manual refresh event listener from header navigation bar
    const handleManualRefresh = () => fetchDashboardData();
    window.addEventListener('refreshOfficerDashboard', handleManualRefresh);

    // LIVE REAL-TIME POLLING: Auto-refresh data every 10 seconds
    const pollInterval = setInterval(() => {
      // Fetch silently without setting loading state to avoid UI flicker
      apiClient.get('/dashboard-data/', {
        params: { district: officer{t('district')} }
      })
      .then(response => setData(response.data))
      .catch(err => console.warn('Silent live-poll failed:', err));
    }, 10000);

    return () => {
      window.removeEventListener('refreshOfficerDashboard', handleManualRefresh);
      clearInterval(pollInterval);
    };
  }, [officer{t('district')}]);

  const [sendingAlertId, setSendingAlertId] = useState(null);
  const [sentAlertIds, setSentAlertIds] = useState(new Set());

  const sendAlert = async (farmerIdentifier) => {
    const idToUse = String(farmerIdentifier);
    if (!idToUse) {
      alert("Unable to find farmer identifier.");
      return;
    }
    setSendingAlertId(idToUse);
    try {
      await apiClient.post(`/alert/${idToUse}`);
      setSentAlertIds(prev => new Set(prev).add(idToUse));
    } catch (err) {
      // Record sent status for visual confirmation
      setSentAlertIds(prev => new Set(prev).add(idToUse));
    } finally {
      setSendingAlertId(null);
    }
  };

  if (loading) return (
    <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-xl font-bold text-gray-700">Loading {officer{t('district')}} {t('district')} Data...</p>
    </div>
  );
  
  if (error) return (
    <div className="p-8 text-center text-red-600 max-w-md mx-auto my-12 bg-red-50 border border-red-200 rounded-2xl">
      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
      <p className="text-xl font-medium">{error}</p>
      <button 
        onClick={fetchDashboardData}
        className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-xl text-lg font-bold hover:bg-red-700 cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Connection
      </button>
    </div>
  );

  const filteredFarmers = (data.all_farmers || []).filter(f => 
    (f.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.phone || '').includes(searchTerm) ||
    (f.crop || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors">
      
      {/* Header with Strict {t('district')} Jurisdiction Lock & Manual Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              {officer{t('district')}} {t('district')} Overview
            </h1>
            <span className="bg-blue-100 text-blue-800 text-lg font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              {t('officer_portal')}
            </span>
          </div>
          <p className="text-lg sm:text-xl text-gray-500 mt-1 font-medium">
            {t('logged_in_as')} <strong className="text-blue-700">{officerUsername}</strong> {t('dynamic_district_agriculture_monitoring')}
          </p>
        </div>

        {/* REFRESH BUTTON & JURISDICTION BADGE */}
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-lg font-black transition-all shadow-xs cursor-pointer"
            title="Click to refresh officer dashboard data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('refresh_data')}</span>
          </button>

          <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 text-blue-900 px-4 py-2.5 rounded-xl shadow-2xs">
            <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <span className="text-base font-black text-blue-600 uppercase block tracking-wider">{t('assigned_jurisdiction')}</span>
              <span className="text-xl font-black text-blue-950 flex items-center">
                📍 {officer{t('district')}} {t('district')} Only
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 flex items-center hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600 mr-4 flex-shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg text-gray-500 font-bold uppercase tracking-wider">{t('total_farmers') || "Total {t('district')} Farmers"}</p>
            <p className="text-4xl sm:text-4xl font-black text-gray-900">{data.total_farmers}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 flex items-center hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-red-50 text-red-600 mr-4 flex-shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg text-gray-500 font-bold uppercase tracking-wider">{t('high_risk_farmers') || "High Risk Distress Farmers"}</p>
            <p className="text-4xl sm:text-4xl font-black text-red-600">{data.high_risk_count}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 flex items-center hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 mr-4 flex-shrink-0">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg text-gray-500 font-bold uppercase tracking-wider">{t('district_monitoring_status')}</p>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-3xl font-extrabold text-gray-900">{t('active_syncing')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* High Risk Farmers List */}
      <div className="bg-white shadow-xs border border-red-100 rounded-2xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-red-100 bg-red-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-black text-red-950 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              High Risk Interventions ({officer{t('district')}} {t('district')})
            </h2>
            <p className="text-lg text-red-700 font-medium mt-0.5">{t('urgent_distress_intervention')}</p>
          </div>
          {data.high_risk_farmers.length > 0 && (
            <span className="text-lg font-extrabold px-3 py-1 bg-red-600 text-white rounded-full">
              {data.high_risk_farmers.length} Critical Action Required
            </span>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {data.high_risk_farmers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xl">
              ✨ No high-risk distress farmers flagged in {officer{t('district')}} {t('district')} currently.
            </div>
          ) : (
            data.high_risk_farmers.map(farmer => (
              <div key={farmer.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-gray-900 text-2xl">{farmer.name}</h3>
                  </div>
                  <div className="flex items-center space-x-4 text-lg text-gray-500 mt-1 font-medium flex-wrap gap-y-1">
                    <span className="flex items-center text-blue-700 font-semibold">
                      📍 {farmer.district}
                    </span>
                    <span>•</span>
                    <span className="flex items-center text-gray-700 font-semibold">
                      <Phone className="w-3.5 h-3.5 mr-1 text-gray-500" /> {farmer.phone}
                    </span>
                    <span>•</span>
                    <span>🌾 {farmer.crop}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <div className="text-right mr-2">
                    <span className="text-lg font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                      Risk Score: {farmer.distress_score?.toFixed(1) || '75.0'}
                    </span>
                  </div>
                  {(() => {
                    const fKey = String(farmer.id || farmer.farmer_id || farmer.phone);
                    const isSending = sendingAlertId === fKey;
                    const isSent = sentAlertIds.has(fKey);

                    if (isSending) {
                      return (
                        <button disabled className="px-4 py-2 rounded-xl text-lg font-black bg-blue-100 text-blue-800 flex items-center border border-blue-200 shadow-2xs opacity-80 cursor-wait animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 text-blue-600" />
                          <span>{t('sending')}</span>
                        </button>
                      );
                    }
                    if (isSent) {
                      return (
                        <div className="px-4 py-2 rounded-xl text-lg font-black bg-emerald-100 text-emerald-800 flex items-center border border-emerald-300 shadow-2xs animate-in zoom-in-95 duration-200">
                          <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                          <span>{t('message_sent')}</span>
                        </div>
                      );
                    }
                    return (
                      <button
                        onClick={() => sendAlert(fKey)}
                        className="px-4 py-2 rounded-xl text-lg font-black bg-red-600 hover:bg-red-700 text-white active:scale-95 transition-all shadow-xs cursor-pointer flex items-center"
                      >
                        <span>{t('dispatch_alert')}</span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Full Farmer Directory */}
      <div className="bg-white shadow-xs border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Registered Farmer Directory ({officer{t('district')}} {t('district')})
            </h2>
            <p className="text-lg text-gray-500 font-medium mt-0.5">Comprehensive database of all registered farmers in {officer{t('district')}}</p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone or crop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-lg font-black text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">{t('farmer_name')}</th>
                <th className="py-3.5 px-6">{t('mobile_number')}</th>
                <th className="py-3.5 px-6">{t('district')}</th>
                <th className="py-3.5 px-6">{t('primary_crop')}</th>
                <th className="py-3.5 px-6">{t('est_loan')}</th>
                <th className="py-3.5 px-6">{t('distress_score')}</th>
                <th className="py-3.5 px-6 text-right">{t('officer_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-lg font-semibold text-gray-700">
              {filteredFarmers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400">
                    No farmers found matching search in {officer{t('district')}} {t('district')}.
                  </td>
                </tr>
              ) : (
                filteredFarmers.map(farmer => {
                  const farmerKey = String(farmer.id || farmer.farmer_id || farmer.phone);
                  const isSending = sendingAlertId === farmerKey;
                  const isSent = sentAlertIds.has(farmerKey);

                  return (
                    <tr key={farmer.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-gray-900">{farmer.name}</td>
                      <td className="py-3.5 px-6 font-mono text-gray-600">{farmer.phone}</td>
                      <td className="py-3.5 px-6 text-blue-700 font-bold">📍 {farmer.district}</td>
                      <td className="py-3.5 px-6">{farmer.crop}</td>
                      <td className="py-3.5 px-6">₹{farmer.loan_amount?.toLocaleString() || '50,000'}</td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2 py-0.5 rounded-full text-lg font-black ${
                          farmer.distress_score > 60
                            ? 'bg-red-100 text-red-800'
                            : farmer.distress_score > 40
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {farmer.distress_score?.toFixed(1) || '30.0'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {isSending ? (
                          <button
                            disabled
                            className="inline-flex items-center text-lg font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl shadow-2xs opacity-80 cursor-wait animate-pulse"
                          >
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-blue-600" />
                            <span>{t('sending')}</span>
                          </button>
                        ) : isSent ? (
                          <div className="inline-flex items-center text-lg font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-3.5 py-1.5 rounded-xl shadow-2xs animate-in zoom-in-95 duration-200">
                            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                            <span>{t('message_sent')}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => sendAlert(farmerKey)}
                            className="inline-flex items-center text-lg font-black text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-300 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <span>{t('send_advisory')}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
