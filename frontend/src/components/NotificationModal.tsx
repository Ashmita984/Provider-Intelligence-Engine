import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Phone, 
  MessageSquare, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  AlertCircle, 
  ShieldCheck,
  User, 
  MapPin, 
  Layers,
  Check
} from 'lucide-react';
import type { Provider, DeliveryChannel, NotificationRecord, TwilioConfigStatus, RecipientType } from '../types';
import { 
  buildPatientAppointmentMessage, 
  buildInsurerDispatchMessage, 
  buildPatientAppointmentVoiceScript, 
  buildInsurerDispatchVoiceScript, 
  getPredefinedSpecialtyMessage 
} from '../data/twilioProviders';

interface NotificationModalProps {
  provider: Provider | null;
  isOpen: boolean;
  onClose: () => void;
  onDispatchSuccess: (record: NotificationRecord) => void;
  defaultLocation: string;
  defaultSpecialty: string;
  twilioConfig?: TwilioConfigStatus | null;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  provider,
  isOpen,
  onClose,
  onDispatchSuccess,
  defaultLocation,
  defaultSpecialty,
  twilioConfig
}) => {
  if (!isOpen || !provider) return null;

  // Form State
  const [recipientType, setRecipientType] = useState<RecipientType>('patient');
  const [gapLevel, setGapLevel] = useState('CRITICAL');
  const [actionRequired, setActionRequired] = useState(false);
  const [recipientName, setRecipientName] = useState('Sarah Jenkins');
  const [recipientPhone, setRecipientPhone] = useState(twilioConfig?.testToNumber || '+13135550149');
  const [userLocation, setUserLocation] = useState(defaultLocation || 'Detroit, MI 48201');
  const [channel, setChannel] = useState<DeliveryChannel>('both');
  const [customMessage, setCustomMessage] = useState('');
  const [customScript, setCustomScript] = useState('');
  
  // UI Tabs & Audio
  const [activeTab, setActiveTab] = useState<'preview' | 'sms-edit' | 'voice-edit'>('preview');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // Sync recipient phone if twilioConfig changes
  useEffect(() => {
    if (twilioConfig?.testToNumber) {
      setRecipientPhone(twilioConfig.testToNumber);
    }
  }, [twilioConfig?.testToNumber]);

  // Sync recipient name defaults based on recipientType
  useEffect(() => {
    if (recipientType === 'insurer' && recipientName === 'Sarah Jenkins') {
      setRecipientName('Insurance Operations Desk');
    } else if (recipientType === 'patient' && recipientName === 'Insurance Operations Desk') {
      setRecipientName('Sarah Jenkins');
    }
  }, [recipientType]);

  // Initialize templates when provider or parameters change
  useEffect(() => {
    if (provider) {
      if (recipientType === 'insurer') {
        setCustomMessage(buildInsurerDispatchMessage(provider, recipientName, userLocation, gapLevel, actionRequired));
        setCustomScript(buildInsurerDispatchVoiceScript(provider, recipientName, userLocation, gapLevel, actionRequired));
      } else {
        setCustomMessage(buildPatientAppointmentMessage(provider, recipientName, userLocation));
        setCustomScript(buildPatientAppointmentVoiceScript(provider, recipientName, userLocation));
      }
    }
  }, [provider, recipientName, userLocation, recipientType, gapLevel, actionRequired]);

  // Handle Voice Audio Playback via SpeechSynthesis
  const handlePlayVoicePreview = () => {
    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(customScript);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlayingVoice(false);
      utterance.onerror = () => setIsPlayingVoice(false);
      setIsPlayingVoice(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Stop speech on close
  const handleClose = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingVoice(false);
    onClose();
  };

  // Dispatch Notification
  const handleDispatch = async () => {
    if (!recipientPhone.trim()) {
      setErrorMessage('Please enter a valid recipient phone number.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      let smsResult: NotificationRecord | null = null;
      let callResult: NotificationRecord | null = null;

      const parseResponse = async (res: Response) => {
        const contentType = res.headers.get('content-type');
        let data: any = null;
        if (contentType && contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          if (res.status === 502 || res.status === 503 || res.status === 504) {
            throw new Error(`Backend server is offline (HTTP ${res.status}). Please ensure the FastAPI backend is running on port 8000.`);
          }
          throw new Error(text.substring(0, 100) || `Server response error (${res.status}): Unexpected end of input`);
        }

        if (data && data.success === false) {
          throw new Error(data.error || 'Failed to dispatch notification.');
        }

        return data;
      };

      // 1. Send SMS if channel is 'sms' or 'both'
      if (channel === 'sms' || channel === 'both') {
        const res = await fetch('/api/notify/sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientPhone,
            recipientName,
            recipientType,
            gapLevel,
            actionRequired,
            providerId: provider.id,
            customMessage,
            userLocation
          })
        });

        const data = await parseResponse(res);
        if (!res.ok) throw new Error(data.error || 'Failed to dispatch SMS');
        smsResult = data.record;
      }

      // 2. Place Call if channel is 'call' or 'both'
      if (channel === 'call' || channel === 'both') {
        const res = await fetch('/api/notify/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientPhone,
            recipientName,
            recipientType,
            gapLevel,
            actionRequired,
            providerId: provider.id,
            customScript,
            userLocation
          })
        });

        const data = await parseResponse(res);
        if (!res.ok) throw new Error(data.error || 'Failed to place call');
        callResult = data.record;
      }

      if (smsResult) onDispatchSuccess(smsResult);
      if (callResult && channel === 'call') onDispatchSuccess(callResult);

      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while sending notification.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#2D2D2A]/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        id="notification-dispatch-modal"
        className="bg-[#FDFCF7] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#EBE8DF] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-[#2D2D2A] px-6 py-4 text-[#F7F5F0] flex items-center justify-between border-b border-[#3E3E38]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#526D5B] flex items-center justify-center text-white shadow-md shadow-[#526D5B]/30">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-serif font-bold text-[#F7F5F0]">
                  Dispatch Provider Match Notification
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#526D5B]/30 text-[#A2BAA9] border border-[#526D5B]/40">
                  Twilio Engine
                </span>
              </div>
              <p className="text-xs text-[#B8B8AD]">
                Send structured SMS & automated voice call with Provider ID (NPI) & location details
              </p>
            </div>
          </div>

          <button
            id="btn-close-dispatch-modal"
            onClick={handleClose}
            className="text-[#B8B8AD] hover:text-white p-1.5 rounded-xl hover:bg-[#3E3E38] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Inputs & Customization */}
          <div className="lg:col-span-7 space-y-5">
            {/* Target Provider Summary Box */}
            <div className="bg-[#EBF0EA] border border-[#D9E2D5] rounded-2xl p-4 text-xs text-[#43433E] flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-serif font-bold text-[#2D2D2A] text-sm">{provider.name}</span>
                  <span className="font-mono bg-[#D9E2D5] text-[#526D5B] px-2 py-0.5 rounded font-bold text-[11px]">
                    NPI: {provider.npi}
                  </span>
                </div>
                <p className="text-[#6B6B61]">{provider.specialty} • {provider.clinicName}</p>
                <p className="text-[#8A8A80] flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-[#526D5B]" />
                  <span>{provider.address}, {provider.city} (~{provider.distanceMiles} mi)</span>
                </p>
              </div>
              <span className="text-[11px] font-semibold bg-[#FAF3EB] text-[#A8743A] px-2.5 py-0.5 rounded-full border border-[#F0E4D4] shrink-0">
                {provider.networkTier}
              </span>
            </div>

            {/* Notification Audience / Template Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#43433E]">
                Select Notification Audience & Template
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="recipient-type-btn-patient"
                  onClick={() => setRecipientType('patient')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                    recipientType === 'patient'
                      ? 'bg-[#526D5B] text-white border-[#526D5B] shadow-xs'
                      : 'bg-[#F7F5F0] text-[#43433E] border-[#EBE8DF] hover:bg-[#EBE8DF]'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <span className="block font-bold">Patient Appointment</span>
                    <span className="text-[10px] opacity-80 block">Member scheduling reminder</span>
                  </div>
                </button>

                <button
                  type="button"
                  id="recipient-type-btn-insurer"
                  onClick={() => setRecipientType('insurer')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                    recipientType === 'insurer'
                      ? 'bg-[#526D5B] text-white border-[#526D5B] shadow-xs'
                      : 'bg-[#F7F5F0] text-[#43433E] border-[#EBE8DF] hover:bg-[#EBE8DF]'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <span className="block font-bold">Insurer Dispatch Alert</span>
                    <span className="text-[10px] opacity-80 block">Gap Level & Ref ID alert</span>
                  </div>
                </button>
              </div>

              {/* Insurer specific parameters */}
              {recipientType === 'insurer' && (
                <div className="p-3 bg-[#FAF3EB] border border-[#F0E4D4] rounded-xl grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A8743A] mb-1">Gap Risk Level</label>
                    <select
                      value={gapLevel}
                      onChange={(e) => setGapLevel(e.target.value)}
                      className="w-full bg-white border border-[#F0E4D4] rounded-lg px-2 py-1 text-xs text-[#2D2D2A]"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MODERATE">MODERATE</option>
                      <option value="ADEQUATE">ADEQUATE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A8743A] mb-1">Action Required Flag</label>
                    <button
                      type="button"
                      onClick={() => setActionRequired(!actionRequired)}
                      className={`w-full py-1 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                        actionRequired
                          ? 'bg-[#FDF2F0] text-[#B84A39] border-[#F0D5D1]'
                          : 'bg-[#EBF0EA] text-[#526D5B] border-[#D9E2D5]'
                      }`}
                    >
                      {actionRequired ? 'ACTION REQUIRED: YES' : 'ACTION REQUIRED: NONE'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#43433E] flex items-center space-x-1">
                  <User className="w-3 h-3 text-[#526D5B]" />
                  <span>Recipient Member Name</span>
                </label>
                <input
                  id="input-recipient-name"
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-[#F7F5F0] border border-[#EBE8DF] rounded-xl px-3 py-2 text-xs font-medium text-[#2D2D2A] focus:bg-white focus:ring-2 focus:ring-[#526D5B] focus:outline-none"
                  placeholder="e.g. Robert Martinez"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#43433E] flex items-center space-x-1">
                  <Phone className="w-3 h-3 text-[#526D5B]" />
                  <span>Recipient Phone Number</span>
                </label>
                <input
                  id="input-recipient-phone"
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full bg-[#F7F5F0] border border-[#EBE8DF] rounded-xl px-3 py-2 text-xs font-mono font-medium text-[#2D2D2A] focus:bg-white focus:ring-2 focus:ring-[#526D5B] focus:outline-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {/* Location context */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#43433E] flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-[#526D5B]" />
                <span>Patient Search Location</span>
              </label>
              <input
                id="input-dispatch-location"
                type="text"
                value={userLocation}
                onChange={(e) => setUserLocation(e.target.value)}
                className="w-full bg-[#F7F5F0] border border-[#EBE8DF] rounded-xl px-3 py-2 text-xs font-medium text-[#2D2D2A] focus:bg-white focus:ring-2 focus:ring-[#526D5B] focus:outline-none"
                placeholder="e.g. Chennai, TN 600034"
              />
            </div>

            {/* Notification Channel Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#43433E]">
                Select Notification Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="channel-btn-both"
                  onClick={() => setChannel('both')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                    channel === 'both'
                      ? 'bg-[#526D5B] text-white border-[#526D5B] shadow-sm shadow-[#526D5B]/20'
                      : 'bg-[#F7F5F0] text-[#43433E] border-[#EBE8DF] hover:bg-[#EBE8DF]'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>+</span>
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px]">SMS + Voice Call</span>
                </button>

                <button
                  type="button"
                  id="channel-btn-sms"
                  onClick={() => setChannel('sms')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                    channel === 'sms'
                      ? 'bg-[#526D5B] text-white border-[#526D5B] shadow-sm shadow-[#526D5B]/20'
                      : 'bg-[#F7F5F0] text-[#43433E] border-[#EBE8DF] hover:bg-[#EBE8DF]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="text-[11px]">SMS Only</span>
                </button>

                <button
                  type="button"
                  id="channel-btn-call"
                  onClick={() => setChannel('call')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                    channel === 'call'
                      ? 'bg-[#526D5B] text-white border-[#526D5B] shadow-sm shadow-[#526D5B]/20'
                      : 'bg-[#F7F5F0] text-[#43433E] border-[#EBE8DF] hover:bg-[#EBE8DF]'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Voice Call Only</span>
                </button>
              </div>
            </div>

            {/* Editable Templates Tabs */}
            <div className="space-y-2 pt-1">
              <div className="flex border-b border-[#EBE8DF] text-xs">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`pb-2 px-3 font-semibold border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'preview' ? 'border-[#526D5B] text-[#526D5B]' : 'border-transparent text-[#8A8A80] hover:text-[#43433E]'
                  }`}
                >
                  Live Smartphone Preview
                </button>
                <button
                  onClick={() => setActiveTab('sms-edit')}
                  className={`pb-2 px-3 font-semibold border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'sms-edit' ? 'border-[#526D5B] text-[#526D5B]' : 'border-transparent text-[#8A8A80] hover:text-[#43433E]'
                  }`}
                >
                  Edit SMS Text
                </button>
                <button
                  onClick={() => setActiveTab('voice-edit')}
                  className={`pb-2 px-3 font-semibold border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'voice-edit' ? 'border-[#526D5B] text-[#526D5B]' : 'border-transparent text-[#8A8A80] hover:text-[#43433E]'
                  }`}
                >
                  Edit Voice Script
                </button>
              </div>

              {activeTab === 'sms-edit' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#526D5B]">
                      Predefined Specialty Template: {provider.specialty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomMessage(getPredefinedSpecialtyMessage(provider, recipientName))}
                      className="px-2.5 py-1 rounded-lg bg-[#EBF0EA] hover:bg-[#D9E2D5] text-[#526D5B] text-[11px] font-semibold transition-colors cursor-pointer border border-[#D9E2D5]"
                    >
                      Use Predefined {provider.specialty} Template
                    </button>
                  </div>
                  <textarea
                    id="textarea-custom-sms"
                    rows={6}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full bg-[#F7F5F0] border border-[#EBE8DF] rounded-xl p-3 text-xs font-mono text-[#2D2D2A] focus:bg-white focus:ring-2 focus:ring-[#526D5B] focus:outline-none leading-relaxed"
                  />
                  <div className="flex justify-between text-[11px] text-[#8A8A80]">
                    <span>{customMessage.length} characters</span>
                    <span>Supports Twilio GSM-7 / Predefined Templates</span>
                  </div>
                </div>
              )}

              {activeTab === 'voice-edit' && (
                <div className="space-y-2">
                  <textarea
                    id="textarea-custom-voice"
                    rows={6}
                    value={customScript}
                    onChange={(e) => setCustomScript(e.target.value)}
                    className="w-full bg-[#F7F5F0] border border-[#EBE8DF] rounded-xl p-3 text-xs text-[#2D2D2A] focus:bg-white focus:ring-2 focus:ring-[#526D5B] focus:outline-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handlePlayVoicePreview}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isPlayingVoice
                          ? 'bg-[#FAF3EB] text-[#A8743A] border border-[#F0E4D4]'
                          : 'bg-[#F7F5F0] hover:bg-[#EBE8DF] text-[#43433E] border border-[#EBE8DF]'
                      }`}
                    >
                      {isPlayingVoice ? <VolumeX className="w-3.5 h-3.5 text-[#A8743A]" /> : <Volume2 className="w-3.5 h-3.5 text-[#526D5B]" />}
                      <span>{isPlayingVoice ? 'Stop Audio Preview' : 'Listen Voice TwiML Audio Preview'}</span>
                    </button>
                    <span className="text-[11px] text-[#8A8A80]">Amazon Polly Neural Voice</span>
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-[#FDF2F0] border border-[#F0D5D1] text-xs text-[#B84A39] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-[#B84A39] shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Right Column: Virtual Smartphone SMS Mockup */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#F7F5F0] p-5 rounded-2xl border border-[#EBE8DF]">
            <div className="text-xs font-bold text-[#43433E] mb-3 flex items-center space-x-1.5">
              <Smartphone className="w-4 h-4 text-[#526D5B]" />
              <span>Real-Time Member Device Preview</span>
            </div>

            {/* iPhone Mockup Frame */}
            <div className="w-full max-w-[300px] bg-[#2D2D2A] rounded-[2.5rem] p-3 shadow-xl border-4 border-[#3E3E38] relative">
              {/* Camera Notch */}
              <div className="w-24 h-4 bg-[#3E3E38] rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#1F1F1C] mr-2" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#2D2D2A]" />
              </div>

              {/* Screen Content */}
              <div className="bg-[#1F1F1C] rounded-[1.8rem] p-3 text-white min-h-[380px] flex flex-col justify-between text-xs font-sans">
                {/* Header info */}
                <div className="text-center pb-2 border-b border-[#3E3E38]">
                  <p className="font-serif font-bold text-xs text-[#F7F5F0]">HealthNet Care Alert</p>
                  <p className="text-[10px] text-[#B8B8AD] font-mono">+1 (800) 555-0190</p>
                </div>

                {/* Message Bubble */}
                <div className="my-auto space-y-2 py-2">
                  <div className="text-[10px] text-center text-[#8A8A80]">Today {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="bg-[#526D5B] text-white rounded-2xl rounded-tl-xs p-3 text-[11px] leading-relaxed shadow-sm font-sans whitespace-pre-line break-words border border-[#6B8A74]">
                    {customMessage}
                  </div>
                  <div className="text-[9px] text-right text-[#8A8A80] flex items-center justify-end space-x-1">
                    <span>Delivered via Twilio</span>
                    <Check className="w-2.5 h-2.5 text-[#A2BAA9]" />
                  </div>
                </div>

                {/* Voice Call Pill if enabled */}
                {(channel === 'call' || channel === 'both') && (
                  <div className="bg-[#2B3830] border border-[#526D5B]/50 rounded-xl p-2.5 text-[10px] text-[#A2BAA9] flex items-center space-x-2 mt-1">
                    <Phone className="w-3.5 h-3.5 text-[#A2BAA9] shrink-0 animate-pulse" />
                    <div>
                      <p className="font-bold text-white">Automated Call Configured</p>
                      <p className="text-[9px] text-[#A2BAA9]">Plays TwiML speech script</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="bg-[#F7F5F0] px-6 py-4 border-t border-[#EBE8DF] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#6B6B61] flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#526D5B]" />
            <span>Encrypted HIPAA-compliant transmission via Twilio Telephony REST API</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              id="btn-cancel-dispatch"
              type="button"
              onClick={handleClose}
              className="w-1/2 sm:w-auto px-4 py-2 text-xs font-semibold text-[#43433E] bg-white hover:bg-[#EBE8DF] border border-[#EBE8DF] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="btn-confirm-send-notification"
              type="button"
              disabled={isSending}
              onClick={handleDispatch}
              className="w-1/2 sm:w-auto px-5 py-2 text-xs font-bold text-white bg-[#526D5B] hover:bg-[#435B4B] active:bg-[#384C3E] disabled:opacity-50 rounded-xl shadow-md shadow-[#526D5B]/20 hover:shadow-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {isSending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Notification Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
