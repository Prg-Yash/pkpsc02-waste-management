'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageCircle, X, Send, Loader2, Bot, User, 
  Minimize2, Maximize2, Trash2, Copy, Check, 
  Sparkles, RefreshCw, AlertCircle 
} from 'lucide-react';

const QUICK_SUGGESTIONS = [
  'How do I dispose of plastic waste?',
  'What items can be recycled?',
  'How to report illegal dumping?',
  'Tips for waste segregation',
  'E-waste disposal methods',
  'Organic waste composting guide',
  'Hazardous waste handling',
  'Collection schedule information',
  'Reduce household waste',
  'Paper recycling tips',
  'Glass and metal disposal',
  'Proper bag usage for waste',
];

export default function CitizenChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! 👋 I\'m your waste management assistant. How can I help you today? You can ask me about waste disposal, recycling, collection schedules, or any other waste management queries.',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatWindowRef = useRef(null);
  const suggestionsScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (messageText = null) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setShowSuggestions(false);
    setError(null);
    
    const newMessage = { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          conversationHistory: messages.slice(-6) // Last 3 exchanges for context
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        timestamp: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      let errorMessage = 'I apologize, but I\'m having trouble responding right now.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'The request timed out. Please try again with a shorter question.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      setError(errorMessage);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage + ' 🔄',
        timestamp: new Date().toISOString(),
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      setMessages([
        {
          role: 'assistant',
          content: 'Chat cleared! How can I help you today?',
          timestamp: new Date().toISOString(),
        }
      ]);
      setShowSuggestions(true);
      setError(null);
    }
  };

  const handleCopyMessage = async (content, index) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Drag scroll handlers
  const handleMouseDown = (e) => {
    if (!suggestionsScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - suggestionsScrollRef.current.offsetLeft);
    setScrollLeft(suggestionsScrollRef.current.scrollLeft);
    suggestionsScrollRef.current.style.cursor = 'grabbing';
    suggestionsScrollRef.current.style.userSelect = 'none';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (suggestionsScrollRef.current) {
      suggestionsScrollRef.current.style.cursor = 'grab';
      suggestionsScrollRef.current.style.userSelect = 'auto';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (suggestionsScrollRef.current) {
      suggestionsScrollRef.current.style.cursor = 'grab';
      suggestionsScrollRef.current.style.userSelect = 'auto';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !suggestionsScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - suggestionsScrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    suggestionsScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchStart = (e) => {
    if (!suggestionsScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - suggestionsScrollRef.current.offsetLeft);
    setScrollLeft(suggestionsScrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !suggestionsScrollRef.current) return;
    const x = e.touches[0].pageX - suggestionsScrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    suggestionsScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 p-4 bg-linear-to-br from-emerald-500 to-green-600 text-white rounded-full shadow-2xl hover:shadow-emerald-500/50 hover:scale-110 transition-all duration-300 group animate-bounce-slow"
          aria-label="Open chatbot"
        >
          <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20"></span>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div 
          ref={chatWindowRef}
          className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden transition-all duration-300 ${
            isMinimized 
              ? 'w-80 h-16' 
              : 'w-[95vw] h-[85vh] md:w-[450px] md:h-[650px]'
          }`}
        >
          {/* Header */}
          <div className="bg-linear-to-r from-emerald-500 to-green-600 p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm animate-pulse-slow">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  Waste Assistant
                  <Sparkles className="w-4 h-4" />
                </h3>
                <p className="text-white/80 text-xs">
                  {isLoading ? 'Typing...' : 'Online • Ready to help'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
             
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close chatbot"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-linear-to-b from-gray-50 to-white">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 animate-fade-in ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                      message.role === 'user' 
                        ? 'bg-linear-to-br from-blue-500 to-blue-600' 
                        : message.isError
                        ? 'bg-linear-to-br from-red-500 to-red-600'
                        : 'bg-linear-to-br from-emerald-500 to-green-600'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : message.isError ? (
                        <AlertCircle className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                      <div className="space-y-1">
                        <div className={`inline-block max-w-[85%] p-3 rounded-2xl relative group ${
                          message.role === 'user'
                            ? 'bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-tr-none'
                            : message.isError
                            ? 'bg-red-50 border border-red-200 text-red-900 rounded-tl-none'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          {message.role === 'assistant' && !message.isError && (
                            <button
                              onClick={() => handleCopyMessage(message.content, index)}
                              className="absolute -top-2 -right-2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                              aria-label="Copy message"
                            >
                              {copiedIndex === index ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-gray-600" />
                              )}
                            </button>
                          )}
                        </div>
                        <p className={`text-xs text-gray-500 px-1 ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-linear-to-br from-emerald-500 to-green-600 shadow-md">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="inline-block bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 bg-white shrink-0">
                {error && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <p className="text-xs text-red-800 flex-1">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {/* Quick Action Buttons - Horizontal Draggable Scroll */}
                <div className="mb-3 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-2 w-6 bg-linear-to-r from-white to-transparent pointer-events-none z-10"></div>
                  <div className="absolute right-0 top-0 bottom-2 w-6 bg-linear-to-l from-white to-transparent pointer-events-none z-10"></div>
                  <div 
                    ref={suggestionsScrollRef}
                    className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
                  >
                    {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          if (!isDragging) {
                            handleSuggestionClick(suggestion);
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        disabled={isLoading}
                        className="shrink-0 px-3 py-1.5 text-xs font-medium bg-linear-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 rounded-full hover:bg-linear-to-r hover:from-emerald-100 hover:to-green-100 hover:border-emerald-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-1">👈 Drag to see more suggestions</p>
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your question... (Shift+Enter for new line)"
                      disabled={isLoading}
                      rows={1}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm resize-none max-h-[120px]"
                    />
                    {input && (
                      <button
                        onClick={() => setInput('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="px-4 py-2.5 bg-linear-to-br from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  
                  <div className="flex gap-1">
                    <button
                      onClick={handleClearChat}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Clear chat"
                      title="Clear chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSendMessage(messages[messages.length - 2]?.content)}
                      disabled={messages.length < 2 || isLoading}
                      className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Retry last message"
                      title="Retry last message"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .overflow-x-auto {
          overflow-x: auto;
          scroll-behavior: smooth;
        }
        .cursor-grab {
          cursor: grab;
        }
        .cursor-grab:active,
        .active\\:cursor-grabbing:active {
          cursor: grabbing;
        }
        .pointer-events-none {
          pointer-events: none;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </>
  );
}
