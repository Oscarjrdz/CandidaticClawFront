"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  Network,
  MessageCircle,
  Send,
  Webhook,
  Plus,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Bot,
  User,
  Trash2,
  X,
  Radio,
  FileText,
  Save,
  RefreshCw,
  ImageIcon,
  Minus,
  Megaphone,
  BarChart3,
  LayoutDashboard,
  Calendar,
  Users
} from "lucide-react";

const API_URL = "/api/vps";
const API_KEY = process.env.NEXT_PUBLIC_VPS_API_KEY || "super_secret_key_123";
const HEADERS = { "Content-Type": "application/json", "x-api-key": API_KEY };

// ─── Types ───────────────────────────────────────────────────────────────────

interface VpsStats {
  agentActive: boolean;
  activeConversations: number;
  messagesToday: number;
  candidatesTransferred: number;
  channels?: { telegram?: string; whatsapp?: string; facebook?: string; };
}

interface Channel {
  id: string;
  type: "whatsapp" | "telegram" | "webhook";
  name: string;
  endpoint: string;
  createdAt: string;
}

interface ChatMessage {
  role: "user" | "agent";
  content: string;
  ts: Date;
  channel?: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  emoji: string;
  status: "active" | "planned" | "misconfigured" | "unknown";
  userInvocable: boolean;
  primaryEnv: string | null;
  homepage: string | null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OpenClawDashboard() {
  // VPS Status
  const [vpsStatus, setVpsStatus] = useState<"loading" | "online" | "offline">("loading");
  const [stats, setStats] = useState<VpsStats | null>(null);

  // Channels
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannel, setNewChannel] = useState({ type: "whatsapp" as Channel["type"], name: "", endpoint: "" });
  const [savingChannel, setSavingChannel] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activeChannel, setActiveChannel] = useState<"dashboard" | "telegram">("dashboard");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ base64: string; mimeType: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // System Prompt
  const [prompt, setPrompt] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);

  // Skills
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // Accordion State
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [mktOpen, setMktOpen] = useState(false);

  // MKT State
  const [mktData, setMktData] = useState<any>(null);
  const [mktLoading, setMktLoading] = useState(false);

  // ── VPS Health Check ─────────────────────────────────────────────────────
  useEffect(() => {
    const checkStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/stats`, { headers: HEADERS });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.status === "success") {
          setStats(data.data);
          setVpsStatus("online");
        } else {
          setVpsStatus("offline");
        }
      } catch {
        setVpsStatus("offline");
        setStats(null);
      }
    };

    checkStats();
    const interval = setInterval(checkStats, 15000);
    return () => clearInterval(interval);
  }, []);

  // ── Load channels + messages + channel from localStorage ────────────────
  useEffect(() => {
    const savedChannels = localStorage.getItem("openclaw_channels");
    if (savedChannels) setChannels(JSON.parse(savedChannels));

    const savedChannel = localStorage.getItem("openclaw_active_channel") as "dashboard" | "telegram" | null;
    if (savedChannel) setActiveChannel(savedChannel);

    const savedMessages = localStorage.getItem("openclaw_messages");
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      // Restaurar fechas como objetos Date
      setMessages(parsed.map((m: ChatMessage & { ts: string }) => ({ ...m, ts: new Date(m.ts) })));
    }
    setMessagesLoaded(true);

    // Cargar prompt del VPS
    loadPrompt();
    // Cargar skills
    loadSkills();
    // Cargar stats MKT
    loadMkt();
  }, []);

  const isFirstLoad = useRef(true);

  // ── Chat scroll + persist messages ─────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: isFirstLoad.current ? "instant" : "smooth" });
    if (messagesLoaded) {
      isFirstLoad.current = false;
      const toSave = messages.slice(-100);
      localStorage.setItem("openclaw_messages", JSON.stringify(toSave));
    }
  }, [messages, messagesLoaded]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const switchChannel = (ch: "dashboard" | "telegram") => {
    setActiveChannel(ch);
    localStorage.setItem("openclaw_active_channel", ch);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("openclaw_messages");
  };

  const loadPrompt = async () => {
    setPromptLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/prompt`, { headers: HEADERS });
      const data = await res.json();
      if (data.status === "success") setPrompt(data.data.prompt);
    } catch { /* ignore */ }
    setPromptLoading(false);
  };

  const savePrompt = async () => {
    setPromptSaving(true);
    try {
      await fetch(`${API_URL}/api/admin/prompt`, {
        method: "PUT",
        headers: HEADERS,
        body: JSON.stringify({ prompt }),
      });
      setPromptSaved(true);
      setTimeout(() => setPromptSaved(false), 3000);
    } catch { /* ignore */ }
    setPromptSaving(false);
  };

  const loadSkills = async () => {
    setSkillsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/skills`, { headers: HEADERS });
      const data = await res.json();
      if (data.status === "success") setSkills(data.data);
    } catch { /* ignore */ }
    setSkillsLoading(false);
  };

  const loadMkt = async () => {
    setMktLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/mkt/stats`, { headers: HEADERS });
      const data = await res.json();
      if (data.status === "success" && data.data) setMktData(data.data);
    } catch { /* ignore */ }
    setMktLoading(false);
  };

  const addChannel = () => {
    if (!newChannel.name.trim() || !newChannel.endpoint.trim()) return;
    setSavingChannel(true);
    const ch: Channel = {
      id: Date.now().toString(),
      type: newChannel.type,
      name: newChannel.name.trim(),
      endpoint: newChannel.endpoint.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...channels, ch];
    setChannels(updated);
    localStorage.setItem("openclaw_channels", JSON.stringify(updated));
    setNewChannel({ type: "whatsapp", name: "", endpoint: "" });
    setShowNewChannel(false);
    setSavingChannel(false);
  };

  const removeChannel = (id: string) => {
    const updated = channels.filter((c) => c.id !== id);
    setChannels(updated);
    localStorage.setItem("openclaw_channels", JSON.stringify(updated));
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: text, ts: new Date(), channel: activeChannel };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/chat`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({ message: text, sessionId: `dashboard-${activeChannel}` }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setMessages((prev) => [...prev, { role: "agent", content: data.reply, ts: new Date(), channel: activeChannel }]);
      } else {
        const errMsg = data?.error || `Error ${res.status}`;
        setMessages((prev) => [...prev, { role: "agent", content: `⚠️ ${errMsg}`, ts: new Date() }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "agent", content: "⚠️ Sin conexión con el VPS", ts: new Date() }]);
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(",")[1];
      setImagePreview({ base64: b64, mimeType: file.type, url });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const sendImage = async () => {
    if (!imagePreview || sending) return;
    const caption = input.trim();
    setInput("");
    const preview = imagePreview;
    setImagePreview(null);

    setMessages((prev) => [...prev, {
      role: "user",
      content: caption ? `📷 [Imagen] ${caption}` : "📷 [Imagen enviada]",
      ts: new Date(),
      channel: activeChannel,
    }]);
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/chat`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({
          message: caption,
          imageBase64: preview.base64,
          mimeType: preview.mimeType,
          sessionId: `dashboard-${activeChannel}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [...prev, { role: "agent", content: data.reply, ts: new Date(), channel: activeChannel }]);
      } else {
        setMessages((prev) => [...prev, { role: "agent", content: `⚠️ ${data?.error || res.status}`, ts: new Date() }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "agent", content: "⚠️ Sin conexión con el VPS", ts: new Date() }]);
    } finally {
      setSending(false);
    }
  };

  const channelIcon = (type: Channel["type"]) => {
    if (type === "whatsapp") return <MessageCircle size={20} className="text-emerald-400" />;
    if (type === "telegram") return <Send size={20} className="text-sky-400" />;
    return <Webhook size={20} className="text-rose-400" />;
  };

  const channelBg = (type: Channel["type"]) => {
    if (type === "whatsapp") return "bg-emerald-500/10 border-emerald-500/20";
    if (type === "telegram") return "bg-sky-500/10 border-sky-500/20";
    return "bg-rose-500/10 border-rose-500/20";
  };

  const telegramActive = stats?.channels?.telegram === "active" || vpsStatus === "online";

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans p-5 md:p-8 relative overflow-hidden selection:bg-orange-500/30">
      {/* Ambient glows */}
      <div className="fixed top-[-15%] left-[-10%] w-[45%] h-[45%] bg-orange-600/8 blur-[140px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-purple-700/8 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-[1280px] mx-auto space-y-7 relative z-10">

        {/* ── Header ── */}
        <header className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 rounded-xl shadow-[0_0_25px_rgba(249,115,22,0.25)]">
              <Network size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-rose-500 to-purple-400 tracking-tight">
                OpenClaw OS
              </h1>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-0.5 font-semibold">Neural Orchestration Platform</p>
            </div>
          </div>

          {/* VPS Status Pill */}
          <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
            vpsStatus === "online"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : vpsStatus === "offline"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
              : "bg-slate-500/10 border-slate-500/20 text-slate-400"
          }`}>
            {vpsStatus === "loading" && <Loader2 size={15} className="animate-spin" />}
            {vpsStatus === "online" && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            )}
            {vpsStatus === "offline" && <XCircle size={15} />}
            {vpsStatus === "loading" ? "Conectando..." : vpsStatus === "online" ? "VPS Online" : "VPS Offline"}
          </div>
        </header>

        {/* ── Stats row removed by user request ── */}

        {/* ── Main 2-col grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Channel Manager ── */}
          <section className="bg-[#0c0c0c] border border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-black/30">
              <div>
                <h2 className="text-white font-bold text-base flex items-center gap-2">
                  <Radio size={18} className="text-purple-400" /> Canales Activos
                </h2>
                <p className="text-xs text-slate-500 mt-1">Canales conectados a OpenClaw</p>
              </div>
              <button
                onClick={() => setShowNewChannel(!showNewChannel)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-purple-300 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
              >
                <Plus size={15} /> Nuevo
              </button>
            </div>

            {/* ── System channels (from API) ── */}
            <div className="border-b border-white/5">
              {/* Telegram */}
              <div
                className={`flex items-center gap-4 px-6 py-4 transition-colors cursor-pointer ${
                  activeChannel === "telegram" ? "bg-sky-500/5" : "hover:bg-white/[0.02]"
                }`}
                onClick={() => telegramActive && setActiveChannel("telegram")}
              >
                <div className={`p-2.5 rounded-xl border ${telegramActive ? "bg-sky-500/10 border-sky-500/20" : "bg-white/5 border-white/5"}`}>
                  <Send size={20} className={telegramActive ? "text-sky-400" : "text-slate-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Telegram</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">@CandidaticBot · Long Polling</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {telegramActive ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                      </span>
                      <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded-full border border-sky-500/20">
                        Live
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                      Offline
                    </span>
                  )}
                </div>
              </div>

              {/* Facebook */}
              <div
                className="flex items-center gap-4 px-6 py-4 border-t border-white/5 transition-colors cursor-pointer hover:bg-white/[0.02]"
              >
                <div className={`p-2.5 rounded-xl border ${stats?.channels?.facebook === 'active' ? "bg-blue-500/10 border-blue-500/20" : "bg-white/5 border-white/5"}`}>
                  <Network size={20} className={stats?.channels?.facebook === 'active' ? "text-blue-400" : "text-slate-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Facebook Automator</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Puppeteer · DigitalOcean VPS</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {stats?.channels?.facebook === 'active' ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                      </span>
                      <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
                        Live
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                      Offline
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* New channel form */}
            {showNewChannel && (
              <div className="px-6 py-5 border-b border-white/5 bg-purple-900/5 space-y-3">
                <div className="flex gap-2">
                  {(["whatsapp", "telegram", "webhook"] as Channel["type"][]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewChannel((p) => ({ ...p, type: t }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all border ${
                        newChannel.type === t
                          ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                          : "bg-white/5 border-white/5 text-slate-400 hover:border-white/15"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  value={newChannel.name}
                  onChange={(e) => setNewChannel((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nombre del canal (ej: Ventas WA)"
                  className="w-full bg-black/40 border border-white/10 focus:border-purple-500/40 outline-none text-sm text-white placeholder-slate-600 px-4 py-2.5 rounded-xl transition-colors"
                />
                <input
                  value={newChannel.endpoint}
                  onChange={(e) => setNewChannel((p) => ({ ...p, endpoint: e.target.value }))}
                  placeholder="Endpoint / Token / Phone ID"
                  className="w-full bg-black/40 border border-white/10 focus:border-purple-500/40 outline-none text-sm text-white placeholder-slate-600 px-4 py-2.5 rounded-xl transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addChannel}
                    disabled={savingChannel || !newChannel.name || !newChannel.endpoint}
                    className="flex-1 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                  >
                    {savingChannel ? "Guardando..." : "Crear Canal"}
                  </button>
                  <button
                    onClick={() => setShowNewChannel(false)}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 rounded-xl text-sm transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Custom channel list */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {channels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-600 gap-3">
                  <Webhook size={28} className="opacity-40" />
                  <p className="text-sm font-medium">Sin canales adicionales</p>
                  <p className="text-xs">Agrega webhooks personalizados</p>
                </div>
              ) : (
                channels.map((ch) => (
                  <div key={ch.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors group">
                    <div className={`p-2.5 rounded-xl border ${channelBg(ch.type)}`}>
                      {channelIcon(ch.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{ch.name}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">{ch.endpoint}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                        Live
                      </span>
                      <button
                        onClick={() => removeChannel(ch.id)}
                        className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ── Chat con OpenClaw ── */}
          <section className="bg-[#0c0c0c] border border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-2xl h-[520px]">
            <div className="px-6 py-5 border-b border-white/5 bg-black/30 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-white font-bold text-base flex items-center gap-2">
                  <Bot size={18} className="text-orange-400" /> Chat con OpenClaw
                </h2>
                <p className="text-xs text-slate-500 mt-1">Habla directo con tu agente</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                  <Send size={12} className="text-sky-400" />
                  <span className="text-xs font-bold text-sky-300">Telegram</span>
                  {telegramActive && (
                    <span className="relative flex h-1.5 w-1.5 ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500" />
                    </span>
                  )}
                </div>
                <button
                  onClick={clearChat}
                  title="Limpiar chat"
                  className="p-2 text-slate-600 hover:text-slate-400 hover:bg-white/5 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Channel context banner */}
            {activeChannel === "telegram" && (
              <div className="px-5 py-2.5 bg-sky-500/5 border-b border-sky-500/10 flex items-center gap-2 text-xs text-sky-400 shrink-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500" />
                </span>
                Sesión de Telegram — Los mensajes usan el mismo agente que @CandidaticBot
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                  <Bot size={36} className="opacity-30" />
                  <p className="text-sm font-medium">Escribe algo para comenzar</p>
                  <p className="text-xs">OpenClaw responderá en tiempo real</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "agent" && (
                    <div className="p-2 bg-orange-500/15 rounded-full shrink-0 self-end border border-orange-500/20 h-fit">
                      <Bot size={14} className="text-orange-400" />
                    </div>
                  )}
                  <div className={`whitespace-pre-wrap max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? msg.channel === "telegram"
                        ? "bg-sky-500/15 border border-sky-500/20 text-sky-100 rounded-br-sm"
                        : "bg-orange-500/15 border border-orange-500/20 text-orange-100 rounded-br-sm"
                      : "bg-white/[0.06] border border-white/5 text-slate-200 rounded-bl-sm"
                  }`}>
                    {msg.channel === "telegram" && msg.role === "user" && (
                      <p className="text-[9px] text-sky-400/60 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Send size={8} />Telegram
                      </p>
                    )}
                    {msg.content}
                    <p className="text-[10px] opacity-40 mt-1.5 font-mono">
                      {msg.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="p-2 bg-slate-700/50 rounded-full shrink-0 self-end border border-white/10 h-fit">
                      <User size={14} className="text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex gap-3 justify-start">
                  <div className="p-2 bg-orange-500/15 rounded-full shrink-0 self-end border border-orange-500/20">
                    <Bot size={14} className="text-orange-400" />
                  </div>
                  <div className="bg-white/[0.06] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-4 border-t border-white/5 bg-black/20 shrink-0">
              {/* Image preview */}
              {imagePreview && (
                <div className="flex items-center gap-2 px-1 pb-1">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview.url} alt="preview" className="h-14 w-14 rounded-xl object-cover border border-white/10" />
                    <button onClick={() => setImagePreview(null)} className="absolute -top-1.5 -right-1.5 bg-rose-500 rounded-full p-0.5 hover:bg-rose-400 transition-colors">
                      <X size={10} />
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500">Imagen lista — agrega un caption opcional</span>
                </div>
              )}
              <div className="flex gap-2">
                {/* Hidden file input */}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                {/* Photo button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={vpsStatus !== "online" || sending}
                  title="Adjuntar imagen"
                  className="px-3 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-slate-200 rounded-xl transition-all disabled:opacity-40"
                >
                  <ImageIcon size={18} />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (imagePreview ? sendImage() : sendMessage())}
                  disabled={vpsStatus !== "online"}
                  placeholder={
                    vpsStatus !== "online"
                      ? "VPS desconectado"
                      : imagePreview
                      ? "Caption opcional..."
                      : activeChannel === "telegram"
                      ? "Escribe como en Telegram..."
                      : "Escribe a OpenClaw..."
                  }
                  className={`flex-1 border focus:outline-none text-sm text-white placeholder-slate-600 px-4 py-3 rounded-xl transition-colors disabled:opacity-40 ${
                    activeChannel === "telegram"
                      ? "bg-sky-500/5 border-sky-500/20 focus:border-sky-500/40"
                      : "bg-white/5 border-white/10 focus:border-orange-500/40"
                  }`}
                />
                <button
                  onClick={imagePreview ? sendImage : sendMessage}
                  disabled={sending || (!input.trim() && !imagePreview) || vpsStatus !== "online"}
                  className={`px-4 py-3 border rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 ${
                    activeChannel === "telegram"
                      ? "bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/30 text-sky-400"
                      : "bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/30 text-orange-400"
                  }`}
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : imagePreview ? <ImageIcon size={18} /> : <ChevronRight size={18} />}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ── Skills + Prompt 50/50 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Panel */}
        <section className="bg-[#0c0c0c] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-6 py-5 border-b border-white/5 bg-black/30 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => setSkillsOpen(!skillsOpen)}>
            <div className="flex items-center gap-3">
              <button className="p-1 hover:bg-white/10 rounded-md text-slate-400 transition-colors">
                {skillsOpen ? <Minus size={16} /> : <Plus size={16} />}
              </button>
              <div>
                <h2 className="text-white font-bold text-base flex items-center gap-2">
                  <Zap size={18} className="text-yellow-400" /> Skills Disponibles
                </h2>
                <p className="text-xs text-slate-500 mt-1">Capacidades instaladas en OpenClaw</p>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); loadSkills(); }} 
              disabled={skillsLoading} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 rounded-lg text-xs font-bold transition-all"
            >
              <RefreshCw size={13} className={skillsLoading ? "animate-spin" : ""} /> Recargar
            </button>
          </div>
          {skillsOpen && (
            <div className="p-5">
              {skillsLoading ? (
                <div className="flex items-center justify-center h-20 gap-2 text-slate-600"><Loader2 size={16} className="animate-spin" /><span className="text-sm">Cargando skills...</span></div>
              ) : skills.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-slate-600 text-sm">VPS offline o sin skills detectados</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {skills.map((skill) => {
                    const s = { active: { label:"Activo", cls:"text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }, planned: { label:"Pendiente", cls:"text-amber-400 bg-amber-500/10 border-amber-500/20" }, misconfigured: { label:"Error config", cls:"text-rose-400 bg-rose-500/10 border-rose-500/20" }, unknown: { label:"Desconocido", cls:"text-slate-400 bg-white/5 border-white/5" } }[skill.status] ?? { label: skill.status, cls:"text-slate-400 bg-white/5 border-white/5" };
                    return (
                      <div key={skill.id} className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all hover:border-white/15 ${skill.status==="active" ? "bg-white/[0.025] border-white/8" : "bg-black/30 border-white/5 opacity-70"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-2xl leading-none">{skill.emoji}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${s.cls}`}>{s.label}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{skill.name}</p>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{skill.description}</p>
                        </div>
                        {skill.status === "active" && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
                            <span className="text-[10px] text-emerald-500 font-mono">running</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* System Prompt Editor */}
        <section className="bg-[#0c0c0c] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          <div className="px-6 py-5 border-b border-white/5 bg-black/30 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => setPromptOpen(!promptOpen)}>
            <div className="flex items-center gap-3">
              <button className="p-1 hover:bg-white/10 rounded-md text-slate-400 transition-colors">
                {promptOpen ? <Minus size={16} /> : <Plus size={16} />}
              </button>
              <div>
                <h2 className="text-white font-bold text-base flex items-center gap-2">
                  <FileText size={18} className="text-amber-400" /> System Prompt
                </h2>
                <p className="text-xs text-slate-500 mt-1">Instrucciones base de OpenClaw — se aplican en tiempo real</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); loadPrompt(); }}
                disabled={promptLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 rounded-lg text-xs font-bold transition-all"
              >
                <RefreshCw size={13} className={promptLoading ? "animate-spin" : ""} />
                Recargar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); savePrompt(); }}
                disabled={promptSaving || vpsStatus !== "online"}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  promptSaved
                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                    : "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/25 text-amber-300"
                }`}
              >
                {promptSaving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : promptSaved ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <Save size={13} />
                )}
                {promptSaved ? "¡Guardado!" : "Guardar"}
              </button>
            </div>
          </div>
          {promptOpen && (
            <div className="p-5">
              {promptLoading ? (
                <div className="flex items-center justify-center h-32 text-slate-600 gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Cargando prompt desde el VPS...</span>
                </div>
              ) : (
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={12}
                  placeholder="Escribe aquí las instrucciones del agente..."
                  className="w-full bg-black/40 border border-white/8 focus:border-amber-500/30 outline-none text-sm text-slate-200 placeholder-slate-600 px-4 py-3 rounded-xl transition-colors font-mono leading-relaxed resize-y"
                />
              )}
              <p className="text-[11px] text-slate-600 mt-2 flex items-center gap-1">
                <FileText size={10} />
                Guardado en <span className="font-mono text-slate-500">workspace/AGENTS.md</span> · Cambios en tiempo real sin reiniciar el servidor
              </p>
            </div>
          )}
        </section>
        </div>{/* end 50/50 grid */}

        {/* ── Agente MKT Panel ── */}
        <section className="bg-[#0c0c0c] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col mb-10">
          <div className="px-6 py-5 border-b border-white/5 bg-black/30 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => setMktOpen(!mktOpen)}>
            <div className="flex items-center gap-3">
              <button className="p-1 hover:bg-white/10 rounded-md text-slate-400 transition-colors">
                {mktOpen ? <Minus size={16} /> : <Plus size={16} />}
              </button>
              <div>
                <h2 className="text-white font-bold text-base flex items-center gap-2">
                  <Megaphone size={18} className="text-[#ff00aa]" /> Agente MKT
                </h2>
                <p className="text-xs text-slate-500 mt-1">Automatización de prospección en grupos y muro de Facebook</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); loadMkt(); }}
              disabled={mktLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 rounded-lg text-xs font-bold transition-all"
            >
              <RefreshCw size={13} className={mktLoading ? "animate-spin" : ""} />
              Recargar
            </button>
          </div>
          {mktOpen && (
            <div className="p-5 flex flex-col gap-6">
              {mktLoading && !mktData ? (
                <div className="flex items-center justify-center h-20 text-slate-600 gap-2"><Loader2 size={16} className="animate-spin" /><span className="text-sm">Cargando base de datos MKT...</span></div>
              ) : !mktData ? (
                <div className="flex items-center justify-center h-20 text-slate-600 text-sm">Sin configuración de base MKT activa.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex items-center gap-4">
                      <div className="p-3 justify-center items-center flex rounded-full bg-[#ff00aa]/10 text-[#ff00aa] border border-[#ff00aa]/20"><Calendar size={20}/></div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Día Planificado</p>
                        <h3 className="text-lg font-bold text-white mt-0.5">{mktData.todayDate || "Inactivo"}</h3>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex items-center gap-4">
                      <div className="p-3 justify-center items-center flex rounded-full bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20"><Users size={20}/></div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Posteos Locales</p>
                        <h3 className="text-lg font-bold text-white mt-0.5">{mktData.metrics?.totalGroupSharesSuccess || 0} / {mktData.todaySchedule?.length || 0}</h3>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex items-center gap-4">
                      <div className="p-3 justify-center items-center flex rounded-full bg-[#00ffaa]/10 text-[#00ffaa] border border-[#00ffaa]/20"><BarChart3 size={20}/></div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Likes Muro</p>
                        <h3 className="text-lg font-bold text-white mt-0.5">{mktData.metrics?.wallLikes || 0}</h3>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex items-center gap-4">
                      <div className="p-3 justify-center items-center flex rounded-full bg-[#ffc800]/10 text-[#ffc800] border border-[#ffc800]/20"><MessageCircle size={20}/></div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Comentarios Muro</p>
                        <h3 className="text-lg font-bold text-white mt-0.5">{mktData.metrics?.wallComments || 0}</h3>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
                    {/* Copy Activo */}
                    <div className="lg:col-span-1 rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                      <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-4">
                        <LayoutDashboard size={16} className="text-slate-400"/> Copy de la Campaña
                      </h4>
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-slate-800"></div>
                          <div>
                            <span className="font-bold text-white text-xs block">Candidatic</span>
                            <span className="text-[10px] text-slate-500">Preview del grupo</span>
                          </div>
                        </div>
                        {(() => {
                          const text = mktData.activeCampaign?.groupText || "Sin campaña guardada.";
                          const urlMatch = text.match(/https?:\/\/[^\s]+/);
                          const url = urlMatch ? urlMatch[0] : null;
                          const plainText = text.replace(url || '', '').trim();

                          return (
                            <div className="flex flex-col gap-3">
                              {plainText && <p className="whitespace-pre-wrap">{plainText}</p>}
                              {url && url.includes('facebook') && (
                                <div className="w-full bg-white rounded-lg overflow-hidden mt-2 flex justify-center">
                                  <iframe 
                                    src={`https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=350`}
                                    width="350" 
                                    height="450" 
                                    style={{ border: "none", overflow: "hidden" }} 
                                    scrolling="yes" 
                                    frameBorder="0" 
                                    allowFullScreen={true} 
                                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                  ></iframe>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Tabla de Logs */}
                    <div className="lg:col-span-2 rounded-2xl bg-white/[0.02] border border-white/5 p-5 flex flex-col">
                      <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-4">
                        <Activity size={16} className="text-slate-400"/> Historial del Día ({mktData.todaySchedule?.filter((t:any) => t.done).length || 0} completados)
                      </h4>
                      <div className="flex-1 bg-black/40 border border-white/5 rounded-xl overflow-y-auto max-h-[300px]">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-black/60 sticky top-0 border-b border-white/5">
                            <tr>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500">Status</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500">Hora</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500">Grupo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-300">
                            {mktData.todaySchedule?.length > 0 ? mktData.todaySchedule.map((task:any, i:number) => (
                              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3">
                                  {task.done ? (task.error ? <XCircle size={14} className="text-rose-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />) : <span className="text-slate-600 inline-block w-2 h-2 rounded-full bg-slate-700"/>}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">{String(task.hour).padStart(2,'0')}:{String(task.minute).padStart(2,'0')}</td>
                                <td className="px-4 py-3 text-xs truncate max-w-[200px]">{task.groupName}</td>
                              </tr>
                            )) : (
                              <tr><td colSpan={3} className="text-center py-6 text-slate-600 text-xs">Aún no se ha calculado el schedule diario.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

