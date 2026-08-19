import React from 'react';
import { X, CheckCircle2, Key, Phone, Info } from 'lucide-react';
import type { TwilioConfigStatus } from '../types';

interface TwilioConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TwilioConfigStatus | null;
  onRefresh: () => void;
}

export const TwilioConfigModal: React.FC<TwilioConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onRefresh
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#2D2D2A]/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FDFCF7] rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#EBE8DF] space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE8DF]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#526D5B] text-white flex items-center justify-center font-serif font-bold text-sm">
              T
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#2D2D2A]">Twilio Telephony Status & Credentials</h3>
              <p className="text-xs text-[#8A8A80]">Carrier API & Sandbox Environment</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#8A8A80] hover:text-[#2D2D2A] p-1.5 rounded-xl hover:bg-[#EBE8DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Card */}
        <div
          className={`p-4 rounded-2xl border flex items-start space-x-3 text-xs ${
            config?.isLive
              ? 'bg-[#EBF0EA] border-[#D9E2D5] text-[#2D2D2A]'
              : 'bg-[#FAF3EB] border-[#F0E4D4] text-[#2D2D2A]'
          }`}
        >
          {config?.isLive ? (
            <CheckCircle2 className="w-5 h-5 text-[#526D5B] shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-[#A8743A] shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-serif font-bold text-sm text-[#2D2D2A]">
              {config?.isLive ? 'Live Twilio Credentials Active' : 'Interactive Sandbox Simulation Active'}
            </p>
            <p className="leading-relaxed text-[#6B6B61]">
              {config?.isLive
                ? 'SMS and Voice calls are dispatched directly through your configured Twilio carrier account.'
                : 'The system is running in high-fidelity Sandbox Simulation mode. All dispatches simulate realistic carrier latency, generate authentic Twilio SIDs (SM.../CA...), and progress delivery statuses automatically without burning Twilio account balance.'}
            </p>
          </div>
        </div>

        {/* Trial Account SMS Verification Guidance */}
        {config?.isLive && (
          <div className="p-3.5 rounded-2xl bg-[#FAF3EB] border border-[#F0E4D4] text-xs text-[#A8743A] flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-[#A8743A] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-[#2D2D2A]">SMS Delivery Requirement for Twilio Trial Accounts:</p>
              <p className="text-[11px] leading-relaxed text-[#6B6B61]">
                Twilio Trial accounts require your recipient phone number (<strong className="text-[#2D2D2A]">{config?.testToNumber || '+918610848428'}</strong>) to be added to 
                <a href="https://console.twilio.com/us1/develop/phone-numbers/manage/verified" target="_blank" rel="noreferrer" className="underline font-semibold ml-1 text-[#A8743A]">
                  Verified Caller IDs in Twilio Console
                </a> before Twilio allows outbound SMS to international destinations.
              </p>
            </div>
          </div>
        )}

        {/* Environment Variable Breakdown */}
        <div className="space-y-2.5 text-xs">
          <span className="font-bold text-[#2D2D2A] block">Required Environment Variables (.env.example):</span>

          <div className="space-y-2 font-mono">
            <div className="flex items-center justify-between p-3 bg-[#F7F5F0] border border-[#EBE8DF] rounded-xl">
              <div className="flex items-center space-x-2">
                <Key className="w-3.5 h-3.5 text-[#8A8A80]" />
                <span className="text-[#43433E]">TWILIO_ACCOUNT_SID</span>
              </div>
              <span className={`text-[11px] font-sans font-bold px-2.5 py-0.5 rounded-full border ${
                config?.hasAccountSid ? 'bg-[#EBF0EA] text-[#526D5B] border-[#D9E2D5]' : 'bg-[#FAF3EB] text-[#A8743A] border-[#F0E4D4]'
              }`}>
                {config?.hasAccountSid ? 'Configured' : 'Sandbox Fallback'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F7F5F0] border border-[#EBE8DF] rounded-xl">
              <div className="flex items-center space-x-2">
                <Key className="w-3.5 h-3.5 text-[#8A8A80]" />
                <span className="text-[#43433E]">TWILIO_AUTH_TOKEN</span>
              </div>
              <span className={`text-[11px] font-sans font-bold px-2.5 py-0.5 rounded-full border ${
                config?.hasAuthToken ? 'bg-[#EBF0EA] text-[#526D5B] border-[#D9E2D5]' : 'bg-[#FAF3EB] text-[#A8743A] border-[#F0E4D4]'
              }`}>
                {config?.hasAuthToken ? 'Configured' : 'Sandbox Fallback'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F7F5F0] border border-[#EBE8DF] rounded-xl">
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-[#8A8A80]" />
                <span className="text-[#43433E]">TWILIO_SMS_FROM</span>
              </div>
              <span className={`text-[11px] font-sans font-bold px-2.5 py-0.5 rounded-full border ${
                config?.hasPhoneNumber ? 'bg-[#EBF0EA] text-[#526D5B] border-[#D9E2D5]' : 'bg-[#FAF3EB] text-[#A8743A] border-[#F0E4D4]'
              }`}>
                {config?.hasPhoneNumber ? config.phoneNumber : 'Sandbox Test Number'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F7F5F0] border border-[#EBE8DF] rounded-xl">
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-[#8A8A80]" />
                <span className="text-[#43433E]">TWILIO_WHATSAPP_NUMBER</span>
              </div>
              <span className={`text-[11px] font-sans font-bold px-2.5 py-0.5 rounded-full border ${
                config?.hasWhatsappNumber ? 'bg-[#EBF0EA] text-[#526D5B] border-[#D9E2D5]' : 'bg-[#FAF3EB] text-[#A8743A] border-[#F0E4D4]'
              }`}>
                {config?.hasWhatsappNumber ? config.whatsappNumber : 'Sandbox WhatsApp Line'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F7F5F0] border border-[#EBE8DF] rounded-xl">
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-[#8A8A80]" />
                <span className="text-[#43433E]">TEST_TO_NUMBER</span>
              </div>
              <span className="text-[11px] font-sans font-bold px-2.5 py-0.5 rounded-full border bg-[#EBF0EA] text-[#526D5B] border-[#D9E2D5]">
                {config?.testToNumber || '+918610848428'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#EBE8DF] flex items-center justify-between">
          <button
            onClick={onRefresh}
            className="text-xs font-semibold text-[#526D5B] hover:text-[#435B4B] p-1 cursor-pointer"
          >
            Re-check Environment
          </button>
          
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#526D5B] hover:bg-[#435B4B] text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-[#526D5B]/20 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
