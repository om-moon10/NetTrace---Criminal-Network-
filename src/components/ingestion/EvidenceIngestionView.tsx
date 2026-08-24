import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Database, 
  Sliders, 
  Hash,
  Globe,
  Wallet
} from 'lucide-react';
import { IngestionLog, InvestigationCase } from '../../types';

interface EvidenceIngestionViewProps {
  currentCase: InvestigationCase;
  ingestionLogs: IngestionLog[];
  onIngestEvidence: (payload: {
    sourceName: string;
    sourceType: string;
    rawContent: string;
    confidenceWeight: number;
  }) => Promise<void>;
  onOpenManualAdd: () => void;
}

export const EvidenceIngestionView: React.FC<EvidenceIngestionViewProps> = ({
  currentCase,
  ingestionLogs,
  onIngestEvidence,
  onOpenManualAdd,
}) => {
  const [sourceName, setSourceName] = useState('');
  const [sourceType, setSourceType] = useState('threat_feed');
  const [rawContent, setRawContent] = useState('');
  const [confidenceWeight, setConfidenceWeight] = useState(95);
  const [isIngesting, setIsIngesting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live Regex Pre-Detection
  const detected = React.useMemo(() => {
    if (!rawContent.trim()) return { ips: [], cryptos: [], emails: [], domains: [] };
    const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
    const ethRegex = /\b0x[a-fA-F0-9]{40}\b/g;
    const btcRegex = /\b(?:1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{39,59})\b/g;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const domainRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|onion|is|cc|ru|ch|me|info|biz)\b/gi;

    return {
      ips: Array.from(new Set(rawContent.match(ipRegex) || [])),
      cryptos: Array.from(new Set([...(rawContent.match(ethRegex) || []), ...(rawContent.match(btcRegex) || [])])),
      emails: Array.from(new Set(rawContent.match(emailRegex) || [])),
      domains: Array.from(new Set(rawContent.match(domainRegex) || [])),
    };
  }, [rawContent]);

  const totalDetected =
    detected.ips.length + detected.cryptos.length + detected.emails.length + detected.domains.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawContent.trim()) return;
    setIsIngesting(true);
    setSuccessMessage(null);

    try {
      await onIngestEvidence({
        sourceName: sourceName || 'Manual Ingestion Feed',
        sourceType,
        rawContent,
        confidenceWeight,
      });

      setSuccessMessage(`Successfully extracted and correlated ${totalDetected} new indicators into ${currentCase.title}!`);
      setRawContent('');
      setSourceName('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsIngesting(false);
    }
  };

  const loadPreset = (type: 'reactor' | 'ioc' | 'bank') => {
    if (type === 'reactor') {
      setSourceName('Chainalysis Reactor Cross-Chain Trace');
      setSourceType('blockchain_tx');
      setRawContent(`tx_hash,from_address,to_address,amount_usd,currency,timestamp
0x9b11cf298a00b12e341...fa4,0x71C38294B12C4E92,0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045,4500000,USDT,2025-02-21T18:00:00Z
0x38fa091bb22c01994a...,0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045,bc1q98xfg7729p...22za,2100000,BTC,2025-02-22T04:12:00Z`);
    } else if (type === 'ioc') {
      setSourceName('DarkWeb IOC & Fast-Flux Tracker');
      setSourceType('threat_feed');
      setRawContent(`INDICATORS RECORD:
Primary C2 Gateway: 195.123.245.10
Secondary Mirror: 185.190.140.22
Domain: hydra-market-node3.onion
Domain: phantom-pay-escrow.is
Admin Contact: shadow.broker@proton.me`);
    } else if (type === 'bank') {
      setSourceName('Foreign Financial Intelligence Unit Subpoena Extract');
      setSourceType('bank_subpoena');
      setRawContent(`FINANCIAL INTELLIGENCE UNIT (FIU) REPORT:
Account: AE44 0330 0000 1928 3829 01
Beneficiary Entity: Aegis Horizon Global FZE
Associated Email: elena.rostova@consult-ae.com
Wire Clearing Partner: Emirates Commercial Bank
Wire Volume Inflow: $18,400,000 USD`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Evidence Fusion & Multi-Modal Ingestion Engine
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Ingest heterogeneous digital evidence, extract entities via regex heuristics, and auto-fuse into the network graph.
          </p>
        </div>

        <button
          onClick={onOpenManualAdd}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Add Custom Entity or Edge</span>
        </button>
      </div>

      {/* Ingestion Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Parser Form & Live Entity Detection */}
        <div className="lg:col-span-2 space-y-4">
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-cyan-400" /> Ingest Raw Evidence Stream
              </span>

              {/* Sample Presets */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Presets:</span>
                <button
                  type="button"
                  onClick={() => loadPreset('reactor')}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300"
                >
                  Crypto CSV
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('ioc')}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-purple-300"
                >
                  Threat Feed
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('bank')}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-emerald-300"
                >
                  Bank FIU
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Source / Document Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chainalysis Reactor Export, Subpoena Log"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Evidence Modality
                </label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="blockchain_tx">Blockchain Ledger / Reactor CSV</option>
                  <option value="threat_feed">Threat Intelligence / Shodan Indicators</option>
                  <option value="whois_dump">DNS / Whois Registry Records</option>
                  <option value="pcap_flow">PCAP Traffic Flow & Netflows</option>
                  <option value="bank_subpoena">Banking / FIU Subpoena Production</option>
                  <option value="phone_cdr">Phone Call Detail Records (CDR)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Raw Text, Logs, Hashes, or CSV Data
                </label>
                <span className="text-[10px] font-mono text-cyan-400">
                  {totalDetected} Entities Detected
                </span>
              </div>
              <textarea
                rows={7}
                placeholder="Paste CSV rows, IP addresses, cryptocurrency addresses (BTC/ETH/Tron), domain names, email headers, or raw server logs..."
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none font-mono resize-y"
              />
            </div>

            {/* Live Detected Entities Preview Chips */}
            {totalDetected > 0 && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Pre-Parsed Identifiers to Fuse:
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {detected.ips.map((ip) => (
                    <span
                      key={ip}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800 flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3 text-purple-400" /> {ip}
                    </span>
                  ))}
                  {detected.cryptos.map((crypto) => (
                    <span
                      key={crypto}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800 flex items-center gap-1"
                    >
                      <Wallet className="w-3 h-3 text-amber-400" /> {crypto.slice(0, 8)}...{crypto.slice(-4)}
                    </span>
                  ))}
                  {detected.domains.map((dom) => (
                    <span
                      key={dom}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-pink-950/80 text-pink-300 border border-pink-800"
                    >
                      🌐 {dom}
                    </span>
                  ))}
                  {detected.emails.map((em) => (
                    <span
                      key={em}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                    >
                      ✉️ {em}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Ingestion Confidence Weight</span>
                <span className="text-cyan-400 font-mono">{confidenceWeight}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={confidenceWeight}
                onChange={(e) => setConfidenceWeight(Number(e.target.value))}
                className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 rounded-lg text-emerald-300 text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isIngesting || !rawContent.trim()}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center space-x-2"
            >
              {isIngesting ? (
                <span>Fusing Indicators into Investigation Graph...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Fuse & Correlate {totalDetected > 0 ? `(${totalDetected} Entities)` : ''}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Col: Ingestion History & Sources */}
        <div className="space-y-4">
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-xl">
            <h3 className="font-bold text-sm text-slate-200 mb-1 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" /> Ingested Evidence Feeds ({ingestionLogs.length})
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-3">
              Forensic log repository attached to {currentCase.caseNumber}.
            </p>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {ingestionLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 truncate pr-2">{log.sourceName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold">
                      {log.confidenceWeight}% Conf
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span className="capitalize">{log.sourceType.replace('_', ' ')}</span>
                    <span className="text-slate-500">
                      {new Date(log.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] pt-1 text-slate-400 border-t border-slate-850">
                    <span className="text-cyan-300 font-bold">{log.parsedEntitiesCount} Entities</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">{log.parsedEdgesCount} Edges</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
