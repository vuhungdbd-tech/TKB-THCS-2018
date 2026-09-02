import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  FileText,
  AlertCircle,
  Database,
  RefreshCw,
  Layers,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  generateSampleExcelTemplate,
  exportCurrentDatabaseToExcel,
  importDataFromExcel,
  exportTimetableToExcel
} from '../utils/excel';
import { exportTimetableToPDF } from '../utils/pdf';
import { exportMasterMatrixToExcel } from '../utils/matrixExport';
import { store } from '../database/store';

export const ImportExportView: React.FC = () => {
  const state = store.getState();
  const currentWeek = store.getCurrentWeek();
  const version = store.getTimetableVersion(currentWeek.id);

  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    stats: { classes: number; subjects: number; teachers: number; assignments: number };
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const result = importDataFromExcel(wb, state);
        setImportResult(result);

        if (result.success && result.importedData) {
          store.updateMasterData(result.importedData);
          store.addAuditLog('Nhập dữ liệu Excel', `Đã nhập dữ liệu từ tập tin ${file.name}`);
        }
      } catch (err: any) {
        setImportResult({
          success: false,
          message: `❌ Lỗi khi đọc file Excel: ${err.message || 'Định dạng file không hợp lệ'}`,
          stats: { classes: 0, subjects: 0, teachers: 0, assignments: 0 }
        });
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setImportResult({
        success: false,
        message: '❌ Không thể đọc tập tin từ thiết bị.',
        stats: { classes: 0, subjects: 0, teachers: 0, assignments: 0 }
      });
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              QUẢN LÝ NHẬP & XUẤT DỮ LIỆU EXCEL
            </h1>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
              Chuẩn GDPT 2018
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hệ thống hỗ trợ làm sạch mẫu Excel, đồng bộ danh mục Lớp, Môn, Giáo viên và Phân công chuyên môn tự động.
          </p>
        </div>

        <button
          onClick={() => exportCurrentDatabaseToExcel(state)}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
        >
          <Database className="w-4 h-4 text-sky-400" />
          <span>Sao lưu CSDL ra Excel (.xlsx)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Tải Mẫu Excel Đã Làm Sạch */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase">1. TẢI BẢN MẪU EXCEL CHUẨN</h2>
                <p className="text-xs text-slate-400">Đã định dạng sẵn 5 Sheet chuẩn chỉnh</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bản Excel đã được làm sạch cấu trúc, chia sẵn 5 sheet: <strong>Lớp</strong>, <strong>Môn</strong>, <strong>Phân môn KHTN/KHXH</strong>, <strong>Giáo viên</strong> và <strong>Phân công</strong>.
            </p>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quy chuẩn dữ liệu:</span>
              </div>
              <p>• Mã lớp & khối chuẩn: 6A1, 6A2, 7B1, 8C1, 9D1...</p>
              <p>• Phân môn KHTN (Vật lí, Hóa học, Sinh học) & KHXH (Lịch sử, Địa lí).</p>
              <p>• Phân công rõ ràng mã giáo viên tương ứng từng môn học.</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => generateSampleExcelTemplate(false)}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Tải Mẫu Excel Đầy Đủ (Có Dữ Liệu Chuẩn)</span>
            </button>

            <button
              onClick={() => generateSampleExcelTemplate(true)}
              className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 rounded-xl text-xs transition border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Mẫu Excel Trắng (Chỉ Tiêu Đề Cột)</span>
            </button>
          </div>
        </div>

        {/* Card 2: Nhập Dữ Liệu từ File Excel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase">2. NHẬP FILE EXCEL VÀO HỆ THỐNG</h2>
                <p className="text-xs text-slate-400">Tự động đọc, phân tích và làm sạch dữ liệu</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Tải file Excel sau khi bạn đã nhập thông tin lên hệ thống. Bộ lọc sẽ tự động đồng bộ danh sách lớp, môn học, giáo viên và phân công chuyên môn.
            </p>

            <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition group">
              <Upload className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 mb-2 transition" />
              <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                {isProcessing ? 'Đang đọc và xử lý file Excel...' : 'Nhấn để chọn file Excel (.xlsx, .xls)'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">Dung lượng tối đa 15MB</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
              />
            </label>
          </div>

          {importResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                importResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {importResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>{importResult.message}</span>
              </div>
              {importResult.success && (
                <div className="grid grid-cols-4 gap-2 text-center pt-2 text-[11px] bg-black/20 p-2 rounded-lg">
                  <div>
                    <span className="block text-slate-400 text-[10px]">Lớp học</span>
                    <strong className="text-emerald-400 font-bold">{importResult.stats.classes}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px]">Môn học</span>
                    <strong className="text-emerald-400 font-bold">{importResult.stats.subjects}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px]">Giáo viên</span>
                    <strong className="text-emerald-400 font-bold">{importResult.stats.teachers}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px]">Phân công</span>
                    <strong className="text-emerald-400 font-bold">{importResult.stats.assignments}</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Xuất Báo Cáo Thời Khóa Biểu Ra Excel & PDF */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              3. XUẤT BÁO CÁO THỜI KHÓA BIỂU ĐÃ XẾP ({currentWeek.name})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Tổng cộng: {version?.entries.length || 0} tiết đã xếp
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <button
            onClick={() => exportMasterMatrixToExcel(state, currentWeek.id, version?.entries || [])}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/20 text-center space-y-2"
          >
            <FileSpreadsheet className="w-5 h-5 text-white" />
            <span>Xuất Excel Ma Trận Toàn Trường (Mẫu Chuẩn)</span>
          </button>

          <button
            onClick={() => exportTimetableToExcel(state, currentWeek.id, version?.entries || [], 'Excel')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition text-center space-y-2"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span>Xuất Excel Theo Từng Sheet Lớp</span>
          </button>

          <button
            onClick={() => exportTimetableToPDF(state, currentWeek.id, version?.entries || [], 'school')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition text-center space-y-2"
          >
            <FileText className="w-5 h-5 text-rose-400" />
            <span>Xuất Báo Cáo Thời Khóa Biểu (.pdf)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
