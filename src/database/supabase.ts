import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseState } from './store';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/storage';

const SUPABASE_URL_KEY = 'tkb_supabase_url_custom';
const SUPABASE_KEY_KEY = 'tkb_supabase_key_custom';

export function getSupabaseConfig() {
  const metaEnv = (import.meta as any).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL || '';
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = safeGetItem(SUPABASE_URL_KEY) || '';
  const localKey = safeGetItem(SUPABASE_KEY_KEY) || '';

  const url = localUrl || envUrl;
  const key = localKey || envKey;

  return { url, key, isConfigured: Boolean(url && key) };
}

export function saveSupabaseConfig(url: string, key: string) {
  if (url) safeSetItem(SUPABASE_URL_KEY, url);
  else safeRemoveItem(SUPABASE_URL_KEY);

  if (key) safeSetItem(SUPABASE_KEY_KEY, key);
  else safeRemoveItem(SUPABASE_KEY_KEY);

  resetSupabaseClient();
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, key, {
        auth: { persistSession: true }
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
 * Test connectivity to Supabase
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  details?: any;
}> {
  const client = getSupabaseClient();
  const { url } = getSupabaseConfig();

  if (!client) {
    return {
      connected: false,
      message: 'Chưa cấu hình Supabase URL & Anon Key.'
    };
  }

  try {
    // Try to query a lightweight test table or check server health
    const { data, error } = await client.from('timetable_app_state').select('id, updated_at').limit(1);

    if (error) {
      // If table doesn't exist yet, we can try to create or handle notice
      if (error.code === '42P01') { // relation does not exist
        return {
          connected: true,
          message: 'Đã kết nối thành công đến Supabase! (Cần tạo bảng timetable_app_state để đồng bộ dữ liệu)',
          details: { tableMissing: true, url }
        };
      }
      return {
        connected: false,
        message: `Lỗi kết nối Supabase: ${error.message} (Mã: ${error.code})`,
        details: error
      };
    }

    return {
      connected: true,
      message: 'Kết nối Supabase thành công & sẵn sàng đồng bộ dữ liệu!',
      details: { rowCount: data?.length || 0, url }
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Không thể kết nối đến máy chủ Supabase: ${err.message || 'Lỗi mạng'}`,
      details: err
    };
  }
}

/**
 * Push local DatabaseState to Supabase table
 */
export async function syncStateToSupabase(state: DatabaseState): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Chưa cấu hình Supabase URL và Key.' };
  }

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
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Bảng "timetable_app_state" chưa tồn tại trên Supabase. Vui lòng chạy lệnh SQL khởi tạo bảng.'
        };
      }
      return { success: false, message: `Lỗi đồng bộ Supabase: ${error.message}` };
    }

    return { success: true, message: 'Đã đồng bộ toàn bộ dữ liệu TKB lên Supabase thành công!' };
  } catch (err: any) {
    return { success: false, message: `Thao tác thất bại: ${err.message || err}` };
  }
}

/**
 * Pull remote state from Supabase to local state
 */
export async function fetchStateFromSupabase(): Promise<{ success: boolean; data?: DatabaseState; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Chưa cấu hình Supabase URL và Key.' };
  }

  try {
    const { data, error } = await client
      .from('timetable_app_state')
      .select('data')
      .eq('id', 'default_school_data')
      .single();

    if (error) {
      return { success: false, message: `Lỗi tải dữ liệu Supabase: ${error.message}` };
    }

    if (data && data.data) {
      return {
        success: true,
        data: data.data as DatabaseState,
        message: 'Tải dữ liệu từ Supabase thành công!'
      };
    }

    return { success: false, message: 'Chưa tìm thấy dữ liệu TKB lưu trên Supabase.' };
  } catch (err: any) {
    return { success: false, message: `Lỗi kết nối: ${err.message || err}` };
  }
}

export const SUPABASE_TABLE_INIT_SQL = `
-- Lệnh SQL khởi tạo bảng lưu trữ TKB THCS trên Supabase Postgres
CREATE TABLE IF NOT EXISTS public.timetable_app_state (
    id TEXT PRIMARY KEY DEFAULT 'default_school_data',
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cho phép truy cập dữ liệu công khai (Anonymously Accessible)
ALTER TABLE public.timetable_app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read and write"
ON public.timetable_app_state
FOR ALL
USING (true)
WITH CHECK (true);
`;
