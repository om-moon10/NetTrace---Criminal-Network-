import React, { useState, useEffect } from 'react';
import { FileText, X, Copy, Check, Sparkles, Scale, Download } from 'lucide-react';
import { Entity, InvestigationCase } from '../../types';

interface AffidavitGeneratorModalProps {
  isOpen: boolean;
  nodes: Entity[];
  currentCase: InvestigationCase;
  initialTargetNodeId?: string;
  onClose: () => void;
}

export const AffidavitGeneratorModal: React.FC<AffidavitGeneratorModalProps> = ({
  isOpen,
  nodes,
  currentCase,
  initialTargetNodeId,
  onClose,
}) => {
  const [targetId, setTargetId] = useState<string>(
    initialTargetNodeId || nodes[0]?.id || ''
  );
  const [affidavit, setAffidavit] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const targetNode = nodes.find((n) => n.id === targetId) || nodes[0];

  const generateAffidavit = async (nodeId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/warrant-affidavit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: currentCase.id,
          targetEntityId: nodeId,
        }),
      });
      const data = await res.json();
      setAffidavit(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && targetId) {
      generateAffidavit(targetId);
    }
  }, [isOpen, targetId]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!affidavit) return;
    const text = `${affidavit.affidavitTitle}
IN THE MATTER OF THE SEIZURE OF: ${affidavit.targetSubject} (${affidavit.targetIdentifier})
CASE FILE: ${currentCase.caseNumber}

PROBABLE CAUSE AFFIDAVIT:
${affidavit.probableCauseStatement}

REQUESTED RELIEF:
${affidavit.requestedRelief?.map((r: string) => `• ${r}`).join('\n')}

STATUTORY AUTHORITY & CITATIONS:
${affidavit.legalCitations?.join(', ')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-100 animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Legal Search Warrant & Seizure Affidavit Generator
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Entity Dropdown */}
        <div className="font-mono text-xs">
          <label className="block text-slate-400 mb-1 font-semibold uppercase">
            Select Interdiction Target:
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2 text-slate-200"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} — {n.label} ({n.role})
              </option>
            ))}
          </select>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs font-mono space-y-4">
          {isLoading ? (
            <div className="py-12 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
              <div className="text-slate-300">Drafting Probable Cause Legal Language...</div>
            </div>
          ) : affidavit ? (
            <>
              <div className="text-center border-b border-slate-800 pb-3">
                <div className="font-bold text-slate-100 text-sm">{affidavit.affidavitTitle}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  CASE REF: {currentCase.caseNumber} • JURISDICTION: {currentCase.agency}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                  Subject Identifier & Modality:
                </div>
                <div className="text-cyan-300 font-bold">
                  {affidavit.targetSubject} ({affidavit.targetIdentifier})
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                  Statement of Probable Cause:
                </div>
                <p className="text-slate-200 font-sans leading-relaxed bg-slate-900/60 p-3 rounded border border-slate-850">
                  {affidavit.probableCauseStatement}
                </p>
              </div>

              {affidavit.requestedRelief && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Requested Statutory Orders:
                  </div>
                  <div className="space-y-1.5 font-sans">
                    {affidavit.requestedRelief.map((relief: string, i: number) => (
                      <div key={i} className="flex items-start space-x-2 text-slate-300">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{relief}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {affidavit.legalCitations && (
                <div className="pt-2 border-t border-slate-850">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Statutory Citations:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {affidavit.legalCitations.map((cite: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px]"
                      >
                        {cite}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={handleCopy}
            disabled={isLoading || !affidavit}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Affidavit Copied!' : 'Copy Affidavit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
