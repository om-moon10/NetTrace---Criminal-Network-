import React from 'react';
import { 
  Shield, 
  Search, 
  Plus, 
  Sparkles, 
  FileDown, 
  Clock, 
  FolderLock, 
  CheckCircle2, 
  ChevronDown,
  AlertTriangle,
  Cpu,
  Menu
} from 'lucide-react';
import { InvestigationCase, Entity } from '../../types';

interface HeaderProps {
  currentCase: InvestigationCase;
  cases: InvestigationCase[];
  onSelectCase: (c: InvestigationCase) => void;
  onOpenAddEvidence: () => void;
  onOpenCopilot: () => void;
  onSelectEntityFromSearch: (entity: Entity) => void;
  onExportReport: () => void;
  onOpenMobileDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCase,
  cases,
  onSelectCase,
  onOpenAddEvidence,
  onOpenCopilot,
  onSelectEntityFromSearch,
  onExportReport,
  onOpenMobileDrawer,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showCaseDropdown, setShowCaseDropdown] = React.useState(false);
  const [showSearchResults, setShowSearchResults] = React.useState(false);

  const filteredEntities = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return currentCase.nodes.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.name.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q) ||
        n.role.toLowerCase().includes(q) ||
        (n.metadata?.tags && n.metadata.tags.some((t) => t.toLowerCase().includes(q)))
    ).slice(0, 8);
  }, [searchQuery, currentCase.nodes]);

  return (
    <header className="bg-slate-950 border-b border-slate-800/80 sticky top-0 z-40 text-slate-100 shadow-xl">
      {/* Top Law Enforcement Classification Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-950 to-amber-950/80 px-3 sm:px-4 py-1 border-b border-amber-500/20 text-[11px] font-mono tracking-widest text-amber-400 flex items-center justify-between">
        <div className="flex items-center space-x-2 truncate">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          <span className="font-semibold uppercase tracking-wider truncate">
            {currentCase.classification} // LAW ENFORCEMENT & INTELLIGENCE ACCESS ONLY
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">JCAT CYBER TASK FORCE</span>
        </div>
        <div className="hidden lg:flex items-center space-x-4 text-slate-400 flex-shrink-0">
          <span>CASE REF: <span className="text-slate-200 font-semibold">{currentCase.caseNumber}</span></span>
          <span className="text-slate-600">/</span>
          <span>LEAD: <span className="text-slate-300">{currentCase.leadInvestigator}</span></span>
          <span className="text-slate-600">/</span>
          <span className="text-emerald-400 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> SECURE AUDIT LIVE
          </span>
        </div>
      </div>

      {/* Main Command Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2.5">
        {/* Left: Hamburger (Mobile) + Brand & Case Selector */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          {/* Mobile Hamburger Menu Button */}
          {onOpenMobileDrawer && (
            <button
              id="mobile-nav-hamburger-btn"
              onClick={onOpenMobileDrawer}
              className="md:hidden p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors flex-shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer flex-shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-950/50 border border-cyan-400/30">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">
                  NetTrace
                </span>
                <span className="hidden sm:inline-block text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold">
                  v3.4-INTEL
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-slate-400 -mt-0.5 font-mono">Criminal Network Intelligence</p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden lg:block" />

          {/* Case Dropdown */}
          <div className="relative hidden md:block">
            <button
              id="case-switcher-btn"
              onClick={() => setShowCaseDropdown(!showCaseDropdown)}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-slate-600 text-left transition-all text-xs"
            >
              <FolderLock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <div className="max-w-[150px] lg:max-w-[210px] truncate">
                <div className="font-medium text-slate-200 truncate">{currentCase.title}</div>
                <div className="text-[10px] text-slate-400 font-mono">{currentCase.caseNumber}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            </button>

            {showCaseDropdown && (
              <div className="absolute left-0 mt-1.5 w-80 bg-slate-900 rounded-lg shadow-2xl border border-slate-700 py-1.5 z-50 divide-y divide-slate-800">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Select Active Investigation
                </div>
                {cases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCase(c);
                      setShowCaseDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-start space-x-2.5 transition-colors hover:bg-slate-800 ${
                      c.id === currentCase.id ? 'bg-cyan-950/40 text-cyan-200' : 'text-slate-300'
                    }`}
                  >
                    <div className="mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-200 truncate">{c.title}</div>
                      <div className="text-[10px] font-mono text-slate-400 flex justify-between mt-0.5">
                        <span>{c.caseNumber}</span>
                        <span className="text-cyan-400 font-medium">
                          ${(c.totalMonitoredFundsUSD / 1000000).toFixed(1)}M USD
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle: Universal Search */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search wallet, IP, domain, alias..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full bg-slate-900/90 border border-slate-750 focus:border-cyan-500 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Search Results */}
          {showSearchResults && filteredEntities.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto">
              <div className="p-1.5 bg-slate-950 text-[10px] font-mono text-slate-400 px-3">
                Matched {filteredEntities.length} Entity Indicators
              </div>
              {filteredEntities.map((ent) => (
                <button
                  key={ent.id}
                  onClick={() => {
                    onSelectEntityFromSearch(ent);
                    setShowSearchResults(false);
                    setSearchQuery('');
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between border-b border-slate-800/50 last:border-0 text-xs transition-colors"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        ent.threatLevel === 'critical'
                          ? 'bg-rose-500'
                          : ent.threatLevel === 'high'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <div className="truncate">
                      <div className="font-semibold text-slate-200 truncate">{ent.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">{ent.label}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {ent.role}
                    </span>
                    <div className="text-[10px] font-mono text-cyan-400 font-bold mt-0.5">
                      Risk: {ent.riskScore}/100
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
          {/* AI Copilot Trigger */}
          <button
            id="ai-copilot-btn"
            onClick={onOpenCopilot}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-900/40 to-blue-900/40 hover:from-cyan-800/60 hover:to-blue-800/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Open AI Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Add Evidence Modal Trigger */}
          <button
            id="add-evidence-btn"
            onClick={onOpenAddEvidence}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-slate-400" />
            <span>Add Evidence</span>
          </button>

          {/* Export Report */}
          <button
            id="export-dossier-btn"
            onClick={onExportReport}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-md shadow-cyan-950/40"
            title="Export Case Intelligence Dossier"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export Brief</span>
          </button>
        </div>
      </div>
    </header>
  );
};
