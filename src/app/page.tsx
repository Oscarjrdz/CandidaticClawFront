"use client";

import { useState, useEffect, useRef } from "react";
import { Activity, Terminal, Users, Play, Square, MessageSquare, Save, CheckCircle2, Cpu, Database, ChevronDown, Network, Settings } from "lucide-react";

const API_URL = "/api/vps";
const API_KEY = process.env.NEXT_PUBLIC_VPS_API_KEY || "super_secret_key_123";

export default function DashboardPage() {
  const [stats, setStats] = useState({ agentActive: false, activeConversations: 0, messagesToday: 0, candidatesTransferred: 0 });
  const [conversations, setConversations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [promptContent, setPromptContent] = useState("");
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [activeProject, setActiveProject] = useState("Candidatic CRM");
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStats();
    fetchConversations();
    fetchPrompt();

    const eventSource = new EventSource(`${API_URL}/api/admin/feed?token=${API_KEY}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLogs((prev) => [...prev, data]);
      } catch (e) {
        console.error("Error parseando SSE:", e);
      }
    };
    return () => eventSource.close();
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const headers = { "Content-Type": "application/json", "x-api-key": API_KEY };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, { headers });
      const data = await res.json();
      if (data.status === "success") setStats(data.data);
    } catch (e) { console.error("Error stats", e); }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/conversations`, { headers });
      const data = await res.json();
      if (data.status === "success") setConversations(data.data);
    } catch (e) { console.error("Error conv", e); }
  };

  const fetchPrompt = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/prompt`, { headers });
      const data = await res.json();
      if (data.status === "success") setPromptContent(data.data.prompt);
    } catch (e) { console.error("Error prompt", e); }
  };

  const toggleAgent = async (start: boolean) => {
    const endpoint = start ? "start" : "stop";
    try {
      await fetch(`${API_URL}/api/admin/${endpoint}`, { method: "POST", headers });
      fetchStats();
    } catch (e) { console.error("Error toggle", e); }
  };

  const savePrompt = async () => {
    setSavingPrompt(true);
    try {
      await fetch(`${API_URL}/api/admin/prompt`, {
        method: "PUT", headers, body: JSON.stringify({ prompt: promptContent })
      });
    } catch (e) {
      console.error("Error save prompt", e);
    } finally {
      setTimeout(() => setSavingPrompt(false), 1000);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Analizando') return <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs flex items-center gap-1"><Cpu size={12}/> Processing</span>;
    if (status === 'Esperando Respuesta') return <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs flex items-center gap-1"><MessageSquare size={12}/> Awaiting Input</span>;
    return <span className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle2 size={12}/> Handled</span>;
  };

  const getLogColor = (type: string, level: string) => {
    if (type === 'sys') return 'text-orange-500 font-bold';
    if (level === 'thinking') return 'text-amber-300 italic';
    if (level === 'info') return 'text-cyan-400';
    return 'text-slate-300';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 md:p-8 font-sans selection:bg-orange-500/30 text-slate-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera OpenClaw */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-orange-900/30 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-600 to-rose-600 rounded-xl shadow-[0_0_20px_rgba(234,88,12,0.3)]">
              <Network className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-rose-500 tracking-tight">
                OpenClaw
              </h1>
              <p className="text-orange-500/70 text-sm font-medium tracking-widest uppercase mt-1">Autonomous Orchestration Node</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Project Selector - Simulado */}
            <div className="relative group z-50">
              <button className="flex items-center gap-2 bg-[#141414] border border-orange-900/40 hover:border-orange-500/50 px-4 py-2 rounded-lg transition-all text-sm">
                <Database size={16} className="text-orange-500" />
                <span>Tenant: <strong className="text-white">{activeProject}</strong></span>
                <ChevronDown size={14} className="text-slate-500" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#141414] border border-orange-900/40 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all overflow-hidden">
                <div className="p-2">
                  <button onClick={() => setActiveProject("Candidatic CRM")} className="w-full text-left px-3 py-2 text-sm hover:bg-orange-500/10 rounded text-slate-300 hover:text-white">Candidatic CRM</button>
                  <button onClick={() => setActiveProject("Internal Support V2")} className="w-full text-left px-3 py-2 text-sm hover:bg-orange-500/10 rounded text-slate-300 hover:text-white">Internal Support V2</button>
                  <button onClick={() => setActiveProject("Sales Auto-Responder")} className="w-full text-left px-3 py-2 text-sm hover:bg-orange-500/10 rounded text-slate-300 hover:text-white">Sales Auto-Responder</button>
                </div>
              </div>
            </div>

            <div className="flex bg-[#141414] rounded-lg p-1 border border-orange-900/40">
              <button onClick={() => toggleAgent(true)} className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition-all text-sm ${stats.agentActive ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}>
                <Play size={14} fill={stats.agentActive ? "currentColor" : "none"} /> Engine ON
              </button>
              <button onClick={() => toggleAgent(false)} className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition-all text-sm ${!stats.agentActive ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}>
                <Square size={14} fill={!stats.agentActive ? "currentColor" : "none"} /> Halt
              </button>
            </div>
          </div>
        </header>

        {/* Metricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#141414] border border-orange-900/20 p-6 rounded-2xl flex items-center gap-4 hover:border-orange-500/30 transition-colors">
            <div className="p-4 bg-orange-500/10 text-orange-500 rounded-xl">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Node Status</p>
              <p className="text-2xl font-bold text-white flex items-center gap-2 mt-1">
                {stats.agentActive ? "Online" : "Terminated"}
                <span className={`w-2.5 h-2.5 rounded-full ${stats.agentActive ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse" : "bg-rose-600"}`}></span>
              </p>
            </div>
          </div>
          <div className="bg-[#141414] border border-orange-900/20 p-6 rounded-2xl flex items-center gap-4 hover:border-orange-500/30 transition-colors">
            <div className="p-4 bg-cyan-500/10 text-cyan-500 rounded-xl">
              <Cpu size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Inferences (24h)</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.messagesToday}</p>
            </div>
          </div>
          <div className="bg-[#141414] border border-orange-900/20 p-6 rounded-2xl flex items-center gap-4 hover:border-orange-500/30 transition-colors">
            <div className="p-4 bg-rose-500/10 text-rose-500 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Human Handoffs</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.candidatesTransferred}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Live Feed Terminal - Takes 2 columns */}
          <div className="lg:col-span-2 bg-[#141414] rounded-2xl flex flex-col h-[600px] border border-orange-900/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600 opacity-50"></div>
            <div className="bg-[#0f0f0f] px-6 py-4 flex justify-between items-center border-b border-orange-900/20">
              <h2 className="text-white font-mono text-sm tracking-wider flex items-center gap-2">
                <Terminal size={16} className="text-orange-500" /> SYSTEM.STREAM
              </h2>
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500/50"></div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 font-mono text-[13px] leading-relaxed terminal-scroll space-y-3 bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/5 via-[#0a0a0a] to-[#0a0a0a]">
              {logs.length === 0 ? (
                <div className="flex items-center gap-3 text-orange-500/40">
                  <Activity size={16} className="animate-pulse" />
                  <p>Awaiting WebSocket / SSE telemetry...</p>
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-4 hover:bg-white/5 p-1 -mx-1 rounded transition-colors group">
                    <span className="text-slate-600 shrink-0">
                      [{new Date(log.timestamp).toISOString().split('T')[1].slice(0, 8)}]
                    </span>
                    <span className={`flex-1 break-words ${getLog
Color(log.type, log.level)}`}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            {/* System Prompt Editor */}
            <div className="bg-[#141414] border border-orange-900/20 rounded-2xl p-6 flex flex-col h-[288px]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white font-mono text-sm flex items-center gap-2">
                  <Settings size={16} className="text-cyan-500" /> BASE_PROMPT
                </h2>
                <button onClick={savePrompt} disabled={savingPrompt} className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-500 px-3 py-1 rounded text-xs uppercase tracking-wider font-bold transition-all">
                  {savingPrompt ? "SYNCING..." : "DEPLOY"}
                </button>
              </div>
              <textarea 
                value={promptContent}
                onChange={(e) => setPromptContent(e.target.value)}
                className="flex-1 bg-[#0a0a0a] border border-orange-900/30 text-orange-100/80 p-4 rounded-xl focus:outline-none focus:border-orange-500/50 resize-none font-mono text-[13px] leading-relaxed"
                placeholder="Loading directives..."
              />
            </div>

            {/* Active Sessions */}
            <div className="bg-[#141414] border border-orange-900/20 rounded-2xl overflow-hidden flex-1 flex flex-col h-[288px]">
              <div className="px-6 py-4 bg-[#0f0f0f] border-b border-orange-900/20">
                <h2 className="text-white font-mono text-sm flex items-center gap-2">
                  <Network size={16} className="text-rose-500" /> ACTIVE_SESSIONS
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto terminal-scroll bg-[#0a0a0a]/50">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-slate-500 bg-[#0f0f0f] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 font-medium">Session ID (User)</th>
                      <th className="px-6 py-3 font-medium">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversations.map(conv => (
                      <tr key={conv.id} className="border-b border-orange-900/10 hover:bg-orange-500/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono text-slate-300">{conv.name !== conv.phone ? conv.name : 'Unknown Entity'}</div>
                          <div className="text-xs text-orange-500/50 font-mono mt-1">{conv.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(conv.status)}
                        </td>
                      </tr>
                    ))}
                    {conversations.length === 0 && (
                      <tr><td colSpan={2} className="px-6 py-12 text-center text-slate-600 font-mono text-sm">No active edge connections.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
