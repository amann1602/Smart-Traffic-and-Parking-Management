import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Mic, MicOff, Volume2, X, Bot, User, Siren, Info, CloudSun, MapPin } from 'lucide-react';
import { useCityData } from '../context/CityContext';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";
import './Chatbot.css';

const API_BASE = 'http://localhost:5000/api';
const GEN_AI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const INITIAL_MESSAGES = [
  { id: 1, type: 'bot', text: "Hello! I'm your Pune Smart Traffic Assistant. How can I help you today?", time: new Date() },
];

export default function Chatbot() {
  const { 
    trafficData, 
    signals, 
    parkingData, 
    emergencyMode, 
    avgDensity, 
    availableParking,
    activateEmergency,
    deactivateEmergency
  } = useCityData();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Sync with Firebase
  useEffect(() => {
    if (!db) return;

    try {
      const q = query(collection(db, 'chatMessages'), orderBy('time', 'asc'), limit(50));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const dbMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: doc.data().time?.toDate() || new Date()
        }));
        if (dbMessages.length > 0) {
          setMessages(dbMessages);
        }
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Chat history sync error:", e);
    }
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-IN'; // Set to Indian English

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        setIsListening(true);
        recognitionRef.current.start();
      } else {
        alert("Speech recognition is not supported in your browser.");
      }
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const processAIResponse = async (input) => {
    const query = input.toLowerCase();
    
    // --- 1. LOCAL DATA LOGIC (Priority) ---
    
    // Emergency
    if (query.includes("emergency") || query.includes("sos") || query.includes("accident")) {
      return "I've detected an emergency request. Should I activate system-wide Emergency Mode to prioritize traffic flow?";
    } 

    if (query.includes("activate emergency") || query.includes("turn on emergency")) {
      activateEmergency();
      return "🚨 EMERGENCY MODE ACTIVATED. All signals are set to green for priority clearance.";
    }

    // Traffic Status
    if (query.includes("traffic") || query.includes("density")) {
      if (query.includes("fc road")) {
        const data = trafficData.find(d => d.name === "FC Road");
        return `Traffic at FC Road is currently ${data.density}%, which is considered ${data.density > 70 ? 'High' : data.density > 40 ? 'Moderate' : 'Low'}. Average speed is ${data.speed} km/h.`;
      } 
      const busySpots = trafficData.filter(d => d.density > 75).map(d => d.name);
      if (busySpots.length > 0) {
        return `The most congested areas right now are: ${busySpots.join(", ")}. Overall density is ${avgDensity}%.`;
      }
      return `Overall city traffic density is around ${avgDensity}%. Conditions are relatively normal across major Pune junctions.`;
    }

    // Parking
    if (query.includes("parking") || query.includes("space") || query.includes("slot")) {
      return `There are currently ${availableParking} parking slots available across the city. Baner and Hinjewadi hubs have the most vacancy right now.`;
    }

    // Weather
    if (query.includes("weather") || query.includes("temperature") || query.includes("rain")) {
      return `Current weather in Pune: 31°C, Partly Cloudy. Visibility is good for driving, and there is no rain expected for the next 6 hours.`;
    }

    // --- 2. ADVANCED AI LOGIC (Google Gemini) ---
    if (GEN_AI_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(GEN_AI_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const systemPrompt = `You are the Pune Smart Traffic Assistant. 
          Current City Status: Avg Traffic Density ${avgDensity}%, Available Parking ${availableParking}. 
          Answer the user's question politely and helpfully. User asked: `;
        
        const result = await model.generateContent(systemPrompt + input);
        const response = await result.response;
        return response.text();
      } catch (error) {
        console.error("Gemini AI Error:", error);
      }
    }

    // Fallback if AI fails or no key
    return "I'm not sure about that. I can provide traffic updates for major Pune roads, check parking availability, or activate emergency mode.";
  };

  const handleSendMessage = async (text = inputText) => {
    if (!text.trim()) return;

    // Add user message to Firebase
    const userMsg = { 
      type: 'user', 
      text, 
    };
    
    if (db) {
      try {
        await addDoc(collection(db, 'chatMessages'), { ...userMsg, time: serverTimestamp() });
      } catch (e) {
        console.error("Error saving message connection to Firebase:", e);
        // Local fallback
        setMessages(prev => [...prev, { ...userMsg, id: Date.now(), time: new Date() }]);
      }
    } else {
      setMessages(prev => [...prev, { ...userMsg, id: Date.now(), time: new Date() }]);
    }
    
    setInputText('');

    // AI Response Simulation
    setIsTyping(true);
    try {
      const aiText = await processAIResponse(text);
      const aiMsg = { 
        type: 'bot', 
        text: aiText, 
      };
      
      if (db) {
        try {
          await addDoc(collection(db, 'chatMessages'), { ...aiMsg, time: serverTimestamp() });
        } catch (e) {
          console.error("Error saving AI response to Firebase:", e);
          setMessages(prev => [...prev, { ...aiMsg, id: Date.now() + 1, time: new Date() }]);
        }
      } else {
        setMessages(prev => [...prev, { ...aiMsg, id: Date.now() + 1, time: new Date() }]);
      }
      
      setIsTyping(false);
      speakText(aiText);
    } catch (error) {
      console.error("Chat system error:", error);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        className={`chatbot-float ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Traffic Assistant"
      >
        {!isOpen && <div className="chatbot-pulse" />}
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen ? 'open' : 'closed'}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-icon">
            <Bot size={22} />
          </div>
          <div className="chatbot-header-info">
            <h3>Pune Traffic Assistant</h3>
            <p><span className="status-dot"></span> AI Online</p>
          </div>
          {emergencyMode && (
             <div className="ml-auto text-red-400 animate-pulse">
                <Siren size={18} />
             </div>
          )}
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.type}`}>
              <div className="flex items-center gap-2 mb-1 opacity-70">
                {msg.type === 'bot' ? <Bot size={12} /> : <User size={12} />}
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>
                  {msg.type === 'bot' ? 'SYSTEM' : 'YOU'}
                </span>
              </div>
              <div className="text-content">{msg.text}</div>
              <div className="message-time">
                {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="typing-indicator bot">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chatbot-input-container">
          <div className="chatbot-input-wrapper">
            <input 
              type="text" 
              className="chatbot-input"
              placeholder="Ask about traffic, parking..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            
            <button 
              className={`chatbot-action-btn ${isListening ? 'voice-active' : ''}`}
              onClick={toggleVoiceInput}
              title="Voice Input"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button 
              className="chatbot-action-btn send-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
            >
              <Send size={18} />
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-2 px-1">
             <div className="flex items-center gap-1.5 text-[10px] text-city-muted">
                <Info size={10} />
                <span>Supports voice commands</span>
             </div>
             {isSpeaking && (
                <div className="flex items-center gap-1 text-[10px] text-blue-400 animate-pulse">
                   <Volume2 size={10} />
                   <span>Bot is speaking...</span>
                </div>
             )}
          </div>
        </div>
      </div>
    </>
  );
}
