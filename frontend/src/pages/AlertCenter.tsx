import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import PageHeader from '../components/PageHeader';
import { 
  Send, 
  Phone, 
  Radio, 
  CheckCircle2, 
  Key, 
  Code2, 
  Layers,
  MapPin,
  UserCheck
} from 'lucide-react';
import { NotificationModal } from '../components/NotificationModal';
import { DeliveryStatusDashboard } from '../components/DeliveryStatusDashboard';
import { TwilioConfigModal } from '../components/TwilioConfigModal';
import { TwilioCodeHub } from '../components/TwilioCodeHub';
import { INITIAL_PROVIDERS } from '../data/twilioProviders';
import type { Provider, NotificationRecord, TwilioConfigStatus, DeliveryStatusType } from '../types';

export default function AlertCenter() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dispatch' | 'code'>('dashboard');
  
  // Modals state
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(INITIAL_PROVIDERS[0]);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  
  // Data state
  const [history, setHistory] = useState<NotificationRecord[]>([]);
  const [config, setConfig] = useState<TwilioConfigStatus | null>(null);

  // Fetch initial data
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/twilio/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.error('Failed to fetch Twilio config:', e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/notify/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.records || []);
      }
    } catch (e) {
      console.error('Failed to fetch notification history:', e);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchHistory();

    // Auto-refresh delivery status history every 5 seconds
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatchClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsNotificationModalOpen(true);
  };

  const handleDispatchSuccess = (newRecord: NotificationRecord) => {
    setHistory(prev => [newRecord, ...prev.filter(r => r.id !== newRecord.id)]);
  };

  const handleUpdateStatus = async (sid: string, status: DeliveryStatusType) => {
    try {
      const res = await fetch(`/api/notify/status-update/${sid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchHistory();
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const handleClearHistory = async () => {
    try {
      const res = await fetch('/api/notify/clear', { method: 'POST' });
      if (res.ok) {
        setHistory([]);
      }
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  };

  const handleResend = (record: NotificationRecord) => {
    const prov = INITIAL_PROVIDERS.find(p => p.id === record.providerId) || INITIAL_PROVIDERS[0];
    setSelectedProvider(prov);
    setIsNotificationModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Voice Call & SMS Emergency Alert Center"
          description="Integrated Twilio dispatch engine for automated patient matching notifications and insurer network gap alerts."
        />

        {/* Top Control Header Card */}
        <div className="bg-white rounded-3xl border border-[#EBE8DF] p-6 shadow-sm shadow-[#526D5B]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#526D5B] text-white flex items-center justify-center shadow-md shadow-[#526D5B]/20">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-serif font-bold text-[#2D2D2A]">Twilio Telephony Dispatch Engine</h2>
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 cursor-pointer ${
                    config?.isLive
                      ? 'bg-[#EBF0EA] text-[#526D5B] border-[#D9E2D5]'
                      : 'bg-[#FAF3EB] text-[#A8743A] border-[#F0E4D4]'
                  }`}
                >
                  {config?.isLive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-[#526D5B]" />
                      <span>LIVE TWILIO ACTIVE</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-[#C2A07E] animate-ping" />
                      <span>SANDBOX SIMULATION MODE</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-[#8A8A80]">
                {config?.isLive 
                  ? `Sending live SMS from ${config.phoneNumber || '+17372212163'}` 
                  : 'All dispatches run high-fidelity simulation with authentic SIDs and carrier latency.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-open-config-modal"
              onClick={() => setIsConfigModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#F7F5F0] hover:bg-[#EBE8DF] text-[#43433E] text-xs font-bold border border-[#EBE8DF] transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Key className="w-4 h-4 text-[#526D5B]" />
              <span>Twilio Credentials</span>
            </button>

            <button
              id="btn-launch-quick-alert"
              onClick={() => handleDispatchClick(INITIAL_PROVIDERS[0])}
              className="px-5 py-2.5 rounded-xl bg-[#526D5B] hover:bg-[#435B4B] text-white text-xs font-bold shadow-md shadow-[#526D5B]/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send New Alert (Voice/SMS)</span>
            </button>
          </div>
        </div>

        {/* Main Section Navigation Tabs */}
        <div className="flex border-b border-[#EBE8DF] space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'border-[#526D5B] text-[#526D5B]'
                : 'border-transparent text-[#8A8A80] hover:text-[#43433E]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Alert Delivery Log & Status</span>
            {history.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-[#EBF0EA] text-[#526D5B] font-bold">
                {history.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('dispatch')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'dispatch'
                ? 'border-[#526D5B] text-[#526D5B]'
                : 'border-transparent text-[#8A8A80] hover:text-[#43433E]'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Provider Dispatch Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'border-[#526D5B] text-[#526D5B]'
                : 'border-transparent text-[#8A8A80] hover:text-[#43433E]'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Developer Code Hub</span>
          </button>
        </div>

        {/* Tab 1: Delivery Status Dashboard */}
        {activeTab === 'dashboard' && (
          <DeliveryStatusDashboard
            records={history}
            onRefresh={fetchHistory}
            onUpdateStatus={handleUpdateStatus}
            onClearHistory={handleClearHistory}
            onResend={handleResend}
          />
        )}

        {/* Tab 2: Provider Dispatch List Sandbox */}
        {activeTab === 'dispatch' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-[#EBE8DF] p-5 shadow-sm shadow-[#526D5B]/5">
              <h3 className="font-serif font-bold text-base text-[#2D2D2A] mb-1">Available In-Network Healthcare Specialists</h3>
              <p className="text-xs text-[#8A8A80]">Select any specialist to construct custom SMS alerts or Amazon Polly voice call scripts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {INITIAL_PROVIDERS.map((provider) => (
                <div
                  key={provider.id}
                  className="bg-white rounded-3xl border border-[#EBE8DF] p-5 hover:border-[#526D5B] transition-all shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#2D2D2A]">{provider.name}</h4>
                        <p className="text-xs text-[#526D5B] font-semibold">{provider.specialty}</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-[#EBF0EA] text-[#526D5B] px-2 py-0.5 rounded border border-[#D9E2D5]">
                        NPI: {provider.npi}
                      </span>
                    </div>

                    <p className="text-xs text-[#6B6B61]">{provider.clinicName}</p>

                    <div className="text-[11px] text-[#8A8A80] space-y-1">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-[#526D5B]" />
                        <span>{provider.address}, {provider.city}, {provider.state}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-[#526D5B]" />
                        <span>{provider.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EBE8DF] flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#A8743A] bg-[#FAF3EB] px-2.5 py-0.5 rounded-full border border-[#F0E4D4]">
                      {provider.networkTier}
                    </span>

                    <button
                      onClick={() => handleDispatchClick(provider)}
                      className="px-3 py-1.5 bg-[#526D5B] hover:bg-[#435B4B] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Alert</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Developer Code Hub */}
        {activeTab === 'code' && (
          <TwilioCodeHub
            selectedProviderId={selectedProvider?.id}
            onSelectProvider={(p) => setSelectedProvider(p)}
          />
        )}

        {/* Dispatch Modal */}
        <NotificationModal
          provider={selectedProvider}
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          onDispatchSuccess={handleDispatchSuccess}
          defaultLocation="Detroit, MI 48201"
          defaultSpecialty={selectedProvider?.specialty || 'Cardiology'}
          twilioConfig={config}
        />

        {/* Config Status Modal */}
        <TwilioConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          config={config}
          onRefresh={fetchConfig}
        />
      </div>
    </DashboardLayout>
  );
}
