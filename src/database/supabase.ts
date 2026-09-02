import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseState } from './store';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/storage';

const SUPABASE_URL_KEY = 'tkb_supabase_url_custom';
const SUPABASE_KEY_KEY = 'tkb_supabase_key_custom';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'not_configured';

export interface SupabaseConfigInfo {
  url: string;
  key: string;
  isConfigured: boolean;
  source: 'env' | 'localStorage' | 'url_param' | 'none';
}

let syncStatusListeners: Array<(status: SyncStatus, message?: string) => void> = [];
let currentSyncStatus: SyncStatus = 'idle';
let currentSyncMessage: string = '';

export function subscribeSyncStatus(listener: (status: SyncStatus, message?: string) => void) {
  syncStatusListeners.push(listener);
  listener(currentSyncStatus, currentSyncMessage);
  return () => {
    syncStatusListeners = syncStatusListeners.filter(l => l !== listener);
  };
}

export function setSyncStatus(status: SyncStatus, message: string = '') {
  currentSyncStatus = status;
  currentSyncMessage = message;
  syncStatusListeners.forEach(l => l(status, message));
}

/**
 * Trích xuất cấu hình Supabase từ các nguồn:
 * 1. URL Query Params (tiện lợi khi chia sẻ liên kết giữa các máy/trình duyệt: ?sb_url=...&sb_key=...)
 * 2. Biến môi trường Vercel (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, etc.)
 * 3. LocalStorage đã lưu trước đó
 */
export function getSupabaseConfig(): SupabaseConfigInfo {
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const procEnv = (typeof process !== 'undefined' && process.env) || {};

  // 1. Kiểm tra URL params nếu có
  let paramUrl = '';
  let paramKey = '';
  if (typeof window !== 'undefined' && window.location) {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      paramUrl = (searchParams.get('sb_url') || searchParams.get('supabase_url') || '').trim();
      paramKey = (searchParams.get('sb_key') || searchParams.get('supabase_key') || searchParams.get('anon_key') || '').trim();
      
      // Tự động lưu vào localStorage nếu truyền qua URL param
      if (paramUrl && paramKey) {
        safeSetItem(SUPABASE_URL_KEY, paramUrl);
        safeSetItem(SUPABASE_KEY_KEY, paramKey);
      }
    } catch {
      // Bỏ qua nếu môi trường không có window
    }
  }

  // 2. Kiểm tra Biến môi trường Vite/Vercel
  const envUrl = (
    metaEnv.VITE_SUPABASE_URL ||
    metaEnv.SUPABASE_URL ||
    metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
    metaEnv.REACT_APP_SUPABASE_URL ||
    procEnv.VITE_SUPABASE_URL ||
    procEnv.SUPABASE_URL ||
    ''
  ).trim();

  const envKey = (
    metaEnv.VITE_SUPABASE_ANON_KEY ||
    metaEnv.VITE_SUPABASE_KEY ||
    metaEnv.SUPABASE_ANON_KEY ||
    metaEnv.SUPABASE_KEY ||
    metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    metaEnv.REACT_APP_SUPABASE_ANON_KEY ||
    procEnv.VITE_SUPABASE_ANON_KEY ||
    procEnv.SUPABASE_ANON_KEY ||
    ''
  ).trim();

  // 3. Kiểm tra LocalStorage
  const localUrl = (safeGetItem(SUPABASE_URL_KEY) || '').trim();
  const localKey = (safeGetItem(SUPABASE_KEY_KEY) || '').trim();

  const url = paramUrl || envUrl || localUrl;
  const key = paramKey || envKey || localKey;

  let source: 'env' | 'localStorage' | 'url_param' | 'none' = 'none';
  if (paramUrl && paramKey) {
    source = 'url_param';
  } else if (envUrl && envKey) {
    source = 'env';
  } else if (localUrl && localKey) {
    source = 'localStorage';
  }

  return {
    url,
    key,
    isConfigured: Boolean(url && key),
    source
  };
}

export function saveSupabaseConfig(url: string, key: string) {
  if (url) safeSetItem(SUPABASE_URL_KEY, url.trim());
  else safeRemoveItem(SUPABASE_URL_KEY);

  if (key) safeSetItem(SUPABASE_KEY_KEY, key.trim());
  else safeRemoveItem(SUPABASE_KEY_KEY);

  resetSupabaseClient();
  setSyncStatus(url && key ? 'idle' : 'not_configured', 'Đã cập nhật cấu hình');
}

export function clearSupabaseCustomConfig() {
  safeRemoveItem(SUPABASE_URL_KEY);
  safeRemoveItem(SUPABASE_KEY_KEY);
  resetSupabaseClient();
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return clientInstance;
}

export function resetSupabaseClient() {
  clientInstance = null;
}

/**
 * Kiểm tra kết nối và quyền đọc/ghi trên Supabase
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  tableExists: boolean;
  canWrite: boolean;
  details?: any;
}> {
  const client = getSupabaseClient();
  const { url, isConfigured } = getSupabaseConfig();

  if (!isConfigured || !client) {
    return {
      connected: false,
      message: 'Chưa cấu hình Supabase URL & Anon Key (Hãy cài đặt biến môi trường Vercel hoặc nhập trực tiếp)',
      tableExists: false,
      canWrite: false
    };
  }

  try {
    // 1. Kiểm tra đọc bảng timetable_app_state
    const { data, error } = await client
      .from('timetable_app_state')
      .select('id, updated_at')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        // Table does not exist
        return {
          connected: true,
          message: 'Kết nối máy chủ thành công nhưng BẢNG "timetable_app_state" CHƯA ĐƯỢC TẠO. Hãy chạy đoạn mã SQL khởi tạo.',
          tableExists: false,
          canWrite: false,
          details: { error, url }
        };
      }

      if (error.code === '42501') {
        // Permission denied (RLS)
        return {
          connected: true,
          message: 'Bị chặn bởi phân quyền RLS (Row Level Security). Hãy áp dụng Policy cho phép đọc/ghi công khai.',
          tableExists: true,
          canWrite: false,
          details: { error, url }
        };
      }

      return {
        connected: false,
        message: `Lỗi kết nối Supabase: ${error.message} (Mã: ${error.code})`,
        tableExists: false,
        canWrite: false,
        details: error
      };
    }

    // 2. Thử nghiệm ghi nhẹ (Write Test)
    const testPing = {
      id: 'connection_test_ping',
      data: { ping: true, time: new Date().toISOString() },
      updated_at: new Date().toISOString()
    };

    const { error: writeError } = await client
      .from('timetable_app_state')
      .upsert(testPing, { onConflict: 'id' });

    if (writeError) {
      return {
        connected: true,
        message: `Đọc được nhưng ghi bị lỗi (${writeError.message}). Kiểm tra lại RLS Policy trên Supabase!`,
        tableExists: true,
        canWrite: false,
        details: writeError
      };
    }

    // Xóa bản ghi test
    await client.from('timetable_app_state').delete().eq('id', 'connection_test_ping');

    return {
      connected: true,
      message: 'Kết nối Supabase hoàn toàn ổn định! Quyền ĐỌC & GHI đã sẵn sàng.',
      tableExists: true,
      canWrite: true,
      details: { rowCount: data?.length || 0, url }
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Không thể kết nối đến máy chủ Supabase: ${err.message || 'Lỗi mạng'}`,
      tableExists: false,
      canWrite: false,
      details: err
    };
  }
}

/**
 * Đẩy toàn bộ dữ liệu CSDL thời khóa biểu lên Supabase
 */
export async function syncStateToSupabase(state: DatabaseState): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  const { isConfigured } = getSupabaseConfig();

  if (!isConfigured || !client) {
    setSyncStatus('not_configured', 'Chưa cấu hình Supabase');
    return {
      success: false,
      message: 'Chưa cấu hình Supabase URL và Key. Dữ liệu đang được lưu tạm trên trình duyệt (LocalStorage).'
    };
  }

  setSyncStatus('syncing', 'Đang lưu dữ liệu lên Supabase...');

  try {
    const payload = {
      id: 'default_school_data',
      data: state,
      updated_at: new Date().toISOString()
    };

    const { error } = await client
      .from('timetable_app_state')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      let errMsg = error.message;
      if (error.code === '42P01') {
        errMsg = 'Bảng "timetable_app_state" chưa tồn tại trên Supabase. Vui lòng chạy lệnh SQL khởi tạo bảng.';
      } else if (error.code === '42501') {
        errMsg = 'Chưa bật quyền RLS ghi công khai (Policy "Allow public read and write") trên Supabase.';
      }
      setSyncStatus('error', errMsg);
      return { success: false, message: `Lỗi lưu Supabase: ${errMsg}` };
    }

    setSyncStatus('synced', 'Đã lưu lên Supabase lúc ' + new Date().toLocaleTimeString('vi-VN'));
    return { success: true, message: 'Đã đồng bộ toàn bộ dữ liệu TKB lên Supabase thành công!' };
  } catch (err: any) {
    const errMsg = err.message || String(err);
    setSyncStatus('error', errMsg);
    return { success: false, message: `Thao tác lưu đám mây thất bại: ${errMsg}` };
  }
}

/**
 * Kéo dữ liệu từ Supabase về ứng dụng
 */
export async function fetchStateFromSupabase(): Promise<{
  success: boolean;
  data?: DatabaseState;
  message: string;
  hasData?: boolean;
}> {
  const client = getSupabaseClient();
  const { isConfigured } = getSupabaseConfig();

  if (!isConfigured || !client) {
    return { success: false, message: 'Chưa cấu hình Supabase URL và Key.' };
  }

  setSyncStatus('syncing', 'Đang tải dữ liệu từ Supabase...');

  try {
    const { data, error } = await client
      .from('timetable_app_state')
      .select('data, updated_at')
      .eq('id', 'default_school_data')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found - database exists but empty
        setSyncStatus('synced', 'Supabase chưa có dữ liệu');
        return {
          success: true,
          hasData: false,
          message: 'Supabase đã kết nối nhưng chưa có dữ liệu được lưu trước đó.'
        };
      }
      setSyncStatus('error', error.message);
      return { success: false, message: `Lỗi tải dữ liệu Supabase: ${error.message}` };
    }

    if (data && data.data) {
      setSyncStatus('synced', 'Đã tải dữ liệu lúc ' + new Date().toLocaleTimeString('vi-VN'));
      return {
        success: true,
        hasData: true,
        data: data.data as DatabaseState,
        message: 'Tải dữ liệu từ Supabase thành công!'
      };
    }

    setSyncStatus('synced', 'Chưa có bản ghi dữ liệu');
    return { success: true, hasData: false, message: 'Chưa tìm thấy dữ liệu TKB lưu trên Supabase.' };
  } catch (err: any) {
    const errMsg = err.message || String(err);
    setSyncStatus('error', errMsg);
    return { success: false, message: `Lỗi kết nối: ${errMsg}` };
  }
}

export const SUPABASE_TABLE_INIT_SQL = `-- 1. Tạo bảng lưu trữ toàn bộ trạng thái Thời khóa biểu và Danh mục
CREATE TABLE IF NOT EXISTS public.timetable_app_state (
    id TEXT PRIMARY KEY DEFAULT 'default_school_data',
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Kích hoạt tính năng bảo mật Row Level Security (RLS)
ALTER TABLE public.timetable_app_state ENABLE ROW LEVEL SECURITY;

-- 3. Xóa Policy cũ nếu có và cấp quyền ĐỌC/GHI toàn quyền cho ứng dụng
DROP POLICY IF EXISTS "Allow public read and write" ON public.timetable_app_state;

CREATE POLICY "Allow public read and write"
ON public.timetable_app_state
FOR ALL
USING (true)
WITH CHECK (true);
`;
