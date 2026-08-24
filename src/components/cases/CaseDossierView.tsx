import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Lock, 
  Calendar, 
  User, 
  Building, 
  Save, 
  FileDown, 
  CheckCircle2, 
  Hash, 
  Copy, 
  Check 
} from 'lucide-react';
import { InvestigationCase, Entity } from '../../types';

interface CaseDossierViewProps {
  currentCase: InvestigationCase;
  onUpdateCase: (updated: Partial<InvestigationCase>) => void;
  onExportCase: () => void;
}

export const CaseDossierView: React.FC<CaseDossierViewProps> = ({
  currentCase,
  onUpdateCase,
  onExportCase,
}) => {
  const [notes, setNotes] = useState(currentCase.summary || '');
  const [status, setStatus] = useState(currentCase.status);
  const [classification, setClassification] = useState(currentCase.classification);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Mock cryptographic chain of custody records
  const auditLogs = [
    {
      id: 'aud-01',
      timestamp: '2025-02-23T14:22:15Z',
      actor: 'Special Agent Sarah Sterling (Badge #4891)',
      action: 'Disruption simulation executed: Seizure of OTC Broker TKs92x...',
      sha256: '9f83a8b23c9101ff8894231bca0921df67e21a830911fe84a9238910cb4190ef',
    },
    {
      id: 'aud-02',
      timestamp: '2025-02-21T09:00:00Z',
      actor: 'Taskforce Analyst Marcus Vance',
      action: 'Ingested UAE Commercial Registry Subpoena Extract (IFZA-991204)',
      sha256: '4a8109bf332901ee778401aa9912bc09df55a91823bc89110022fa9901ee7812',
    },
    {
      id: 'aud-03',
      timestamp: '2025-02-18T10:15:00Z',
      actor: 'Special Agent Sarah Sterling (Badge #4891)',
      action: 'Correlated Chainalysis Reactor trace into active topology graph',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    {
      id: 'aud-04',
      timestamp: '2025-01-14T08:30:00Z',
      actor: 'JCAT Cyber Division Automated Vault',
      action: 'Case opened and initial cryptographic root manifest signed',
      sha256: '88d4266fd4e6338d13b845fcf289579d209c897823b9217da3e161936f031589',
    },
  ];

  const handleSave = () => {
    onUpdateCase({
      summary: notes,
      status,
      classification,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Investigation Case Dossier & Chain of Custody
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Verified case metadata, evidence repository, and cryptographic SHA-256 audit ledger.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-md shadow-cyan-950/50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaved ? 'Dossier Saved!' : 'Save Changes'}</span>
          </button>

          <button
            onClick={onExportCase}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <FileDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Case File</span>
          </button>
        </div>
      </div>

      {/* Case Metadata & Status Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Main Case Info Box */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                  {currentCase.caseNumber}
                </span>
                <h2 className="text-lg font-bold text-slate-100 mt-0.5">{currentCase.title}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase">Lead Investigator</div>
                <div className="text-slate-200 font-semibold mt-0.5">{currentCase.leadInvestigator}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase">Taskforce / Agency</div>
                <div className="text-slate-200 font-semibold mt-0.5">{currentCase.agency}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase">Monitored Inflows</div>
                <div className="text-emerald-400 font-bold mt-0.5">
                  ${(currentCase.totalMonitoredFundsUSD / 1000000).toFixed(1)}M USD
                </div>
              </div>
            </div>

            {/* Editable Classification & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Investigation Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
                >
                  <option value="active">Active Investigation</option>
                  <option value="in_review">Prosecutorial Review</option>
                  <option value="indictment_ready">Indictment Ready (Grand Jury)</option>
                  <option value="archived">Archived / Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Classification Handling Caveat
                </label>
                <select
                  value={classification}
                  onChange={(e) => setClassification(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
                >
                  <option value="TLP:AMBER">TLP:AMBER // LIMITED DISCLOSURE</option>
                  <option value="TLP:RED">TLP:RED // RESTRICTED TO PARTICIPANTS</option>
                  <option value="SECRET//NOFORN">SECRET//NOFORN</option>
                  <option value="LAW ENFORCEMENT SENSITIVE">LAW ENFORCEMENT SENSITIVE</option>
                </select>
              </div>
            </div>

            {/* Working Hypothesis & Notes Editor */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Investigator Case Summary & Working Hypotheses
              </label>
              <textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-3 text-xs text-slate-100 focus:outline-none font-sans leading-relaxed resize-y"
              />
            </div>
          </div>
        </div>

        {/* Right Col: Cryptographic Chain-of-Custody SHA-256 Ledger */}
        <div className="space-y-4">
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-200">Cryptographic Chain-of-Custody</h3>
            </div>
            <p className="text-xs text-slate-400 font-mono mb-3">
              SHA-256 verifiable timestamps and action provenance for court admissibility.
            </p>

            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="text-cyan-400 font-bold">{log.actor}</span>
                    <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-200 text-xs font-sans leading-tight">
                    {log.action}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-850 text-[10px]">
                    <span className="text-slate-500 truncate max-w-[200px]">
                      SHA: {log.sha256.slice(0, 16)}...
                    </span>
                    <button
                      onClick={() => copyHash(log.sha256)}
                      className="text-slate-400 hover:text-cyan-300 transition-colors"
                      title="Copy Full SHA-256 Hash"
                    >
                      {copiedHash === log.sha256 ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
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
