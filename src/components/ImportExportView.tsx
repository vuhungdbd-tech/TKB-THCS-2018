import React, { useState } from 'react';
import { FileSpreadsheet, Download, Upload, Check, FileText, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateSampleExcelTemplate, exportTimetableToExcel } from '../utils/excel';
import { exportTimetableToPDF } from '../utils/pdf';
import { exportMasterMatrixToExcel } from '../utils/matrixExport';
import { store } from '../database/store';

export const ImportExportView: React.FC = () => {
  const state = store.getState();
  const currentWeek = store.getCurrentWeek();
  const version = store.getTimetableVersion(currentWeek.id);

  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        setImportStatus(`✓ Đã đọc tập tin thành công! Tìm thấy các sheet: ${wb.SheetNames.join(', ')}.`);
        store.addAuditLog('Nhập dữ liệu Excel', `Nhập tập tin ${file.name}`);
      } catch (err: any) {
        setImportStatus(`❌ Lỗi đọc tập tin Excel: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">NHẬP VÀ XUẤT DỮ LIỆU EXCEL / PDF</h1>
        </div>
        <p className="text-xs text-slate-400">
          Tải mẫu Excel chuẩn GDPT 2018, nhập dữ liệu danh mục & xuất báo cáo Thời khóa biểu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Download Sample Template */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase">1. TẢI MẪU EXCEL NGUYÊN BẢN</h2>
              <p className="text-xs text-slate-400">Chứa đầy đủ các Sheet: Lớp, Môn, Phân môn KHTN/KHXH, GV, Phân công</p>
            </div>
          </div>

          <p className="text-xs text-slate-300">
            Sử dụng mẫu này để nhập danh sách lớp, môn học, phân môn KHTN/KHXH và phân công giảng dạy đồng bộ vào hệ thống.
          </p>

          <button
            onClick={generateSampleExcelTemplate}
            className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Tải Mẫu Excel Mau_Nhap_Du_Lieu_TKB.xlsx</span>
          </button>
        </div>

        {/* Card 2: Upload Excel File */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase">2. NHẬP DỮ LIỆU TỪ TẬP TIN EXCEL</h2>
              <p className="text-xs text-slate-400">Tải file Excel đã nhập thông tin lên hệ thống</p>
            </div>
          </div>

          <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition">
            <Upload className="w-6 h-6 text-slate-500 mb-2" />
            <span className="text-xs font-semibold text-slate-300">Nhấn vào đây để chọn tập tin Excel (.xlsx)</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>

          {importStatus && (
            <p className="text-xs font-semibold text-indigo-400 bg-indigo-950/40 p-3 rounded-lg border border-indigo-900/40">
              {importStatus}
            </p>
          )}
        </div>
      </div>

      {/* Card 3: Export Options */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. XUẤT BÁO CÁO THỜI KHÓA BIỂU HỆ THỐNG ({currentWeek.name})</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <button
            onClick={() => exportMasterMatrixToExcel(state, currentWeek.id, version?.entries || [])}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/20 text-center space-y-2"
          >
            <FileSpreadsheet className="w-5 h-5 text-white" />
            <span>Xuất Excel Ma Trận Chuẩn (Giống Hình Gốc)</span>
          </button>

          <button
            onClick={() => exportTimetableToExcel(state, currentWeek.id, version?.entries || [], 'Excel')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition text-center space-y-2"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span>Xuất Excel theo từng Sheet Lớp</span>
          </button>

          <button
            onClick={() => exportTimetableToPDF(state, currentWeek.id, version?.entries || [], 'school')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition text-center space-y-2"
          >
            <FileText className="w-5 h-5 text-rose-400" />
            <span>Xuất báo cáo TKB ra PDF (.pdf)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
