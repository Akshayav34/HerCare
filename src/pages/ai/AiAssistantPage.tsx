import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, ShieldAlert, Sparkles, AlertTriangle, User, RefreshCw, HelpCircle, PhoneCall } from 'lucide-react';
import { aiService, AiChatMessage, EDUCATIONAL_TOPICS } from '../../services/aiService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      content: `Hello! I am the **HerCare Educational Healthcare Assistant**.

I am here to help you:
- Prepare thoughtful questions for your doctor or gynecologist.
- Understand common medical terms, lab results, and wellness concepts.
- Learn about women's endocrine, menstrual, and preventative health.

⚠️ **Important Safety Notice:**
I am an educational AI and **cannot** diagnose conditions, prescribe medications, or replace a licensed physician. If you are experiencing a medical emergency, please call **911 / 112** or your local emergency services immediately.`,
      suggestedQuestions: [
        'How should I prepare for a PCOS consultation?',
        'Why are ferritin levels important for energy?',
        'What is the difference between rescue and controller inhalers?',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: AiChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      content: text,
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const response = await aiService.sendMessage(text, messages);
      setMessages(prev => [...prev, response]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          content: 'I encountered an error processing your query. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              AI Healthcare Assistant
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
              Educational Demo Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Safe educational triage, doctor visit preparation, and medical terminology decoding
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setMessages([messages[0]]);
          }}
          className="text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Chat</span>
        </Button>
      </div>

      {/* Safety Guardrail Disclosure */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-bold">Clinical Safety Boundaries: </span>
          HerCare AI does not provide definitive diagnoses or prescribe medications. In acute or life-threatening distress (e.g. severe chest pain, breathing difficulty, sudden numbness, anaphylaxis), call 911 / 112 immediately.
        </div>
      </div>

      {/* Chat Window Container */}
      <Card className="h-[520px] flex flex-col p-0 overflow-hidden shadow-card border-slate-200">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map(msg => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.isEmergencyAlert
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-teal-600 text-white'
                  }`}>
                    {msg.isEmergencyAlert ? <AlertTriangle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-teal-600 text-white rounded-br-none shadow-sm'
                      : msg.isEmergencyAlert
                      ? 'bg-red-50 text-red-900 border-2 border-red-500 rounded-bl-none shadow-md'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-none shadow-soft'
                  }`}
                >
                  {msg.content}

                  {/* Suggested follow-up buttons */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Suggested Topics:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(q)}
                            className="text-left text-[11px] bg-white hover:bg-teal-50 text-teal-800 border border-slate-200 hover:border-teal-300 px-2.5 py-1 rounded-xl transition-all shadow-2xs font-medium"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce delay-200" />
                <span className="ml-1">HerCare Assistant is formulating educational insights...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-white border-t border-slate-100">
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about medical terms, preparing for an appointment, or symptoms..."
              className="flex-1 max-h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none"
            />
            <Button
              variant="primary"
              size="md"
              disabled={!input.trim() || isLoading}
              onClick={() => handleSend()}
              className="h-10 w-10 p-0 rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
            <span>Press Enter to send, Shift + Enter for new line</span>
            <span>Educational triage mode • Non-diagnostic</span>
          </div>
        </div>
      </Card>

      {/* Suggested Starter Topics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {EDUCATIONAL_TOPICS.map((topic, i) => (
          <button
            key={i}
            onClick={() => handleSend(topic.samplePrompt)}
            className="text-left bg-white border border-slate-200/80 hover:border-teal-300 hover:bg-teal-50/50 p-3 rounded-2xl transition-all shadow-soft flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-teal-800">
                {topic.topic}
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                {topic.samplePrompt}
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-slate-300 group-hover:text-teal-600 shrink-0 ml-2" />
          </button>
        ))}
      </div>
    </div>
  );
};
