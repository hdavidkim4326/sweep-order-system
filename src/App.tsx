// src/App.tsx
import React, { useCallback, useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, Trash2, Download, AlertCircle, Search, X, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useOrderStore } from './store/orderStore';
import { processExcelFile, convertToMasterData } from './lib/excelHandler';
import { MASTER_HEADERS } from './lib/constants';

function App() {
  const { files, masterData, addFiles, setMasterData, clearAll, removeFile } = useOrderStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 검색 기능능(Ctrl+F 기능)
  const [searchTerm, setSearchTerm] = useState('');

  // 업로드 파일 삭제 시 데이터 재계산 로직
  const handleRemoveFile = (fileId: string) => {
    removeFile(fileId); // 스토어에서 파일 삭제
    const remainingFiles = useOrderStore.getState().files.filter(f => f.id !== fileId);
    const newMasterData = convertToMasterData(remainingFiles);
    setMasterData(newMasterData);
  };

  // 개별 원본 파일 다운로드 (열기)
  const handleDownloadRaw = (file: any) => {
    const ws = XLSX.utils.json_to_sheet(file.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Original");
    XLSX.writeFile(wb, `원본_${file.name}`);
  };
  

  /**
     * 파일 처리 핸들러
     * 다중 파일 병렬 파싱(Promise.all) 후 Global State 업데이트
     */
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);

    try {
      const targetFiles = Array.from(fileList);
      
      // 파일 파싱 (병렬 처리)
      const uploadedFiles = await Promise.all(
        targetFiles.map(async (file) => await processExcelFile(file))
      );

      // 중복 파일 감지 로직
      const currentFiles = useOrderStore.getState().files;
      
      const newFiles: typeof uploadedFiles = [];       // 완전히 새로운 파일들
      const duplicateFiles: typeof uploadedFiles = []; // 이미 있는 파일들(이름 기준)

      uploadedFiles.forEach(file => {
        const isDuplicate = currentFiles.some(existing => existing.name === file.name);
        if (isDuplicate) {
          duplicateFiles.push(file);
        } else {
          newFiles.push(file);
        }
      });

      // 중복 파일 처리 여부 묻기
      let finalFilesToAdd = [...newFiles];

      if (duplicateFiles.length > 0) {
        const dupNames = duplicateFiles.map(f => f.name).join('\n');
        
        const userWantsToAdd = window.confirm(
          `다음 파일들은 이미 목록에 존재합니다:\n\n${dupNames}\n\n그래도 중복해서 추가하시겠습니까?`
        );

        if (userWantsToAdd) {
          finalFilesToAdd = [...finalFilesToAdd, ...duplicateFiles];
        }
      }

      // 추가할 파일이 하나도 없으면 종료
      if (finalFilesToAdd.length === 0) {
        setIsProcessing(false);
        return;
      }

      // 최종 데이터 업데이트
      addFiles(finalFilesToAdd);

      // 전체 데이터 재계산 (기존 + 이번에 추가된 파일)
      const allFiles = [...currentFiles, ...finalFilesToAdd]; 
      const newMasterData = convertToMasterData(allFiles);
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

  // 검색 필터링 로직
  const filteredData = masterData.filter((row) => {
    const searchString = searchTerm.toLowerCase();
    return (
      row.receiver.toLowerCase().includes(searchString) ||
      row.productName.toLowerCase().includes(searchString) ||
      row.address.toLowerCase().includes(searchString) ||
      row.contact.includes(searchString)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-600 cursor-pointer" onClick={() => window.location.reload()}>
            <FileSpreadsheet className="w-7 h-7" />
            <h1 className="text-xl font-bold tracking-tight">스윕농장 발주 통합 시스템</h1>
          </div>
          <div className="text-xs text-gray-400 font-mono hidden sm:block">
             Files: {files.length} | Rows: {masterData.length}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        
        {/* 1. 업로드 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 드래그 앤 드롭 */}
          <section className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
             <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-orange-500" /> 주문서 업로드
             </h2>
             <div 
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              className={`relative border-2 border-dashed rounded-lg h-40 flex flex-col items-center justify-center text-center transition-all cursor-pointer group
                ${isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-orange-300'}`}
            >
              <input // 파일 업로드 같은 값 두번 가능하게 하기 위해 값 초기화 추가 + 수정 가독성 위해서 줄바꿈
                type="file"
                multiple
                accept=".xlsx, .xls"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = '';
                }}
              />

              <Upload className={`w-8 h-8 mb-2 ${isDragging ? 'text-orange-600' : 'text-gray-400'}`} />
              <p className="text-sm font-medium text-gray-600">클릭 또는 드래그하여 파일 업로드</p>
            </div>
          </section>

          {/* 오른쪽: 파일 목록 관리 (Feature 1: 개별 삭제/열기) */}
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">파일 목록</h2>
              {files.length > 0 && (
                <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> 전체 삭제
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-40 space-y-2">
              {files.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">업로드된 파일이 없습니다.</p>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="group flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 text-sm hover:border-orange-200 transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden cursor-pointer" onClick={() => handleDownloadRaw(file)} title="클릭하여 원본 다운로드">
                      <FileSpreadsheet className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="truncate text-slate-700 font-medium">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                       <span className="text-xs text-gray-400 mr-2">{file.rows.length}행</span>
                       <button onClick={() => handleRemoveFile(file.id)} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50">
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* 2. 미리보기 섹션 (Feature 2 & 3: 엑셀 스타일 + 검색) */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[500px]">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900">통합 결과</h2>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-mono">
                {filteredData.length} Rows
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* 검색창 */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="수령인, 주소, 상품명 검색..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>

              <button 
                onClick={handleDownload}
                disabled={masterData.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                엑셀 다운로드
              </button>
            </div>
          </div>

          {/* 엑셀 스타일 테이블 Grid */}
          <div className="flex-1 overflow-auto bg-gray-50 relative">
            {masterData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <FileSpreadsheet className="w-16 h-16 mb-4 opacity-20" />
                <p>파일을 업로드하면 통합된 결과가 여기에 표시됩니다.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left border-collapse bg-white">
                <thead className="bg-gray-100 text-gray-600 font-medium sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-3 py-2 border border-gray-300 w-12 text-center bg-gray-100">No</th>
                    {MASTER_HEADERS.map((header) => (
                      <th key={header} className="px-3 py-2 border border-gray-300 whitespace-nowrap min-w-[100px]">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                     <tr>
                        <td colSpan={10} className="p-10 text-center text-gray-400">
                           검색 결과가 없습니다.
                        </td>
                     </tr>
                  ) : (
                    filteredData.map((row, index) => (
                      <tr key={row.id} className="hover:bg-blue-50 transition-colors group">
                        <td className="px-3 py-1.5 border border-gray-200 text-center text-gray-400 bg-gray-50">{index + 1}</td>
                        <td className="px-3 py-1.5 border border-gray-200 text-gray-900">{row.receiver}</td>
                        <td className="px-3 py-1.5 border border-gray-200">{row.contact}</td>
                        <td className="px-3 py-1.5 border border-gray-200">{row.postCode}</td>
                        <td className="px-3 py-1.5 border border-gray-200 max-w-[300px] truncate" title={row.address}>
                          {row.address}
                        </td>
                        <td className="px-3 py-1.5 border border-gray-200 max-w-[200px] truncate text-gray-500" title={row.message}>
                          {row.message}
                        </td>
                        <td className="px-3 py-1.5 border border-gray-200 font-medium text-blue-600 bg-blue-50/30">
                          {row.productName}
                        </td>
                        <td className="px-3 py-1.5 border border-gray-200 text-center font-bold bg-gray-50">
                          {row.quantity}
                        </td>
                        <td className="px-3 py-1.5 border border-gray-200 text-center text-gray-500 text-xs">
                          {row.courier}
                        </td>
                        <td className="px-3 py-1.5 border border-gray-200 text-xs">
                          {row.trackingNumber}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;