'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Copy, Check, Loader2, Key, AlertTriangle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatTabProps {
  pdfText: string;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

function CodeBlock({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-2 mb-2">
      <pre className="bg-slate-800 text-slate-100 rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
        {content}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).replace(/^[^\n]*\n/, '');
        return <CodeBlock key={i} content={code} />;
      }
      // Render **bold** and line breaks
      const withBold = part.split(/(\*\*[^*]+\*\*)/g).map((p, j) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <strong key={j}>{p.slice(2, -2)}</strong>;
        }
        return p;
      });
      return (
        <span key={i} className="whitespace-pre-wrap">
          {withBold}
        </span>
      );
    });
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <div className={`
        shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white
        ${isUser ? 'bg-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'}
      `}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className={`
        max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
        ${isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}
      `}>
        {renderContent(message.content)}
        <p className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

const SUGGESTED_PROMPTS = [
  'Convert all fractions and square roots in this document to proper format',
  'Find all equations and list them with corrections',
  'Fix the quadratic formula notation',
  'Convert all Greek letters to proper symbols',
  'Show me the before and after for all changes you would make',
];

export default function ChatTab({ pdfText, apiKey, onApiKeyChange }: ChatTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    if (!pdfText) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Please upload a PDF first before chatting. Once you upload, I can help you convert and fix the mathematical notation.',
        timestamp: new Date(),
      }]);
      setInput('');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          pdfText,
          apiKey,          // ← passed from UI localStorage to server
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API call failed');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      }]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${errorMsg}\n\nMake sure your Groq API key is configured correctly.`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const saveApiKey = () => {
    onApiKeyChange(tempApiKey);
    setShowApiKeyInput(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* API Key Banner */}
      {showApiKeyInput ? (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-xs font-semibold text-yellow-800 mb-2 flex items-center gap-1">
            <Key size={12} /> Enter your Groq API Key
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={tempApiKey}
              onChange={e => setTempApiKey(e.target.value)}
              placeholder="gsk_..."
              className="flex-1 px-3 py-2 text-xs border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
            />
            <button
              onClick={saveApiKey}
              className="px-3 py-2 bg-yellow-500 text-white text-xs font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setShowApiKeyInput(false)}
              className="px-3 py-2 bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-yellow-600 mt-1.5">
            Get your free API key at{' '}
            <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline">
              console.groq.com
            </a>
          </p>
        </div>
      ) : (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            <span className="text-xs text-slate-500">
              {apiKey ? 'Groq API connected' : 'No API key set'}
            </span>
          </div>
          <button
            onClick={() => { setShowApiKeyInput(true); setTempApiKey(apiKey); }}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium"
          >
            <Key size={12} />
            {apiKey ? 'Change Key' : 'Set API Key'}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-1 py-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <Bot size={32} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">AI Math Assistant</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs">
              Upload a PDF and ask me to fix fractions, roots, Greek letters, and more.
            </p>

            {!pdfText && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 mb-4">
                <AlertTriangle size={14} />
                Upload a PDF first to get started
              </div>
            )}

            <div className="space-y-2 w-full max-w-sm">
              <p className="text-xs text-slate-400 font-medium">Try asking:</p>
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="w-full text-left text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 text-slate-600 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            {isLoading && (
              <div className="flex gap-3 mb-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="chat-bubble-ai px-4 py-3 rounded-2xl flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-slate-400" />
                  <span className="text-sm text-slate-500">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="mt-3 border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-300 transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={pdfText ? 'Ask about your document... (Shift+Enter for new line)' : 'Upload a PDF first...'}
          rows={1}
          className="w-full px-4 py-3 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none bg-transparent"
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-xs text-slate-400">{input.length > 0 ? `${input.length} chars` : 'Enter to send'}</span>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
