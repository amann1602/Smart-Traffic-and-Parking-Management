import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Send, Mic, MicOff, Volume2, VolumeX, X, Bot, User,
  Siren, Info, MapPin, ParkingSquare, CreditCard, Route, Zap, ChevronRight,
  RefreshCw, Sparkles
} from 'lucide-react';
import { useCityData } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import './Chatbot.css';

const GEN_AI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ── Quick reply suggestions per role ─────────────────────────────────────────
const ADMIN_CHIPS = [
  'Signal status?', 'Activate emergency', 'Current violations', 'System health',
  'Traffic overview', 'Busiest zone?',
];
const USER_CHIPS = [
  'Traffic near me?', 'Book parking A1', 'My fine details', 'Best route to Hinjewadi',
  'Available parking?', 'Pay my fine',
];

// ── Initial welcome messages ──────────────────────────────────────────────────
const adminWelcome = `👋 Hello Admin! I'm your **Pune Smart City AI Control Assistant**.

I can help you with:
• 🚦 Signal status & manual overrides
• 🚨 Emergency mode control
• 📊 Traffic density across all zones
• 🚫 Violation management & approvals
• 🤖 AI predictions & alerts
• 📋 System logs & health

Type a command or tap a quick action below.`;

const userWelcome = `👋 Hello! I'm your **Pune Smart Traffic Assistant** 🤖

I can help you with:
• 🚦 Live traffic conditions near you
• 🅿️ Book a parking slot instantly
• 💰 Check & pay your traffic fine
• 🗺️ Best routes avoiding congestion
• ⏰ AI-powered travel time predictions
• 🌧️ Weather & road conditions

Just ask me anything! Voice commands also supported 🎤`;

// ── Intent detection + response engine ───────────────────────────────────────
function buildAIPrompt(cityCtx, userRole, userMsg) {
  const { avgDensity, availableParking, trafficData, signals, violations, parkingData, emergencyMode } = cityCtx;

  const topBusy = trafficData
    .sort((a, b) => b.density - a.density)
    .slice(0, 3)
    .map(t => `${t.name} (${t.density}%)`)
    .join(', ');

  const topClear = trafficData
    .sort((a, b) => a.density - b.density)
    .slice(0, 2)
    .map(t => `${t.name} (${t.density}%)`)
    .join(', ');

  return `You are the Pune Smart City Traffic and Parking AI Assistant.
You are helpful, concise, and professional. Use emojis naturally.
Always answer in 2-5 short lines maximum unless listing data.

CURRENT CITY DATA (live):
- Average Traffic Density: ${avgDensity}%
- Available Parking Slots: ${availableParking} across ${parkingData.length} hubs
- Active Violations: ${violations.filter(v => v.status === 'Active').length}
- Emergency Mode: ${emergencyMode ? '🚨 ACTIVE' : '✅ Off'}
- Most Congested Zones: ${topBusy}
- Clearest Zones: ${topClear}
- Total Signals: ${signals.length} (${signals.filter(s => s.phase === 'green').length} green, ${signals.filter(s => s.phase === 'red').length} red)
- User Role: ${userRole}

PARKING HUBS:
${parkingData.map(p => `  • ${p.name} (${p.area}): ${p.available}/${p.total} free`).join('\n')}

INSTRUCTIONS:
- If role is 'admin', provide control-focused answers (signal overrides, violation management, system status).
- If role is 'user', provide citizen-focused answers (where to park, route suggestions, fine info).
- For parking booking: confirm the slot and tell them to use the Parking page.
- For fine payment: tell them to visit the Violations page and use UPI QR payment.
- For route suggestions: suggest clearest routes based on live data.
- For emergency queries: only admin can activate emergency mode.
- Be SPECIFIC with numbers from the live data above.

User question: "${userMsg}"`;
}

async function callGemini(prompt) {
  if (!GEN_AI_KEY || GEN_AI_KEY.includes('Your_')) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEN_AI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
        }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    console.error('Gemini API error:', e);
    return null;
  }
}

// ── Local intent handler (fast, no API needed) ────────────────────────────────
function localIntent(msg, cityCtx, isAdmin) {
  const q = msg.toLowerCase().trim();
  const { avgDensity, availableParking, trafficData, signals, violations, parkingData, emergencyMode,
    activateEmergency, deactivateEmergency } = cityCtx;

  const densityEmoji = avgDensity >= 70 ? '🔴' : avgDensity >= 35 ? '🟡' : '🟢';
  const topBusy = trafficData.sort((a, b) => b.density - a.density).slice(0, 3);
  const topClear = trafficData.sort((a, b) => a.density - b.density).slice(0, 2);

  // Emergency control (admin)
  if (isAdmin && (q.includes('activate emergency') || q.includes('emergency on') || q.includes('turn on emergency'))) {
    activateEmergency();
    return '🚨 **Emergency Mode ACTIVATED!**\nAll traffic signals set to GREEN for priority clearance. Emergency corridors are now live.';
  }
  if (isAdmin && (q.includes('deactivate emergency') || q.includes('emergency off') || q.includes('turn off emergency'))) {
    deactivateEmergency();
    return '✅ **Emergency Mode DEACTIVATED.**\nSignals returning to normal auto-optimization mode.';
  }

  // Traffic overview
  if (q.includes('traffic') && (q.includes('overview') || q.includes('status') || q.includes('city'))) {
    return `📊 **City Traffic Overview:**\n${densityEmoji} Average density: **${avgDensity}%**\n🔴 Busy: ${topBusy.map(t => `${t.name} (${t.density}%)`).join(', ')}\n🟢 Clear: ${topClear.map(t => t.name).join(', ')}\n🚦 ${signals.filter(s => s.phase === 'green').length}/${signals.length} signals GREEN`;
  }

  // Specific location traffic
  const locations = trafficData.map(t => t.name.toLowerCase());
  for (const loc of trafficData) {
    if (q.includes(loc.name.toLowerCase()) && (q.includes('traffic') || q.includes('density') || q.includes('busy') || q.includes('how'))) {
      const col = loc.density >= 70 ? '🔴 HIGH' : loc.density >= 35 ? '🟡 MEDIUM' : '🟢 LOW';
      return `🗺️ **${loc.name} Traffic**\nDensity: **${loc.density}%** (${col})\nVehicles: ${loc.vehicles} | Speed: ${loc.speed} km/h\n${loc.density > 70 ? '⚠️ Avoid if possible — use alternate routes.' : loc.density > 35 ? 'Moderate traffic. Slight delays expected.' : '✅ Roads are clear. Good time to travel!'}`;
    }
  }

  // Busiest zone
  if (q.includes('busiest') || q.includes('most congested') || q.includes('busiest zone')) {
    const b = topBusy[0];
    return `📍 **Most Congested:** ${b.name}\nDensity: **${b.density}%** 🔴\nSpeed: ${b.speed} km/h · ${b.vehicles} vehicles\n⚠️ Recommend avoiding ${b.name} for next 30 minutes.`;
  }

  // Parking
  if (q.includes('parking') || q.includes('park') || q.includes('slot')) {
    if (q.includes('book') || q.includes('reserve')) {
      const slotMatch = q.match(/[ab]\d/i);
      if (slotMatch) {
        return `🅿️ **Slot ${slotMatch[0].toUpperCase()} Booking**\nTo book this slot:\n1. Go to **Smart Parking** page\n2. Select the hub → Click "Book Slot Here"\n3. Enter your vehicle number & mobile\n4. You'll receive an SMS confirmation! 📱`;
      }
      const bestHub = parkingData.sort((a, b) => b.available - a.available)[0];
      return `🅿️ **Best Parking Right Now:**\n${bestHub.name} (${bestHub.area})\n✅ **${bestHub.available}** slots available\n👉 Go to **Smart Parking** page to book now!`;
    }
    const total = availableParking;
    const bestHub = parkingData.sort((a, b) => b.available - a.available)[0];
    return `🅿️ **Parking Availability:**\nTotal free slots: **${total}** across ${parkingData.length} hubs\n🏆 Best: **${bestHub.name}** — ${bestHub.available} free\n👉 Tap "Smart Parking" in the sidebar to book.`;
  }

  // Fine / violation
  if (q.includes('fine') || q.includes('penalty') || q.includes('challan')) {
    if (!isAdmin) {
      return `💰 **Your Traffic Fine:**\nVehicle: **MH12 AB 1234**\nFine: **₹500** (No Parking Zone)\nLocation: Deccan Hub\n\n💳 Pay via UPI QR/Google Pay/PhonePe\n👉 Go to **Pay Fine** page to clear now!`;
    }
    const activeV = violations.filter(v => v.status === 'Active');
    return `🚫 **Active Violations: ${activeV.length}**\nTotal pending fines: ₹${activeV.reduce((a, v) => a + (v.fineAmount || 0), 0).toLocaleString('en-IN')}\nTypes: ${[...new Set(activeV.map(v => v.type))].slice(0, 3).join(', ')}\n👉 Go to **Violation Management** to resolve.`;
  }

  // Route suggestion
  if (q.includes('route') || q.includes('best way') || q.includes('how to reach') || q.includes('way to')) {
    const clear = topClear.map(t => t.name).join(' or ');
    return `🗺️ **Smart Route Suggestion:**\nBest approach: Via **${clear}** (least congested now)\n⚠️ Avoid: ${topBusy[0].name} (${topBusy[0].density}% density)\n⏱️ AI tip: Travel before 5 PM to beat peak hour.\n👉 Check **Route Suggestions** page for turn-by-turn navigation!`;
  }

  // Hinjewadi specific
  if (q.includes('hinjewadi')) {
    const hinja = trafficData.find(t => t.name.toLowerCase().includes('hinjewadi'));
    if (hinja) {
      return `🏢 **Hinjewadi IT Park:**\nTraffic: **${hinja.density}%** ${hinja.density >= 70 ? '🔴 Heavy' : '🟡 Moderate'}\n${hinja.density > 60 ? '⚠️ IT shift change usually causes 5:30–7:30 PM bottleneck.\n💡 Use Wakad flyover or Baner bypass as alternate.' : '✅ Roads are manageable. Normal flow.'}`;
    }
  }

  // Signal status (admin)
  if (isAdmin && (q.includes('signal') || q.includes('traffic light'))) {
    const green  = signals.filter(s => s.phase === 'green').length;
    const red    = signals.filter(s => s.phase === 'red').length;
    const yellow = signals.filter(s => s.phase === 'yellow').length;
    return `🚦 **Signal Network Status:**\n🟢 Green: ${green} | 🔴 Red: ${red} | 🟡 Yellow: ${yellow}\nTotal: ${signals.length} signals monitored\n⚙️ ${signals.filter(s => !s.autoMode).length} in manual override mode\n👉 Go to **Signal Control** to adjust timing.`;
  }

  // System health (admin)
  if (isAdmin && (q.includes('system') || q.includes('health') || q.includes('status'))) {
    return `💻 **System Health:**\n✅ AI Engine: Online (Gemini 1.5 Flash)\n✅ IoT Sensors: 10/10 Active\n✅ Signal Network: ${signals.length} signals live\n✅ Camera Feed: Active\n✅ Firebase: Connected\n${emergencyMode ? '🚨 Emergency Mode: ACTIVE' : '🟢 Emergency Mode: Standby'}`;
  }

  // Emergency status
  if (q.includes('emergency')) {
    if (emergencyMode) {
      return `🚨 **Emergency Mode is ACTIVE**\nAll signals are GREEN for priority vehicles. Emergency corridors are live.\n${isAdmin ? '💡 Say "deactivate emergency" to return to normal mode.' : '⚠️ Please follow traffic directives and allow priority vehicles to pass.'}`;
    }
    return `✅ **Emergency Status: Normal**\nNo active emergency. All systems operating normally.\n${isAdmin ? '💡 Say "activate emergency" to enable emergency mode.' : 'If you see an emergency, please call 112.'}`;
  }

  // Weather
  if (q.includes('weather') || q.includes('rain') || q.includes('temperature')) {
    return `🌤️ **Pune Weather:**\n🌡️ Temperature: 31°C · Partly Cloudy\n💨 Wind: 12 km/h | Humidity: 58%\n🌧️ Light rain expected at 7 PM — allow extra 10-15 min buffer\n✅ Visibility is good. Drive safe!`;
  }

  // Greeting
  if (q.match(/^(hi|hello|hey|namaste|hii)/)) {
    return isAdmin
      ? `👋 Hello Admin! Everything is running smoothly.\n${densityEmoji} City traffic: **${avgDensity}%** | 🚫 Violations: **${violations.filter(v => v.status === 'Active').length}** active\nHow can I assist you today?`
      : `👋 Hello! Here's your city snapshot:\n${densityEmoji} Traffic: **${avgDensity}%** | 🅿️ Parking: **${availableParking}** free\nAsk me anything about traffic, parking, or routes!`;
  }

  return null; // Fall through to Gemini
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, onSpeak }) {
  const isBot = msg.type === 'bot';

  // Parse **bold** markdown
  const formatText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} style={{ color: isBot ? '#60a5fa' : 'inherit' }}>{part.slice(2, -2)}</strong>
        : part.split('\n').map((line, j) =>
            <React.Fragment key={j}>{line}{j < part.split('\n').length - 1 && <br />}</React.Fragment>
          )
    );
  };

  return (
    <div className={`message ${msg.type}`}>
      <div className="flex items-center gap-1.5 mb-1 opacity-60">
        {isBot
          ? <><Bot size={11} /><span style={{ fontSize: 9, fontWeight: 700 }}>PUNE AI</span></>
          : <><User size={11} /><span style={{ fontSize: 9, fontWeight: 700 }}>YOU</span></>}
      </div>
      <div className="text-content" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: 13 }}>
        {formatText(msg.text)}
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <div className="message-time">
          {msg.time instanceof Date
            ? msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--:--'}
        </div>
        {isBot && (
          <button onClick={() => onSpeak(msg.text)}
            className="opacity-40 hover:opacity-100 transition-opacity"
            title="Read aloud">
            <Volume2 size={10} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Chatbot Component ────────────────────────────────────────────────────
export default function Chatbot() {
  const cityCtx = useCityData();
  const { isAdmin, user } = useAuth();
  const {
    trafficData, signals, parkingData, emergencyMode,
    avgDensity, availableParking, activateEmergency, deactivateEmergency, violations
  } = cityCtx;

  const [isOpen,       setIsOpen]       = useState(false);
  const [messages,     setMessages]     = useState([]);
  const [inputText,    setInputText]    = useState('');
  const [isTyping,     setIsTyping]     = useState(false);
  const [isListening,  setIsListening]  = useState(false);
  const [isSpeaking,   setIsSpeaking]   = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef       = useRef(null);

  // Initialise with role-specific welcome
  useEffect(() => {
    setMessages([{
      id: 1,
      type: 'bot',
      text: isAdmin ? adminWelcome : userWelcome,
      time: new Date(),
    }]);
  }, [isAdmin]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // Setup speech recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setInputText(t);
      // auto-send
      setTimeout(() => processAndSend(t), 100);
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    recognitionRef.current = rec;
  }, []);

  const speakText = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    // Strip markdown
    const clean = text.replace(/\*\*/g, '').replace(/👋|🚦|🅿️|💰|🗺️|🚨|✅|🔴|🟡|🟢|📊|📱|💳|🤖|⚠️|💡|🏢|🌤️|🌧️|💨|🌡️|❄️|🎉/gu, '');
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang  = 'en-IN';
    utt.rate  = 1.05;
    utt.pitch = 1.0;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, []);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const processAndSend = useCallback(async (text) => {
    const trimmed = text?.trim();
    if (!trimmed) return;

    const userMsg = { id: Date.now(), type: 'user', text: trimmed, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 400 + Math.random() * 300));

    // 1. Try local intent first (instant)
    let reply = localIntent(trimmed, cityCtx, isAdmin);

    // 2. Fall back to Gemini API
    if (!reply) {
      const prompt = buildAIPrompt(cityCtx, isAdmin ? 'admin' : 'citizen', trimmed);
      reply = await callGemini(prompt);
    }

    // 3. Final fallback
    if (!reply) {
      reply = isAdmin
        ? `I didn't catch that. You can ask me about:\n• Traffic signals & overrides\n• Emergency mode\n• Active violations\n• System health & logs`
        : `I'm not sure about that. Try asking:\n• "Traffic near Hinjewadi?"\n• "Book parking A1"\n• "My fine details"\n• "Best route to FC Road"`;
    }

    const botMsg = { id: Date.now() + 1, type: 'bot', text: reply, time: new Date() };
    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
    speakText(reply);
  }, [cityCtx, isAdmin, speakText]);

  const handleSend = () => processAndSend(inputText);

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        setIsListening(true);
        recognitionRef.current.start();
      } else {
        alert('Speech recognition not supported in this browser.');
      }
    }
  };

  const chips = isAdmin ? ADMIN_CHIPS : USER_CHIPS;
  const unreadCount = messages.filter(m => m.type === 'bot').length;

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        id="chatbot-toggle"
        className={`chatbot-float ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Pune Traffic AI Assistant"
      >
        {!isOpen && <div className="chatbot-pulse" />}
        {isOpen ? <X size={26} /> : <MessageSquare size={26} />}
        {!isOpen && messages.length > 1 && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 18, height: 18, borderRadius: '50%',
            background: isAdmin ? '#ff4757' : '#1d6ef5',
            fontSize: 9, fontWeight: 700, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg-base)',
          }}>
            AI
          </div>
        )}
      </button>

      {/* ── Chat Window ── */}
      <div className={`chatbot-window ${isOpen ? 'open' : 'closed'}`}>

        {/* Header */}
        <div className="chatbot-header" style={{
          background: isAdmin
            ? 'linear-gradient(135deg, rgba(30,5,10,0.98), rgba(60,10,20,0.98))'
            : 'linear-gradient(135deg, rgba(5,13,40,0.98), rgba(10,30,80,0.98))',
          borderBottom: `1px solid ${isAdmin ? 'rgba(255,71,87,0.2)' : 'rgba(29,110,245,0.2)'}`,
        }}>
          <div className="chatbot-header-icon" style={{
            background: isAdmin ? 'rgba(255,71,87,0.15)' : 'rgba(29,110,245,0.15)',
            border:     isAdmin ? '1px solid rgba(255,71,87,0.3)' : '1px solid rgba(29,110,245,0.3)',
          }}>
            <Bot size={20} style={{ color: isAdmin ? '#ff6b7a' : '#60a5fa' }} />
          </div>
          <div className="chatbot-header-info">
            <h3 style={{ color: 'white', fontWeight: 700 }}>
              {isAdmin ? '⚙️ Admin AI Assistant' : '🤖 Pune Traffic Assistant'}
            </h3>
            <p className="flex items-center gap-1" style={{ fontSize: 10, opacity: 0.7, color: 'white' }}>
              <span className="flex items-center gap-1">
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ed573', animation: 'blink 1.5s infinite' }} />
                Gemini AI · Online
              </span>
              {emergencyMode && <span style={{ color: '#ff4757', marginLeft: 8 }}>🚨 Emergency Active</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {isSpeaking && (
              <button onClick={stopSpeaking} title="Stop speaking"
                className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)', color: '#60a5fa' }}>
                <VolumeX size={14} />
              </button>
            )}
            <button onClick={() => setMessages([{
              id: Date.now(), type: 'bot',
              text: isAdmin ? adminWelcome : userWelcome, time: new Date()
            }])}
              title="Clear chat"
              className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
              style={{ color: 'rgba(255,255,255,0.5)' }}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Live stat bar */}
        <div className="flex items-center gap-3 px-3 py-2 border-b text-[10px] font-bold" style={{
          background: isAdmin ? 'rgba(255,71,87,0.05)' : 'rgba(29,110,245,0.05)',
          borderColor: 'var(--border)',
        }}>
          <span style={{ color: avgDensity >= 70 ? '#ff4757' : avgDensity >= 35 ? '#ffd32a' : '#2ed573' }}>
            {avgDensity >= 70 ? '🔴' : avgDensity >= 35 ? '🟡' : '🟢'} Traffic {avgDensity}%
          </span>
          <span style={{ color: '#60a5fa' }}>🅿️ {availableParking} Free</span>
          {isAdmin && <span style={{ color: '#ff4757' }}>🚫 {violations.filter(v => v.status === 'Active').length} Violations</span>}
          <span className="ml-auto flex items-center gap-1" style={{ color: '#a78bfa' }}>
            <Sparkles size={9} /> Gemini 1.5
          </span>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} onSpeak={speakText} />
          ))}
          {isTyping && (
            <div className="typing-indicator bot">
              <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Chips */}
        <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {chips.map((chip, i) => (
            <button key={i}
              onClick={() => processAndSend(chip)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all hover:scale-105"
              style={{
                background: isAdmin ? 'rgba(255,71,87,0.1)' : 'rgba(29,110,245,0.1)',
                border:     isAdmin ? '1px solid rgba(255,71,87,0.2)' : '1px solid rgba(29,110,245,0.2)',
                color:      isAdmin ? '#ff6b7a' : '#60a5fa',
                whiteSpace: 'nowrap',
              }}>
              {chip}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="chatbot-input-container">
          <div className="chatbot-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder={isListening ? '🎤 Listening...' : isAdmin ? 'Ask about signals, violations...' : 'Ask about traffic, parking...'}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              style={{ fontStyle: isListening ? 'italic' : 'normal' }}
            />

            <button
              onClick={toggleVoice}
              className={`chatbot-action-btn ${isListening ? 'voice-active' : ''}`}
              title={isListening ? 'Stop listening' : 'Voice input'}
              style={{
                color:      isListening ? '#ff4757' : 'var(--text-muted)',
                background: isListening ? 'rgba(255,71,87,0.15)' : undefined,
                animation:  isListening ? 'blink 1s infinite' : 'none',
              }}>
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <button
              className="chatbot-action-btn send-btn"
              onClick={handleSend}
              disabled={!inputText.trim() && !isListening}
              style={{
                background: inputText.trim()
                  ? `linear-gradient(135deg, ${isAdmin ? '#ff4757' : '#1d6ef5'}, ${isAdmin ? '#c0392b' : '#0d4ed8'})`
                  : undefined,
              }}>
              <Send size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between mt-1.5 px-1">
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <Info size={9} />
              <span>Voice · Text · Real-time data</span>
            </div>
            {isSpeaking && (
              <div className="flex items-center gap-1 text-[10px] animate-pulse" style={{ color: '#60a5fa' }}>
                <Volume2 size={10} />
                <span>Speaking...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
