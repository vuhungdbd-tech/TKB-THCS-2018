import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Save,
  Copy,
  Check,
  Server,
  Code,
  Download,
  Upload,
  ExternalLink,
  Sparkles,
  Trash2,
  Share2,
  Lock,
  Globe
} from 'lucide-react';
import { store } from '../database/store';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseCustomConfig,
  checkSupabaseConnection,
  subscribeSyncStatus,
  SyncStatus,
  SUPABASE_TABLE_INIT_SQL
} from '../database/supabase';

export const SupabaseConfigView: React.FC = () => {
  const currentConfig = getSupabaseConfig();

  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.key);

  const [checking, setChecking] = useState(false);
  const [connStatus, setConnStatus] = useState<{
    connected: boolean;
    message: string;
    tableExists: boolean;
    canWrite: boolean;
    details?: any;
  } | null>(null);

  const [syncingPush, setSyncingPush] = useState(false);
  const [syncingPull, setSyncingPull] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const [liveSyncStatus, setLiveSyncStatus] = useState<SyncStatus>('idle');
  const [liveSyncMsg, setLiveSyncMsg] = useState<string>('');

  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [copiedEnvName, setCopiedEnvName] = useState<string | null>(null);

  useEffect(() => {
    handleTestConnection();
    const unsub = subscribeSyncStatus((status, msg) => {
      setLiveSyncStatus(status);
      setLiveSyncMsg(msg || '');
    });
    return () => unsub();
  }, []);

  const handleTestConnection = async () => {
    setChecking(true);
    setConnStatus(null);
    try {
      const res = await checkSupabaseConnection();
      setConnStatus(res);
    } catch (e: any) {
      setConnStatus({
        connected: false,
        message: e.message || 'Lỗi kiểm tra kết nối',
        tableExists: false,
        canWrite: false
      });
    } finally {
      setChecking(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url.trim(), anonKey.trim());
    setSyncResult({ success: true, message: 'Đã lưu cấu hình kết nối Supabase thành công vào trình duyệt!' });
    handleTestConnection();
    // Kéo dữ liệu từ Cloud về sau khi lưu cấu hình
    setTimeout(() => {
      store.pullFromSupabase();
    }, 300);
  };

  const handleClearCustomConfig = () => {
    if (confirm('Khôi phục về cấu hình biến môi trường mặc định?')) {
      clearSupabaseCustomConfig();
      const updated = getSupabaseConfig();
      setUrl(updated.url);
      setAnonKey(updated.key);
      handleTestConnection();
    }
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
    if (!confirm('Tải dữ liệu từ Supabase sẽ cập nhật thời khóa biểu hiện tại trên máy của bạn với bản mới nhất trên Cloud. Bạn có muốn tiếp tục?')) return;

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

  const handleCopyShareLink = () => {
    const origin = window.location.origin + window.location.pathname;
    const shareUrl = `${origin}?sb_url=${encodeURIComponent(url.trim())}&sb_key=${encodeURIComponent(anonKey.trim())}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 3000);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEnvName(label);
    setTimeout(() => setCopiedEnvName(null), 2000);
  };

  const configInfo = getSupabaseConfig();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                KẾT NỐI & ĐỒNG BỘ ĐA TRÌNH DUYỆT (SUPABASE CLOUD)
                <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Postgres + Realtime
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Đảm bảo khi mở trên bất kỳ máy tính hay trình duyệt nào khác (Chrome, Safari, Edge, điện thoại), toàn bộ dữ liệu TKB luôn được đồng bộ.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={checking}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{checking ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
        </button>
      </div>

      {/* Realtime Status Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs">
        <div className="flex items-center space-x-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${
            connStatus?.connected && connStatus?.canWrite
              ? 'bg-emerald-400 animate-pulse'
              : connStatus?.connected
              ? 'bg-amber-400'
              : 'bg-rose-500'
          }`} />
          <span className="font-semibold text-slate-200">Trạng thái đồng bộ tự động:</span>
          <span className="text-slate-400">
            {liveSyncMsg || (configInfo.isConfigured ? 'Đang kích hoạt tự động lưu khi có thay đổi' : 'Chưa kích hoạt')}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            Nguồn: {
              configInfo.source === 'env'
                ? 'Biến môi trường Vercel (VITE_...)'
                : configInfo.source === 'localStorage'
                ? 'Cấu hình trình duyệt này'
                : configInfo.source === 'url_param'
                ? 'Đường link kết nối (URL params)'
                : 'Chưa cấu hình'
            }
          </span>
        </div>
      </div>

      {/* Connection Diagnostics Card */}
      <div
        className={`p-5 rounded-2xl border transition shadow-lg ${
          connStatus?.connected && connStatus?.canWrite
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
            : connStatus?.connected
            ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
            : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
        }`}
      >
        <div className="flex items-start space-x-3.5">
          {connStatus?.connected && connStatus?.canWrite ? (
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          ) : connStatus?.connected ? (
            <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          )}

          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="font-bold text-sm tracking-wide">
                {connStatus?.connected && connStatus?.canWrite
                  ? 'KẾT NỐI SUPABASE THÀNH CÔNG & ĐÃ SẴN SÀNG LƯU DỮ LIỆU ĐA THIẾT BỊ'
                  : connStatus?.connected && !connStatus?.tableExists
                  ? 'KẾT NỐI ĐƯỢC NHƯNG CẦN CHẠY LỆNH TẠO BẢNG TRÊN SUPABASE'
                  : connStatus?.connected && !connStatus?.canWrite
                  ? 'KẾT NỐI ĐƯỢC NHƯNG BỊ CHẶN BỞI PHÂN QUYỀN RLS TRÊN SUPABASE'
                  : 'CHƯA THỂ LƯU DỮ LIỆU LÊN SUPABASE (DỮ LIỆU ĐANG LƯU TẠM BỘ NHỚ TRÌNH DUYỆT NÀY)'}
              </span>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-900/90 text-slate-300 border border-slate-800 self-start sm:self-auto">
                {url ? new URL(url).hostname : 'Chưa có Supabase URL'}
              </span>
            </div>

            <p className="text-xs leading-relaxed opacity-90">{connStatus?.message || 'Chưa kiểm tra kết nối.'}</p>

            {connStatus?.connected && !connStatus?.tableExists && (
              <div className="pt-2">
                <button
                  onClick={handleCopySql}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition shadow"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép lệnh SQL để dán vào Supabase SQL Editor ngay</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instant Share Link Box (Giải pháp tức thì cho các trình duyệt khác mà không cần cấu hình lại) */}
      {configInfo.isConfigured && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <Share2 className="w-4 h-4 text-indigo-400" />
              <span>Link mở trên trình duyệt khác tự động kết nối Supabase</span>
            </div>
            <span className="text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
              Không cần nhập lại cấu hình
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Sao chép đường link này và dán sang <strong>trình duyệt khác (Chrome, Edge, Safari)</strong> hoặc gửi cho giáo viên khác. Trình duyệt đó sẽ tự động kết nối vào cùng cơ sở dữ liệu Supabase và hiển thị ngay thời khóa biểu của trường!
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyShareLink}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-indigo-600/30"
            >
              {copiedShareLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedShareLink ? 'Đã sao chép liên kết vào bộ nhớ tạm!' : 'Sao chép liên kết đồng bộ mở trên máy/trình duyệt khác'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Sync Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cloud Push */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Upload className="w-4 h-4" />
              <span>Đẩy dữ liệu lên Cloud (Push to Supabase)</span>
            </div>
            <p className="text-xs text-slate-400">
              Lưu toàn bộ danh mục lớp, giáo viên, định mức tiết, phân công chuyên môn và phiên bản thời khóa biểu hiện tại lên Supabase Cloud.
            </p>
          </div>

          <button
            onClick={handlePushData}
            disabled={syncingPush || !configInfo.isConfigured}
            className="w-full mt-3 flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-lg shadow-indigo-600/20"
          >
            <Cloud className={`w-4 h-4 ${syncingPush ? 'animate-bounce' : ''}`} />
            <span>{syncingPush ? 'Đang đẩy dữ liệu...' : 'Lưu TKB lên Supabase ngay'}</span>
          </button>
        </div>

        {/* Cloud Pull */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Download className="w-4 h-4" />
              <span>Tải dữ liệu từ Cloud (Pull from Supabase)</span>
            </div>
            <p className="text-xs text-slate-400">
              Tải bản ghi thời khóa biểu mới nhất được lưu trên Supabase về máy của bạn (hữu ích khi vừa chuyển sang thiết bị khác).
            </p>
          </div>

          <button
            onClick={handlePullData}
            disabled={syncingPull || !configInfo.isConfigured}
            className="w-full mt-3 flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-600/20"
          >
            <RefreshCw className={`w-4 h-4 ${syncingPull ? 'animate-spin' : ''}`} />
            <span>{syncingPull ? 'Đang tải dữ liệu...' : 'Tải TKB từ Supabase về máy này'}</span>
          </button>
        </div>
      </div>

      {syncResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center space-x-2.5 ${
            syncResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {syncResult.success ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{syncResult.message}</span>
        </div>
      )}

      {/* Guide for Vercel Deployment */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            CÁCH ĐỂ MỌI TRÌNH DUYỆT TỰ ĐỘNG CÓ DỮ LIỆU (CẤU HÌNH VERCEL)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <span className="font-bold text-indigo-400 block text-sm">Bước 1: Thêm biến trên Vercel</span>
            <p className="text-slate-300 leading-relaxed">
              Vào trang quản lý dự án trên <strong>Vercel</strong> → <strong>Settings</strong> → <strong>Environment Variables</strong> và thêm 2 biến sau:
            </p>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">VITE_SUPABASE_URL</span>
                <button
                  onClick={() => handleCopyText('VITE_SUPABASE_URL', 'url')}
                  className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 text-[10px]"
                >
                  {copiedEnvName === 'url' ? 'Đã copy!' : 'Sao chép'}
                </button>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">VITE_SUPABASE_ANON_KEY</span>
                <button
                  onClick={() => handleCopyText('VITE_SUPABASE_ANON_KEY', 'key')}
                  className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 text-[10px]"
                >
                  {copiedEnvName === 'key' ? 'Đã copy!' : 'Sao chép'}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-amber-300/90 font-medium">
              ⚠️ QUAN TRỌNG: Sau khi thêm 2 biến trên Vercel, bạn vào mục <strong>Deployments</strong> trên Vercel → chọn nút <strong>Redeploy</strong> để Vercel đóng gói 2 biến này vào mã nguồn web. Sau đó mọi trình duyệt mở link web đều tự động có dữ liệu chung!
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <span className="font-bold text-emerald-400 block text-sm">Bước 2: Chạy lệnh tạo bảng trên Supabase</span>
            <p className="text-slate-300 leading-relaxed">
              Vào bảng điều khiển <strong>Supabase</strong> → chọn dự án của bạn → mở mục <strong>SQL Editor</strong> ở thanh bên trái → dán đoạn mã SQL bên dưới và nhấn <strong>Run</strong>.
            </p>
            <div className="bg-slate-900/90 p-3 rounded border border-slate-800 text-slate-400 text-[11px] space-y-1">
              <p>✔ Tạo bảng <code>timetable_app_state</code></p>
              <p>✔ Cho phép đọc/ghi công khai (RLS Policy: "Allow public read and write")</p>
            </div>
          </div>
        </div>
      </div>

      {/* SQL Script Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              ĐOẠN MÃ SQL KHỞI TẠO BẢNG TRÊN SUPABASE (COPY & CHẠY 1 LẦN)
            </h3>
          </div>

          <button
            onClick={handleCopySql}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Đã sao chép SQL!' : 'Sao chép đoạn mã SQL'}</span>
          </button>
        </div>

        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed">
          {SUPABASE_TABLE_INIT_SQL}
        </pre>
      </div>

      {/* Form nhập tay nếu chưa cài đặt biến môi trường Vercel */}
      <form onSubmit={handleSaveConfig} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              HOẶC NHẬP THÔNG TIN KẾT NỐI TRỰC TIẾP TRÊN TRÌNH DUYỆT NÀY
            </h2>
          </div>
          {configInfo.source === 'localStorage' && (
            <button
              type="button"
              onClick={handleClearCustomConfig}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa cấu hình trình duyệt này</span>
            </button>
          )}
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Supabase Project URL (<code className="text-indigo-400">https://xyzcompany.supabase.co</code>)
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
              Supabase Anon / Public Key (<code className="text-indigo-400">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</code>)
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
            * Nhấn lưu sẽ kết nối và tự động tải thời khóa biểu mới nhất từ Supabase về trình duyệt này ngay lập tức.
          </p>

          <button
            type="submit"
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/30"
          >
            <Save className="w-4 h-4" />
            <span>Lưu & Tải TKB từ Supabase</span>
          </button>
        </div>
      </form>
    </div>
  );
};
