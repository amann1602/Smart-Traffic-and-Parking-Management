import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Mic, MicOff, Volume2, X, Bot, User, Siren, Info } from 'lucide-react';
import { useCityData } from '../context/CityContext';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import './Chatbot.css';

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

  const processAIResponse = (input) => {
    const query = input.toLowerCase();
    let response = "";

    // Emergency
    if (query.includes("emergency") || query.includes("sos") || query.includes("accident")) {
      response = "I've detected an emergency request. Should I activate system-wide Emergency Mode to prioritize traffic flow?";
      if (query.includes("activate") || query.includes("yes")) {
        activateEmergency();
        response = "🚨 EMERGENCY MODE ACTIVATED. All signals are set to green for priority clearance.";
      }
    } 
    // Traffic Status
    else if (query.includes("traffic") || query.includes("density")) {
      if (query.includes("fc road")) {
        const data = trafficData.find(d => d.name === "FC Road");
        response = `Traffic at FC Road is currently ${data.density}%, which is considered ${data.density > 70 ? 'High' : data.density > 40 ? 'Moderate' : 'Low'}. Average speed is ${data.speed} km/h.`;
      } else if (query.includes("mg road")) {
        const data = trafficData.find(d => d.name === "MG Road");
        response = `Traffic at MG Road is ${data.density}%. It's ${data.density > 70 ? 'very congested' : 'flowing well'} right now.`;
      } else if (query.includes("hinjewadi")) {
        const data = trafficData.find(d => d.name === "Hinjewadi IT Park");
        response = `IT Park traffic is at ${data.density}%. Expect ${data.density > 60 ? 'some delays' : 'smooth travel'}.`;
      } else {
        response = `Overall city traffic density is ${avgDensity}%. ${avgDensity > 60 ? 'Conditions are busy.' : 'Conditions are normal.'}`;
      }
    }
    // Parking
    else if (query.includes("parking") || query.includes("space") || query.includes("slot")) {
      if (query.includes("fc road")) {
        const p = parkingData.find(d => d.name.includes("FC Road"));
        response = `At PMC Parking FC Road, there are ${p.available} slots available out of ${p.total}.`;
      } else if (query.includes("baner")) {
        const p = parkingData.find(d => d.name.includes("Baner"));
        response = `Baner IT Hub currently has ${p.available} free parking spaces.`;
      } else {
        response = `There are currently ${availableParking} parking slots available across the city. Which area are you looking for?`;
      }
    }
    // Signals
    else if (query.includes("signal") || query.includes("light")) {
      const activeSignals = signals.filter(s => s.phase === 'green').length;
      response = `Currently, ${activeSignals} major signals are green. Most systems are in Auto-Optimization mode.`;
    }
    // Routes
    else if (query.includes("route") || query.includes("way") || query.includes("path")) {
      if (query.includes("fc road")) {
        response = "The main road to FC is moderately busy. I suggest taking the JM Road bypass for a 5-minute faster arrival.";
      } else if (query.includes("airport") || query.includes("viman nagar")) {
        response = "NH-65 is currently heavy. Use the internal Sangamwadi road for a smoother journey towards Viman Nagar.";
      } else {
        response = "Most arterial roads are flowing normally. Based on current density, the bypass routes are recommended for East-West transit.";
      }
    }
    // High Traffic Alerts
    else if (query.includes("busy") || query.includes("congestion") || query.includes("jam")) {
      const busySpots = trafficData.filter(d => d.density > 75).map(d => d.name);
      if (busySpots.length > 0) {
        response = `The most congested areas right now are: ${busySpots.join(", ")}. I recommend avoiding these routes.`;
      } else {
        response = "There are no major traffic jams reported at the moment. Traffic is moving smoothly across the city.";
      }
    }
    // Greetings & Misc
    else if (query.includes("hello") || query.includes("hi") || query.includes("hey")) {
      response = "Hello! I'm here to provide real-time updates on Pune's traffic and parking. How can I assist you?";
    } else if (query.includes("thank")) {
      response = "You're welcome! Safe driving.";
    } else if (query.includes("time") || query.includes("date")) {
      response = `It is currently ${new Date().toLocaleTimeString('en-IN')} on ${new Date().toLocaleDateString('en-IN')}.`;
    }
    else {
      response = "I'm not sure about that. I can provide traffic updates for FC Road, MG Road, Hinjewadi, or tell you about parking availability.";
    }

    return response;
  };

  const handleSendMessage = async (text = inputText) => {
    if (!text.trim()) return;

    // Add user message to Firebase
    const userMsg = { 
      type: 'user', 
      text, 
      time: serverTimestamp() 
    };
    
    try {
      await addDoc(collection(db, 'chatMessages'), userMsg);
    } catch (e) {
      console.error("Error saving message connection to Firebase:", e);
      setMessages(prev => [...prev, { ...userMsg, id: Date.now(), time: new Date() }]);
    }
    
    setInputText('');

    // AI Response Simulation
    setIsTyping(true);
    setTimeout(async () => {
      const aiText = processAIResponse(text);
      const aiMsg = { 
        type: 'bot', 
        text: aiText, 
        time: serverTimestamp() 
      };
      
      try {
        await addDoc(collection(db, 'chatMessages'), aiMsg);
      } catch (e) {
        console.error("Error saving AI response to Firebase:", e);
        setMessages(prev => [...prev, { ...aiMsg, id: Date.now() + 1, time: new Date() }]);
      }
      
      setIsTyping(false);
      speakText(aiText);
    }, 1000);
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
