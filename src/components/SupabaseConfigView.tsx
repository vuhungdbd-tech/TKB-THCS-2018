import React, { useState, useEffect } from 'react';
import { Database, Cloud, RefreshCw, CheckCircle, AlertCircle, Save, Copy, Check, Server, ShieldCheck, ArrowUpRight, Code, Download, Upload } from 'lucide-react';
import { store } from '../database/store';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  checkSupabaseConnection,
  SUPABASE_TABLE_INIT_SQL
} from '../database/supabase';

export const SupabaseConfigView: React.FC = () => {
  const currentConfig = getSupabaseConfig();

  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.key);

  const [checking, setChecking] = useState(false);
  const [connStatus, setConnStatus] = useState<{ connected: boolean; message: string; details?: any } | null>(null);

  const [syncingPush, setSyncingPush] = useState(false);
  const [syncingPull, setSyncingPull] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    handleTestConnection();
  }, []);

  const handleTestConnection = async () => {
    setChecking(true);
    setConnStatus(null);
    try {
      const res = await checkSupabaseConnection();
      setConnStatus(res);
    } catch (e: any) {
      setConnStatus({ connected: false, message: e.message || 'Lỗi kiểm tra' });
    } finally {
      setChecking(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url.trim(), anonKey.trim());
    setSyncResult({ success: true, message: 'Đã lưu cấu hình kết nối Supabase thành công!' });
    handleTestConnection();
  };

  const handlePushData = async () => {
    setSyncingPush(true);
    setSyncResult(null);
    try {
      const res = await store.pushToSupabase();
      setSyncResult(res);
    } catch (e: any) {
      setSyncResult({ success: false, message: e.message || 'Lỗi đẩy dữ liệu' });
    } finally {
      setSyncingPush(false);
    }
  };

  const handlePullData = async () => {
    if (!confirm('Tải dữ liệu từ Supabase sẽ ghi đè lên thời khóa biểu hiện tại trên máy của bạn. Bạn có muốn tiếp tục?')) return;

    setSyncingPull(true);
    setSyncResult(null);
    try {
      const res = await store.pullFromSupabase();
      setSyncResult(res);
    } catch (e: any) {
      setSyncResult({ success: false, message: e.message || 'Lỗi tải dữ liệu' });
    } finally {
      setSyncingPull(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_TABLE_INIT_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                KẾT NỐI & ĐỒNG BỘ SUPABASE DATABASE
                <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Supabase Postgres
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Lưu trữ đám mây thời khóa biểu, phân công giảng dạy và lịch sử phiên bản trên cơ sở dữ liệu Supabase.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={checking}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{checking ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
        </button>
      </div>

      {/* Connection Status Card */}
      <div className={`p-4 rounded-2xl border transition ${
        connStatus?.connected
          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
          : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
      }`}>
        <div className="flex items-start space-x-3">
          {connStatus?.connected ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1 flex-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">
                {connStatus?.connected ? 'ĐÃ KẾT NỐI VỚI SUPABASE' : 'CHƯA KẾT NỐI HOẶC CẦN KHỞI TẠO'}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900/80 text-slate-300">
                {url ? new URL(url).hostname : 'Chưa có URL'}
              </span>
            </div>
            <p className="text-xs opacity-90">{connStatus?.message || 'Chưa thực hiện kiểm tra kết nối.'}</p>
          </div>
        </div>
      </div>

      {/* Sync Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cloud Push */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Upload className="w-4 h-4" />
              <span>Đẩy dữ liệu lên Cloud (Push to Supabase)</span>
            </div>
            <p className="text-xs text-slate-400">
              Lưu toàn bộ danh mục lớp, giáo viên, định mức tiết và phiên bản thời khóa biểu hiện tại lên bảng Postgres Supabase.
            </p>
          </div>

          <button
            onClick={handlePushData}
            disabled={syncingPush || !connStatus?.connected}
            className="w-full mt-3 flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-lg shadow-indigo-600/20"
          >
            <Cloud className={`w-4 h-4 ${syncingPush ? 'animate-bounce' : ''}`} />
            <span>{syncingPush ? 'Đang đẩy dữ liệu...' : 'Đẩy TKB lên Supabase ngay'}</span>
          </button>
        </div>

        {/* Cloud Pull */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Download className="w-4 h-4" />
              <span>Tải dữ liệu từ Cloud (Pull from Supabase)</span>
            </div>
            <p className="text-xs text-slate-400">
              Tải bản ghi thời khóa biểu mới nhất được lưu trên Supabase về máy để tiếp tục xếp và chỉnh sửa.
            </p>
          </div>

          <button
            onClick={handlePullData}
            disabled={syncingPull || !connStatus?.connected}
            className="w-full mt-3 flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-600/20"
          >
            <RefreshCw className={`w-4 h-4 ${syncingPull ? 'animate-spin' : ''}`} />
            <span>{syncingPull ? 'Đang tải dữ liệu...' : 'Tải TKB từ Supabase về'}</span>
          </button>
        </div>
      </div>

      {syncResult && (
        <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
          syncResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {syncResult.success ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{syncResult.message}</span>
        </div>
      )}

      {/* Project Credentials Setup Form */}
      <form onSubmit={handleSaveConfig} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">CẤU HÌNH THÔNG TIN DỰ ÁN SUPABASE</h2>
          </div>
          <span className="text-[10px] text-slate-400">Chỉ số cấu hình bảo mật local storage</span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Supabase Project URL (<code className="text-indigo-400">VITE_SUPABASE_URL</code>)
            </label>
            <input
              type="url"
              required
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Supabase Anon / Public Key (<code className="text-indigo-400">VITE_SUPABASE_ANON_KEY</code>)
            </label>
            <textarea
              required
              rows={3}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <p className="text-[11px] text-slate-400">
            * Hệ thống tự động nhận diện từ file <code className="text-indigo-300">.env.example</code> hoặc cấu hình trực tiếp ở đây.
          </p>

          <button
            type="submit"
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/30"
          >
            <Save className="w-4 h-4" />
            <span>Lưu thông tin kết nối</span>
          </button>
        </div>
      </form>

      {/* SQL Initialization Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">MÃ SQL KHỞI TẠO BẢNG SUPABASE</h3>
          </div>

          <button
            onClick={handleCopySql}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Đã sao chép SQL!' : 'Sao chép SQL'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Mở <strong className="text-slate-200">SQL Editor</strong> trong bảng điều khiển Supabase của bạn và dán đoạn mã bên dưới để khởi tạo bảng lưu trữ TKB:
        </p>

        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed">
          {SUPABASE_TABLE_INIT_SQL}
        </pre>
      </div>
    </div>
  );
};
