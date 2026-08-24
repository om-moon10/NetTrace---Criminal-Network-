import React, { useEffect } from 'react';
import { 
  Network, 
  Target, 
  Zap, 
  FileSpreadsheet, 
  History, 
  BrainCircuit, 
  FileText, 
  X, 
  Shield, 
  FolderLock, 
  Sparkles, 
  Plus, 
  FileDown, 
  ChevronRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { TabView } from './NavigationTabs';
import { InvestigationCase } from '../../types';

interface MobileNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
  currentCase?: InvestigationCase;
  cases?: InvestigationCase[];
  onSelectCase?: (c: InvestigationCase) => void;
  nodesCount: number;
  targetsCount: number;
  evidenceLogsCount: number;
  onOpenAddEvidence?: () => void;
  onOpenCopilot?: () => void;
  onExportReport?: () => void;
}

export const MobileNavigationDrawer: React.FC<MobileNavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  currentCase,
  cases,
  onSelectCase,
  nodesCount,
  targetsCount,
  evidenceLogsCount,
  onOpenAddEvidence,
  onOpenCopilot,
  onExportReport,
}) => {
  const [showCaseList, setShowCaseList] = React.useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navItems = [
    {
      id: 'graph' as TabView,
      label: 'Command Center & Graph',
      subtitle: 'Network Graph Studio',
      icon: Network,
      badge: `${nodesCount} Entities`,
      badgeColor: 'bg-cyan-950 text-cyan-300 border border-cyan-800/80',
      description: 'Interactive Multi-Modal Topology & Centrality',
    },
    {
      id: 'prioritization' as TabView,
      label: 'Target Prioritization',
      subtitle: 'Kingpins & Facilitators',
      icon: Target,
      badge: `${targetsCount} High Risk`,
      badgeColor: 'bg-rose-950 text-rose-300 border border-rose-800/80',
      description: 'Centrality ranking & warrant readiness',
    },
    {
      id: 'simulation' as TabView,
      label: 'Disruption Simulator',
      subtitle: 'Network Simulation',
      icon: Zap,
      badge: 'What-If Engine',
      badgeColor: 'bg-amber-950 text-amber-400 border border-amber-800/80',
      description: 'Counterfactual fragmentation & impact models',
    },
    {
      id: 'ingestion' as TabView,
      label: 'Evidence Fusion',
      subtitle: 'Multi-Modal Ingestion',
      icon: FileSpreadsheet,
      badge: `${evidenceLogsCount} Feeds`,
      badgeColor: 'bg-indigo-950 text-indigo-300 border border-indigo-800/80',
      description: 'Blockchain, Telecom, IP & Domain parsers',
    },
    {
      id: 'timeline' as TabView,
      label: 'Timeline & Money Flow',
      subtitle: 'Chronological Telemetry',
      icon: History,
      badge: 'Live Scrubber',
      badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700',
      description: 'Transaction tracking & chronological reconstruction',
    },
    {
      id: 'ai_briefing' as TabView,
      label: 'AI Intelligence Briefing',
      subtitle: 'Syndicate MO & Warrants',
      icon: BrainCircuit,
      badge: 'Gemini AI',
      badgeColor: 'bg-cyan-950 text-cyan-300 border border-cyan-700',
      description: 'Automated executive analysis & subpoena drafting',
    },
    {
      id: 'case_dossier' as TabView,
      label: 'Reports & Case Dossier',
      subtitle: 'Chain of Custody',
      icon: FileText,
      badge: 'Audit Ready',
      badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-800/80',
      description: 'Cryptographic hash logs & court deliverables',
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        id="mobile-nav-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Panel */}
      <div 
        id="mobile-navigation-drawer"
        className="relative w-full max-w-xs sm:max-w-sm bg-slate-950 border-r border-slate-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-left duration-250 ease-out"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-950/50 border border-cyan-400/30">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">
                  NetTrace
                </span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-400 border border-cyan-800/70 font-semibold">
                  v3.4-INTEL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Criminal Network Intelligence</p>
            </div>
          </div>

          <button
            id="close-mobile-drawer-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Case Selector */}
        {currentCase && (
          <div className="p-3 border-b border-slate-800/60 bg-slate-900/30">
            <div className="text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center justify-between">
              <span>Active Investigation</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> LIVE
              </span>
            </div>
            
            <button
              id="mobile-drawer-case-btn"
              onClick={() => setShowCaseList(!showCaseList)}
              className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center space-x-2 truncate">
                <FolderLock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-200 truncate">{currentCase.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{currentCase.caseNumber}</div>
                </div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showCaseList ? 'rotate-90' : ''}`} />
            </button>

            {/* Case List Dropdown */}
            {showCaseList && cases && onSelectCase && (
              <div className="mt-2 p-1 bg-slate-900 border border-slate-800 rounded-lg space-y-1 max-h-48 overflow-y-auto">
                {cases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCase(c);
                      setShowCaseList(false);
                    }}
                    className={`w-full text-left p-2 rounded text-xs transition-colors ${
                      c.id === currentCase.id ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/50' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold truncate">{c.title}</div>
                    <div className="text-[10px] font-mono text-slate-400 flex justify-between mt-0.5">
                      <span>{c.caseNumber}</span>
                      <span className="text-cyan-400">${(c.totalMonitoredFundsUSD / 1000000).toFixed(1)}M</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="px-2 py-1 text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Intelligence Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => {
                  onTabChange(item.id);
                  onClose();
                }}
                className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start space-x-3 border ${
                  isActive
                    ? 'bg-slate-900 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                    : 'text-slate-300 hover:bg-slate-900/60 hover:text-white border-transparent'
                }`}
              >
                <div className={`mt-0.5 p-1.5 rounded-md ${isActive ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60' : 'bg-slate-900 text-slate-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold ml-1.5 flex-shrink-0 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Actions & Tasks */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {onOpenCopilot && (
              <button
                id="mobile-drawer-copilot-btn"
                onClick={() => {
                  onOpenCopilot();
                  onClose();
                }}
                className="flex items-center justify-center space-x-1.5 p-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-700/60 text-cyan-300 text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Copilot</span>
              </button>
            )}

            {onOpenAddEvidence && (
              <button
                id="mobile-drawer-evidence-btn"
                onClick={() => {
                  onOpenAddEvidence();
                  onClose();
                }}
                className="flex items-center justify-center space-x-1.5 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-slate-400" />
                <span>Add Evidence</span>
              </button>
            )}
          </div>

          {onExportReport && (
            <button
              id="mobile-drawer-export-btn"
              onClick={() => {
                onExportReport();
                onClose();
              }}
              className="w-full flex items-center justify-center space-x-1.5 p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow-md shadow-cyan-950/40"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Case Dossier</span>
            </button>
          )}

          <div className="text-[9px] font-mono text-center text-slate-500 pt-1">
            JCAT TASK FORCE // RESTRICTED ACCESS
          </div>
        </div>
      </div>
    </div>
  );
};
