// src/App.tsx
import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, Trash2, Download, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useOrderStore } from './store/orderStore';
import { processExcelFile, convertToMasterData } from './lib/excelHandler';
import { MASTER_HEADERS } from './lib/constants';

function App() {
  const { files, masterData, addFiles, setMasterData, clearAll } = useOrderStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * 파일 처리 핸들러
   * 다중 파일 병렬 파싱(Promise.all) 후 Global State 업데이트
   */
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);

    try {
      const targetFiles = Array.from(fileList);
      
      // 파일 파싱 병렬 처리
      const uploadedFiles = await Promise.all(
        targetFiles.map(async (file) => await processExcelFile(file))
      );

      // 1. 원본 파일 State 업데이트
      addFiles(uploadedFiles);

      // 2. 누적된 전체 파일을 기준으로 통합 데이터 재생성
      const currentFiles = useOrderStore.getState().files; 
      const newMasterData = convertToMasterData(currentFiles);
      
      setMasterData(newMasterData);

    } catch (error) {
      console.error("File processing error:", error);
      alert("파일 처리 중 오류가 발생했습니다. 파일 형식을 확인해주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag Event: 브라우저 기본 동작(파일 열기) 방지
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); 
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);


  /**
   * 통합 데이터 엑셀 다운로드 (SheetJS 활용)
   * JSON -> AOA(Array of Arrays) 변환 후 시트 생성
   */
  const handleDownload = () => {
    if (masterData.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    // Header 순서에 맞춰 데이터 매핑
    const excelData = masterData.map(order => [
      order.receiver,
      order.contact,
      order.postCode,
      order.address,
      order.message,
      order.productName,
      order.quantity,
      order.courier,
      order.trackingNumber || ''
    ]);

    const finalData = [MASTER_HEADERS, ...excelData];

    // Worksheet 생성 및 스타일 설정(Column Width)
    const ws = XLSX.utils.aoa_to_sheet(finalData);
    ws['!cols'] = [
      { wch: 10 }, // 수령인
      { wch: 15 }, // 연락처
      { wch: 8 },  // 우편번호
      { wch: 40 }, // 주소
      { wch: 20 }, // 메시지
      { wch: 25 }, // 옵션
      { wch: 5 },  // 수량
      { wch: 10 }, // 택배사
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "발주통합");

    // Binary 생성 및 파일 저장
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    saveAs(data, `스윕농장_통합발주서_${dateStr}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-600 cursor-pointer" onClick={() => window.location.reload()}>
            <FileSpreadsheet className="w-7 h-7" />
            <h1 className="text-xl font-bold tracking-tight">스윕농장 발주 통합 시스템</h1>
          </div>
          <div className="flex items-center gap-4">
             {/* Debug Info */}
             <div className="text-xs text-gray-400 font-mono hidden sm:block">
                Files: {files.length} | Rows: {masterData.length}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {/* Upload Section */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-6 h-6 text-orange-500" />
                주문서 업로드
              </h2>
              <p className="text-gray-500 mt-1">
                판매처 엑셀 파일을 여기에 끌어다 놓으세요. (다중 업로드 지원)
              </p>
            </div>
            
            {files.length > 0 && (
              <button 
                onClick={clearAll}
                className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                초기화
              </button>
            )}
          </div>

          {/* Drag & Drop Zone */}
          <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer group
              ${isDragging 
                ? 'border-orange-500 bg-orange-50 scale-[1.01]' 
                : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-orange-300'
              }
            `}
          >
            <input 
              type="file" 
              multiple 
              accept=".xlsx, .xls"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => handleFiles(e.target.files)}
            />
            
            <div className="flex flex-col items-center justify-center pointer-events-none">
              <div className={`w-16 h-16 rounded-full shadow-sm flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-orange-100' : 'bg-white'}`}>
                {isProcessing ? (
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                ) : (
                   <Upload className={`w-8 h-8 ${isDragging ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-500'}`} />
                )}
              </div>
              <p className="text-lg font-medium text-gray-700">
                {isDragging ? "파일을 놓아주세요" : "여기를 클릭하거나 파일을 드래그하세요"}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                지원 형식: .xlsx, .xls
              </p>
            </div>
          </div>

          {/* File List Chips */}
          {files.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              {files.map((file) => (
                <div key={file.id} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  {file.name}
                  <span className="text-xs text-slate-400">({file.rows.length}행)</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Preview Section */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
              통합 결과 미리보기
              {masterData.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2 bg-gray-100 px-2 py-1 rounded-md">
                  Total: {masterData.length}
                </span>
              )}
            </h2>
            <button 
              onClick={handleDownload}
              disabled={masterData.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Download className="w-5 h-5" />
              엑셀 다운로드
            </button>
          </div>

          {/* Data Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            {masterData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <AlertCircle className="w-12 h-12 mb-3 opacity-20" />
                <p>데이터가 존재하지 않습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-medium border-b sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 w-12">No</th>
                      <th className="px-4 py-3">수령인</th>
                      <th className="px-4 py-3">연락처</th>
                      <th className="px-4 py-3 w-64">주소</th>
                      <th className="px-4 py-3">상품명 (옵션)</th>
                      <th className="px-4 py-3 w-16 text-center">수량</th>
                      <th className="px-4 py-3">배송메시지</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {masterData.map((row, index) => (
                      <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{row.receiver}</td>
                        <td className="px-4 py-3">{row.contact}</td>
                        <td className="px-4 py-3 text-gray-600 truncate max-w-xs" title={row.address}>
                          [{row.postCode}] {row.address}
                        </td>
                        <td className="px-4 py-3 text-blue-600 font-medium">
                          {row.productName}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">
                            {row.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 truncate max-w-[200px]" title={row.message}>
                          {row.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;