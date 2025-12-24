// src/App.tsx
import { Upload, FileSpreadsheet, Trash2, Download } from 'lucide-react';
import { useOrderStore } from './store/orderStore';

function App() {
  const { files, masterData, clearAll } = useOrderStore();

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans">
      {/* 1. Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-600">
            <FileSpreadsheet className="w-7 h-7" />
            <h1 className="text-xl font-bold tracking-tight">스윕농장 발주 통합 시스템</h1>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Beta v1.0
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        
        {/* 2. File Upload Section */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-6 h-6 text-orange-500" />
                주문서 업로드
              </h2>
              <p className="text-gray-500 mt-1">각 판매처에서 다운로드한 엑셀 파일을 모두 올려주세요.</p>
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

          {/* Drag & Drop Zone (껍데기) */}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center bg-gray-50/50 hover:bg-orange-50/50 hover:border-orange-300 transition-colors cursor-pointer group">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-gray-400 group-hover:text-orange-500" />
            </div>
            <p className="text-lg font-medium text-gray-700">여기를 클릭하거나 파일을 드래그하세요</p>
            <p className="text-sm text-gray-400 mt-2">지원 형식: .xlsx, .xls</p>
          </div>
          
          {/* 업로드된 파일 목록 표시 (임시) */}
          {files.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {files.map((file) => (
                <div key={file.id} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100">
                  📄 {file.name}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Preview Section */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
              통합 결과 미리보기
            </h2>
            <button 
              disabled={masterData.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Download className="w-5 h-5" />
              엑셀 다운로드
            </button>
          </div>

          <div className="border rounded-lg overflow-hidden bg-white">
            {masterData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <FileSpreadsheet className="w-12 h-12 mb-3 opacity-20" />
                <p>파일을 업로드하면 통합된 결과가 여기에 표시됩니다.</p>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                {/* 나중에 테이블이 들어갈 자리 */}
                데이터가 로드되었습니다. (테이블 구현 예정)
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;