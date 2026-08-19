import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  ShieldCheck
} from 'lucide-react';
import { INITIAL_PROVIDERS } from '../data/twilioProviders';
import type { Provider } from '../types';

interface TwilioCodeHubProps {
  selectedProviderId?: string;
  onSelectProvider: (provider: Provider) => void;
}

export const TwilioCodeHub: React.FC<TwilioCodeHubProps> = ({
  selectedProviderId,
  onSelectProvider
}) => {
  const [activeLang, setActiveLang] = useState<'nodejs' | 'python' | 'curl' | 'twiml'>('nodejs');
  const [currentProviderId, setCurrentProviderId] = useState<string>(selectedProviderId || 'US10230946');
  const [copied, setCopied] = useState(false);
  const [codeData, setCodeData] = useState<{
    nodeJsCode: string;
    pythonCode: string;
    curlCode: string;
    twimlCode: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/twilio/code-snippets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: currentProviderId,
        recipientPhone: '+13135550149',
        recipientName: 'Sarah Jenkins',
        userLocation: 'Detroit, MI 48201'
      })
    })
      .then(res => res.json())
      .then(data => setCodeData(data))
      .catch(err => console.error('Failed to load code snippets:', err));
  }, [currentProviderId]);

  const currentProvider = INITIAL_PROVIDERS.find(p => p.id === currentProviderId) || INITIAL_PROVIDERS[0];

  const handleCopyCode = () => {
    if (!codeData) return;
    let textToCopy = '';
    if (activeLang === 'nodejs') textToCopy = codeData.nodeJsCode;
    if (activeLang === 'python') textToCopy = codeData.pythonCode;
    if (activeLang === 'curl') textToCopy = codeData.curlCode;
    if (activeLang === 'twiml') textToCopy = codeData.twimlCode;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EBE8DF] shadow-sm shadow-[#526D5B]/5 p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EBE8DF]">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#526D5B] text-white flex items-center justify-center font-serif font-bold text-sm shadow-xs">
              T
            </div>
            <h2 className="text-xl font-serif font-bold text-[#2D2D2A]">
              Configured Twilio Telephony Code Generator
            </h2>
          </div>
          <p className="text-xs text-[#8A8A80] mt-1">
            Production-ready Twilio SMS & Voice code configured for your matched healthcare providers.
          </p>
        </div>

        {/* Quick Sample Provider Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#6B6B61]">Sample NPI:</span>
          <div className="flex items-center space-x-1.5">
            {INITIAL_PROVIDERS.slice(0, 3).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setCurrentProviderId(p.id);
                  onSelectProvider(p);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                  currentProviderId === p.id
                    ? 'bg-[#526D5B] text-white border-[#526D5B] shadow-xs'
                    : 'bg-[#F7F5F0] hover:bg-[#EBE8DF] text-[#43433E] border-[#EBE8DF]'
                }`}
              >
                {p.npi}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Provider Banner */}
      <div className="bg-[#EBF0EA] border border-[#D9E2D5] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-[#526D5B] tracking-wider">Configured Target Provider</span>
          <p className="font-serif font-bold text-[#2D2D2A] text-sm">
            {currentProvider.name} (NPI: <span className="font-mono text-[#526D5B]">{currentProvider.npi}</span>)
          </p>
          <p className="text-[#6B6B61]">
            {currentProvider.specialty} • {currentProvider.clinicName} • {currentProvider.address}, {currentProvider.city}
          </p>
        </div>

        <span className="self-start sm:self-center px-3 py-1 rounded-full bg-[#FAF3EB] text-[#A8743A] font-semibold border border-[#F0E4D4] text-[11px]">
          {currentProvider.networkTier}
        </span>
      </div>

      {/* Language Switcher & Copy Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#2D2D2A] px-5 py-3 rounded-t-2xl text-[#F7F5F0]">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setActiveLang('nodejs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeLang === 'nodejs'
                ? 'bg-[#526D5B] text-white shadow-xs'
                : 'text-[#B8B8AD] hover:text-white hover:bg-[#3E3E38]'
            }`}
          >
            Node.js / Express
          </button>

          <button
            onClick={() => setActiveLang('python')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeLang === 'python'
                ? 'bg-[#526D5B] text-white shadow-xs'
                : 'text-[#B8B8AD] hover:text-white hover:bg-[#3E3E38]'
            }`}
          >
            Python (twilio SDK)
          </button>

          <button
            onClick={() => setActiveLang('curl')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeLang === 'curl'
                ? 'bg-[#526D5B] text-white shadow-xs'
                : 'text-[#B8B8AD] hover:text-white hover:bg-[#3E3E38]'
            }`}
          >
            cURL / REST API
          </button>

          <button
            onClick={() => setActiveLang('twiml')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeLang === 'twiml'
                ? 'bg-[#526D5B] text-white shadow-xs'
                : 'text-[#B8B8AD] hover:text-white hover:bg-[#3E3E38]'
            }`}
          >
            TwiML Voice XML
          </button>
        </div>

        <button
          id="btn-copy-code-hub"
          onClick={handleCopyCode}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#3E3E38] hover:bg-[#4E4E46] text-[#A2BAA9] text-xs font-semibold border border-[#52524A] transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#A2BAA9]" />
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Block Container */}
      <div className="bg-[#1F1F1C] rounded-b-2xl p-5 overflow-x-auto text-xs font-mono text-[#F7F5F0] border border-t-0 border-[#3E3E38] max-h-[480px]">
        <pre className="leading-relaxed">
          <code>
            {activeLang === 'nodejs' && (codeData?.nodeJsCode || '// Loading Node.js snippet...')}
            {activeLang === 'python' && (codeData?.pythonCode || '# Loading Python snippet...')}
            {activeLang === 'curl' && (codeData?.curlCode || '# Loading cURL snippet...')}
            {activeLang === 'twiml' && (codeData?.twimlCode || '<!-- Loading TwiML snippet... -->')}
          </code>
        </pre>
      </div>

      {/* Integration Guide Steps */}
      <div className="bg-[#F7F5F0] rounded-2xl p-5 border border-[#EBE8DF] space-y-3 text-xs text-[#43433E]">
        <h4 className="font-serif font-bold text-[#2D2D2A] flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-[#526D5B]" />
          <span>How to use this in your insurance infrastructure:</span>
        </h4>
        <ol className="list-decimal list-inside space-y-2 pl-1 leading-relaxed text-[#6B6B61]">
          <li>
            <strong>Install Twilio SDK</strong>: <code className="bg-[#EBE8DF] text-[#2D2D2A] px-1.5 py-0.5 rounded-md font-mono">npm install twilio</code> (or <code className="bg-[#EBE8DF] text-[#2D2D2A] px-1.5 py-0.5 rounded-md font-mono">pip install twilio</code>).
          </li>
          <li>
            <strong>Set Environment Variables</strong>: Configure <code className="bg-[#EBE8DF] text-[#2D2D2A] px-1.5 py-0.5 rounded-md font-mono">TWILIO_ACCOUNT_SID</code>, <code className="bg-[#EBE8DF] text-[#2D2D2A] px-1.5 py-0.5 rounded-md font-mono">TWILIO_AUTH_TOKEN</code>, and <code className="bg-[#EBE8DF] text-[#2D2D2A] px-1.5 py-0.5 rounded-md font-mono">TWILIO_PHONE_NUMBER</code> in your environment.
          </li>
          <li>
            <strong>Dispatch with Provider ID & Location</strong>: Pass the matched Provider NPI (e.g. <code className="font-mono text-[#526D5B] font-bold">{currentProvider.npi}</code>), clinic address, and contact number in your SMS message body and Voice TwiML script.
          </li>
        </ol>
      </div>
    </div>
  );
};
