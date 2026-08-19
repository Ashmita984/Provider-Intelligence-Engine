import React, { useState } from 'react';
import { 
  Radio, 
  CheckCircle2, 
  Clock, 
  Send, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  Phone, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  TrendingUp, 
  Trash2
} from 'lucide-react';
import type { NotificationRecord, DeliveryStatusType } from '../types';

interface DeliveryStatusDashboardProps {
  records: NotificationRecord[];
  onRefresh: () => void;
  onUpdateStatus: (sid: string, status: DeliveryStatusType) => void;
  onClearHistory: () => void;
  onResend: (record: NotificationRecord) => void;
}

export const DeliveryStatusDashboard: React.FC<DeliveryStatusDashboardProps> = ({
  records,
  onRefresh,
  onUpdateStatus,
  onClearHistory,
  onResend
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSid, setExpandedSid] = useState<string | null>(null);
  const [copiedSid, setCopiedSid] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleCopySid = (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sid);
    setCopiedSid(sid);
    setTimeout(() => setCopiedSid(null), 2000);
  };

  // Filtered records
  const filteredRecords = records.filter(record => {
    if (filterStatus !== 'all' && record.status !== filterStatus) return false;
    if (filterChannel !== 'all' && record.channel !== filterChannel) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        record.recipientName.toLowerCase().includes(q) ||
        record.recipientPhone.toLowerCase().includes(q) ||
        record.providerName.toLowerCase().includes(q) ||
        record.providerId.includes(q) ||
        record.sid.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate Metrics
  const total = records.length;
  const deliveredCount = records.filter(r => r.status === 'delivered' || r.status === 'completed').length;
  const deliveryRate = total > 0 ? Math.round((deliveredCount / total) * 100) : 100;
  const avgLatency = records.length > 0
    ? Math.round(records.reduce((acc, r) => acc + (r.deliveryTimeMs || 1200), 0) / records.length)
    : 0;

  const getStatusBadge = (status: DeliveryStatusType) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBF0EA] text-[#526D5B] border border-[#D9E2D5]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#526D5B]" />
            <span className="capitalize">{status}</span>
          </span>
        );
      case 'sent':
      case 'in-progress':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBF0EA] text-[#526D5B] border border-[#D9E2D5]">
            <span className="w-2 h-2 rounded-full bg-[#526D5B] animate-ping mr-0.5" />
            <span className="capitalize">{status}</span>
          </span>
        );
      case 'sending':
      case 'ringing':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF3EB] text-[#A8743A] border border-[#F0E4D4]">
            <span className="w-2 h-2 rounded-full bg-[#C2A07E] animate-pulse mr-0.5" />
            <span className="capitalize">{status}</span>
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F7F5F0] text-[#6B6B61] border border-[#EBE8DF]">
            <Clock className="w-3.5 h-3.5 text-[#8A8A80]" />
            <span>Queued</span>
          </span>
        );
      case 'failed':
      case 'undelivered':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FDF2F0] text-[#B84A39] border border-[#F0D5D1]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#B84A39]" />
            <span className="capitalize">{status}</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#F7F5F0] text-[#6B6B61] border border-[#EBE8DF]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-[#EBE8DF] p-5 shadow-sm shadow-[#526D5B]/5">
          <div className="flex items-center justify-between text-xs text-[#8A8A80] font-medium">
            <span>Total Dispatches</span>
            <Send className="w-4 h-4 text-[#526D5B]" />
          </div>
          <p className="text-2xl font-serif font-bold text-[#2D2D2A] mt-2">{total}</p>
          <p className="text-[11px] text-[#8A8A80] mt-0.5">SMS & Voice Notifications</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#EBE8DF] p-5 shadow-sm shadow-[#526D5B]/5">
          <div className="flex items-center justify-between text-xs text-[#8A8A80] font-medium">
            <span>Delivery Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-[#526D5B]" />
          </div>
          <p className="text-2xl font-serif font-bold text-[#526D5B] mt-2">{deliveryRate}%</p>
          <div className="w-full bg-[#F7F5F0] rounded-full h-1.5 mt-2 overflow-hidden border border-[#EBE8DF]">
            <div className="bg-[#526D5B] h-full rounded-full" style={{ width: `${deliveryRate}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#EBE8DF] p-5 shadow-sm shadow-[#526D5B]/5">
          <div className="flex items-center justify-between text-xs text-[#8A8A80] font-medium">
            <span>Avg Carrier Latency</span>
            <TrendingUp className="w-4 h-4 text-[#C2A07E]" />
          </div>
          <p className="text-2xl font-serif font-bold text-[#2D2D2A] mt-2">
            {avgLatency ? `${(avgLatency / 1000).toFixed(2)}s` : '1.24s'}
          </p>
          <p className="text-[11px] text-[#526D5B] font-medium mt-0.5">Optimal Twilio SLA Route</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#EBE8DF] p-5 shadow-sm shadow-[#526D5B]/5">
          <div className="flex items-center justify-between text-xs text-[#8A8A80] font-medium">
            <span>Network Gateway</span>
            <Radio className="w-4 h-4 text-[#526D5B]" />
          </div>
          <p className="text-base font-bold text-[#2D2D2A] mt-2">Twilio Telephony Hub</p>
          <p className="text-[11px] text-[#8A8A80] mt-0.5">Direct Carrier Interconnect</p>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white rounded-3xl border border-[#EBE8DF] p-5 shadow-sm shadow-[#526D5B]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">


        {/* Filter Pills & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            id="select-filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#F7F5F0] border border-[#EBE8DF] rounded-xl px-3 py-2 text-xs font-medium text-[#43433E] focus:outline-none focus:ring-2 focus:ring-[#526D5B] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="delivered">Delivered / Completed</option>
            <option value="sent">Sent / In-Progress</option>
            <option value="queued">Queued / Sending</option>
            <option value="failed">Failed</option>
          </select>

          {/* Channel Filter */}
          <select
            id="select-filter-channel"
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="bg-[#F7F5F0] border border-[#EBE8DF] rounded-xl px-3 py-2 text-xs font-medium text-[#43433E] focus:outline-none focus:ring-2 focus:ring-[#526D5B] cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="sms">SMS Text</option>
            <option value="call">Voice Call</option>
          </select>

          {/* Refresh button */}
          <button
            id="btn-refresh-dispatches"
            onClick={handleRefreshClick}
            className="p-2 rounded-xl bg-[#F7F5F0] hover:bg-[#EBE8DF] text-[#43433E] border border-[#EBE8DF] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Refresh delivery status"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#526D5B] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Clear history */}
          {records.length > 0 && (
            <button
              id="btn-clear-dispatches"
              onClick={onClearHistory}
              className="p-2 rounded-xl bg-[#FDF2F0] hover:bg-[#FBE8E6] text-[#B84A39] border border-[#F0D5D1] text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
              title="Clear log history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dispatches Card List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#EBE8DF] p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF0EA] text-[#526D5B] flex items-center justify-center mx-auto border border-[#D9E2D5]">
              <Radio className="w-6 h-6" />
            </div>
            <h4 className="text-base font-serif font-bold text-[#2D2D2A]">No Dispatches Found</h4>
            <p className="text-xs text-[#8A8A80] max-w-sm mx-auto">
              {searchQuery || filterStatus !== 'all' || filterChannel !== 'all'
                ? 'Try adjusting your search query or filter options.'
                : 'Select a provider from the Provider Dispatch tab and send an SMS or Voice notification to start tracking real-time delivery.'}
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const isExpanded = expandedSid === record.sid;
            const isSms = record.channel === 'sms';

            return (
              <div
                key={record.id || record.sid}
                id={`dispatch-card-${record.sid}`}
                className="bg-white rounded-3xl border border-[#EBE8DF] hover:border-[#526D5B]/50 transition-all shadow-2xs overflow-hidden"
              >
                {/* Main Card Summary Bar */}
                <div
                  onClick={() => setExpandedSid(isExpanded ? null : record.sid)}
                  className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-[#F7F5F0]/50"
                >
                  {/* Left info */}
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSms
                          ? 'bg-[#EBF0EA] text-[#526D5B] border border-[#D9E2D5]'
                          : 'bg-[#FAF3EB] text-[#A8743A] border border-[#F0E4D4]'
                      }`}
                    >
                      {isSms ? <MessageSquare className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-serif font-bold text-[#2D2D2A]">
                          {record.recipientName}
                        </span>
                        <span className="text-xs font-mono text-[#6B6B61] bg-[#F7F5F0] px-2.5 py-0.5 rounded-md border border-[#EBE8DF]">
                          {record.recipientPhone}
                        </span>
                        {getStatusBadge(record.status)}
                      </div>

                      <p className="text-xs text-[#6B6B61] flex items-center space-x-1.5">
                        <span>Matched Provider:</span>
                        <strong className="text-[#2D2D2A]">{record.providerName}</strong>
                        <span className="text-[#8A8A80] font-mono text-[11px]">(NPI: {record.providerId})</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Meta & Actions */}
                  <div className="flex items-center justify-between lg:justify-end space-x-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#EBE8DF]">
                    <div className="text-left lg:text-right text-xs">
                      <div className="flex items-center space-x-1 text-[#8A8A80]">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      <span className="text-[11px] text-[#8A8A80]">
                        {record.carrier || 'Carrier Network'} • {record.price || '$0.0079'}
                      </span>
                    </div>

                    {/* Twilio SID Badge */}
                    <button
                      onClick={(e) => handleCopySid(record.sid, e)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-[#F7F5F0] hover:bg-[#EBE8DF] text-[#43433E] text-xs font-mono font-semibold border border-[#EBE8DF] transition-colors cursor-pointer"
                      title="Click to copy Twilio SID"
                    >
                      <span className="text-[#8A8A80] font-normal font-sans">SID:</span>
                      <span>{record.sid.substring(0, 10)}...</span>
                      {copiedSid === record.sid ? (
                        <Check className="w-3 h-3 text-[#526D5B]" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#8A8A80]" />
                      )}
                    </button>

                    <div className="text-[#8A8A80]">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-[#EBE8DF] bg-[#F9F8F3] space-y-4 text-xs">
                    {/* Visual Status Progress Flow */}
                    <div className="bg-white p-5 rounded-2xl border border-[#EBE8DF]">
                      <p className="font-semibold text-[#2D2D2A] mb-3 flex items-center justify-between">
                        <span>Twilio Carrier Lifecycle Progression</span>
                        <span className="text-[11px] font-normal text-[#8A8A80]">SID: {record.sid}</span>
                      </p>
                      
                      <div className="flex items-center justify-between relative">
                        {/* Line */}
                        <div className="absolute left-4 right-4 top-3.5 h-0.5 bg-[#EBE8DF] -z-0" />
                        
                        {/* Step 1: Queued */}
                        <div className="flex flex-col items-center relative z-10 space-y-1">
                          <div className="w-7 h-7 rounded-full bg-[#526D5B] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            ✓
                          </div>
                          <span className="font-semibold text-[#43433E] text-[11px]">Queued</span>
                        </div>

                        {/* Step 2: Sending */}
                        <div className="flex flex-col items-center relative z-10 space-y-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                            record.status !== 'queued' ? 'bg-[#526D5B] text-white' : 'bg-[#EBE8DF] text-[#8A8A80]'
                          }`}>
                            {record.status !== 'queued' ? '✓' : '2'}
                          </div>
                          <span className="font-semibold text-[#43433E] text-[11px]">Carrier Transit</span>
                        </div>

                        {/* Step 3: Sent */}
                        <div className="flex flex-col items-center relative z-10 space-y-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                            record.status === 'sent' || record.status === 'delivered' || record.status === 'completed'
                              ? 'bg-[#526D5B] text-white'
                              : 'bg-[#EBE8DF] text-[#8A8A80]'
                          }`}>
                            {record.status === 'sent' || record.status === 'delivered' || record.status === 'completed' ? '✓' : '3'}
                          </div>
                          <span className="font-semibold text-[#43433E] text-[11px]">Sent to Handset</span>
                        </div>

                        {/* Step 4: Delivered */}
                        <div className="flex flex-col items-center relative z-10 space-y-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                            record.status === 'delivered' || record.status === 'completed'
                              ? 'bg-[#526D5B] text-white'
                              : record.status === 'failed'
                              ? 'bg-[#B84A39] text-white'
                              : 'bg-[#EBE8DF] text-[#8A8A80]'
                          }`}>
                            {record.status === 'delivered' || record.status === 'completed'
                              ? '✓'
                              : record.status === 'failed'
                              ? '✕'
                              : '4'}
                          </div>
                          <span className="font-semibold text-[#43433E] text-[11px]">
                            {record.status === 'failed' ? 'Failed' : 'Delivered Receipt'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dispatched Payload */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-[#FAF3EB] border border-[#F0E4D4] rounded-2xl p-4 space-y-2">
                        <span className="font-bold text-[#2D2D2A] block">
                          {isSms ? 'Dispatched SMS Text Payload' : 'Voice Script & TwiML'}
                        </span>
                        <div className="bg-[#F7F5F0] p-3 rounded-xl border border-[#EBE8DF] font-mono text-[11px] text-[#2D2D2A] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                          {isSms ? record.messageBody : record.voiceScript || record.messageBody}
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-[#EBE8DF] space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-[#2D2D2A] block mb-1">Carrier Telemetry</span>
                          <div className="space-y-1.5 text-[#6B6B61]">
                            <div className="flex justify-between">
                              <span>Full SID:</span>
                              <span className="font-mono text-[#2D2D2A] font-semibold">{record.sid}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Provider ID (NPI):</span>
                              <span className="font-mono text-[#2D2D2A] font-semibold">{record.providerId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Clinic:</span>
                              <span className="text-[#2D2D2A]">{record.providerAddress}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Delivery Latency:</span>
                              <span className="text-[#526D5B] font-bold">{record.deliveryTimeMs || 1420} ms</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Status Stepper Buttons for testing */}
                        <div className="pt-3 border-t border-[#EBE8DF] flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] text-[#8A8A80]">Simulation Controls:</span>
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => onUpdateStatus(record.sid, 'delivered')}
                              className="px-2.5 py-1 rounded-xl bg-[#EBF0EA] hover:bg-[#D9E2D5] text-[#526D5B] text-[11px] font-semibold border border-[#D9E2D5] cursor-pointer"
                            >
                              Set Delivered
                            </button>
                            <button
                              onClick={() => onUpdateStatus(record.sid, 'failed')}
                              className="px-2.5 py-1 rounded-xl bg-[#FDF2F0] hover:bg-[#FBE8E6] text-[#B84A39] text-[11px] font-semibold border border-[#F0D5D1] cursor-pointer"
                            >
                              Set Failed
                            </button>
                            <button
                              onClick={() => onResend(record)}
                              className="px-2.5 py-1 rounded-xl bg-[#FAF3EB] hover:bg-[#F0E4D4] text-[#A8743A] text-[11px] font-semibold border border-[#F0E4D4] flex items-center space-x-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Re-send</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
