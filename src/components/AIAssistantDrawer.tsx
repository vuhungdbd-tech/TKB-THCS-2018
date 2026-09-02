import React, { useState } from 'react';
import { Bot, Send, Sparkles, X, Check, AlertTriangle, Zap, Lock } from 'lucide-react';
import { processAIRequest } from '../gemini/assistant';
import { store } from '../database/store';
import { AIResponse } from '../types';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRunSolver: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  action?: AIResponse['action'];
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onRunSolver
}) => {
  const currentWeek = store.getCurrentWeek();
  const state = store.getState();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Xin chào! Tôi là Trợ lý AI hỗ trợ Thời khóa biểu THCS 2018. Bạn có thể hỏi tôi bất kỳ thắc mắc nào về lịch dạy của giáo viên, tiến độ xếp TKB của các lớp hoặc yêu cầu tôi thực hiện hành động.`
    }
  ]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const currentVer = store.getTimetableVersion(currentWeek.id);
      const scheduledCount = currentVer?.score.scheduledPeriods || 0;
      const totalRequiredCount = currentVer?.score.totalRequiredPeriods || 0;
      const completionRate = currentVer?.score.completionRate || 0;

      const aiRes = await processAIRequest(textToSend, {
        weekName: currentWeek.name,
        totalClasses: state.classes.length,
        totalTeachers: state.teachers.length,
        scheduledCount,
        totalRequiredCount,
        completionRate,
        classes: state.classes.map(c => ({ code: c.code, name: c.name })),
        teachers: state.teachers.map(t => ({ code: t.code, name: t.fullName, mainSubject: t.department }))
      });

      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: aiRes.answer,
        action: aiRes.action
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: `Rất tiếc, đã có lỗi kết nối AI: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = (action: AIResponse['action']) => {
    if (!action) return;

    if (action.type === 'run_solver') {
      onRunSolver();
      setMessages(prev => [
        ...prev,
        {
          id: `act_${Date.now()}`,
          sender: 'assistant',
          text: '✓ Đã kích hoạt bộ máy xếp TKB tự động cho bạn!'
        }
      ]);
    } else if (action.type === 'lock_slot' && action.classId && action.dayOfWeek && action.period) {
      store.toggleLockSlot(currentWeek.id, action.classId, action.dayOfWeek, action.period);
      setMessages(prev => [
        ...prev,
        {
          id: `act_${Date.now()}`,
          sender: 'assistant',
          text: `✓ Đã khóa tiết Thứ ${action.dayOfWeek} Tiết ${action.period} cho Lớp thành công!`
        }
      ]);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">TRỢ LÝ AI TKB THCS</h2>
            <p className="text-[10px] text-slate-400">Powered by Gemini AI • Antigravity Agent</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Suggestions */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap gap-1.5 text-[11px]">
        <button
          onClick={() => handleSend("Phân tích tình hình TKB Lớp 8C1")}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700"
        >
          🔍 Phân tích Lớp 8C1
        </button>
        <button
          onClick={() => handleSend("Giáo viên nào đang dạy nhiều tiết nhất?")}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700"
        >
          📊 GV dạy nhiều tiết nhất
        </button>
        <button
          onClick={() => handleSend("Kiểm tra xem có trùng lịch dạy không")}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700"
        >
          ⚡ Kiểm tra trùng lịch
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3.5 rounded-2xl space-y-2 ${
              m.sender === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>

              {m.action && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-amber-300 font-bold text-[11px]">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Hành động đề xuất từ AI:</span>
                  </div>
                  <button
                    onClick={() => handleExecuteAction(m.action)}
                    className="w-full flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Thực hiện: {m.action.type === 'run_solver' ? 'Chạy Xếp TKB' : 'Khóa Tiết'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-950 p-3 rounded-2xl text-slate-400 text-xs flex items-center space-x-2 border border-slate-800">
              <Sparkles className="w-4 h-4 animate-spin text-purple-400" />
              <span>AI đang phân tích dữ liệu...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
        <input
          type="text"
          placeholder="Nhập câu hỏi hoặc yêu cầu cho AI..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
