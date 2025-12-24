import React, { useState } from 'react';
import { X, Plus, Trash2, RotateCcw, Settings, HelpCircle } from 'lucide-react';
import { useOrderStore } from '../store/orderStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { 
    headerMappings, productRules, 
    addHeaderKeyword, removeHeaderKeyword, 
    addProductRule, removeProductRule, resetSettings 
  } = useOrderStore();

  const [activeTab, setActiveTab] = useState<'header' | 'product'>('header');
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedHeaderKey, setSelectedHeaderKey] = useState('receiver');

  const [newProductKey, setNewProductKey] = useState('');
  const [newProductValue, setNewProductValue] = useState('');

  if (!isOpen) return null;

  const headerNameMap: Record<string, string> = {
    receiver: '수령인', contact: '연락처', postCode: '우편번호', 
    address: '주소', message: '배송메시지', productName: '상품명', quantity: '수량'
  };

  const handleAddHeader = () => {
    if (newKeyword.trim()) {
      addHeaderKeyword(selectedHeaderKey, newKeyword.trim());
      setNewKeyword('');
    }
  };

  const handleAddProduct = () => {
    if (newProductKey.trim() && newProductValue.trim()) {
      addProductRule(newProductKey.trim(), newProductValue.trim());
      setNewProductKey('');
      setNewProductValue('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shadow-md z-10">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Settings className="w-5 h-5" /> 매핑 설정 관리자
          </h3>
          <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          <button 
            className={`flex-1 py-3 font-bold text-sm transition-all ${
              activeTab === 'header' 
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('header')}
          >
            헤더(컬럼) 매핑
          </button>
          <button 
            className={`flex-1 py-3 font-bold text-sm transition-all ${
              activeTab === 'product' 
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('product')}
          >
            상품명 변환 규칙
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
          {activeTab === 'header' ? (
            <div className="space-y-6">
              
              {/* 입력 폼 */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 overflow-visible">
                <div className="flex items-center gap-2 mb-3 relative">
                   <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span>
                    새 키워드 추가
                   </h4>
                   
                   {/* 툴팁 추가 */}
                   <div className="group relative">
                     <HelpCircle className="w-4 h-4 text-gray-400 cursor-help hover:text-orange-500 transition-colors" />
                     <div className="absolute left-0 top-full mt-2 w-96 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        <p className="leading-relaxed">
                            <span className="font-semibold text-orange-300">사용 팁: </span>
                            엑셀 파일의 열 이름이 자동으로 인식되지 않을 때 사용하세요.<br />
                            예) 새로운 거래처 파일에 
                            "<span className="underline">수취인 핸드폰</span>"이라는 열이 있다면<br />
                            왼쪽 목록에서 <b>[연락처]</b>를 선택한 뒤,
                            <b>“수취인 핸드폰”</b>을 입력해 매핑을 추가할 수 있습니다.
                        </p>
                        <div className="absolute left-1 -top-1 w-2 h-2 bg-slate-800 rotate-45"></div>
                     </div>
                   </div>
                </div>

                <div className="flex gap-2">
                  <select 
                    value={selectedHeaderKey} 
                    onChange={(e) => setSelectedHeaderKey(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
                  >
                    {Object.keys(headerMappings).map(key => (
                      <option key={key} value={key}>{headerNameMap[key] || key}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    placeholder="추가할 엑셀 헤더명 (예: 수취인번호)" 
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHeader()}
                  />
                  <button 
                    onClick={handleAddHeader} 
                    className="bg-orange-600 text-white px-4 rounded-lg hover:bg-orange-700 transition-colors shadow-sm font-medium"
                  >
                    <Plus className="w-5 h-5"/>
                  </button>
                </div>
              </div>

              {/* 목록 표시 */}
              <div className="grid gap-4">
                {Object.entries(headerMappings).map(([key, keywords]) => (
                  <div key={key} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h5 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                      {headerNameMap[key]} 
                      <span className="text-gray-400 font-normal text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                        {key}
                      </span>
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map(word => (
                        <span key={word} className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-md text-xs font-medium flex items-center gap-2 group hover:border-orange-200 transition-colors">
                          {word}
                          <button 
                            onClick={() => removeHeaderKeyword(key, word)} 
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3"/>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
               
               {/* 상품명 규칙 입력 폼 */}
               <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 overflow-visible">
                <div className="flex items-center gap-2 mb-3 relative">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-green-500 rounded-full"></span>
                    상품 변환 규칙 추가
                  </h4>

                  {/* 툴팁 추가 */}
                  <div className="group relative">
                     <HelpCircle className="w-4 h-4 text-gray-400 cursor-help hover:text-green-500 transition-colors" />
                     <div className="absolute left-0 top-full mt-2 w-80 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        <p className="leading-relaxed">
                          <span className="font-bold text-green-300">사용 팁:</span> 상품명이 제대로 변환되지 않나요? <br></br>여기서 변환 규칙을 추가하세요.<br/>
                          예: "<span className="underline">구운</span>"을 입력하면, "구운란 30구", "구운 계란" 등 모든 상품이 <span className="font-bold">"구운란 30구"</span>로 자동 변환됩니다.
                        </p>
                        <div className="absolute left-1 -top-1 w-2 h-2 bg-slate-800 rotate-45"></div>
                     </div>
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    placeholder="포함된 단어 (예: 구운)" 
                    value={newProductKey}
                    onChange={(e) => setNewProductKey(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="변환될 표준 상품명 (예: 구운란 30구)" 
                      value={newProductValue}
                      onChange={(e) => setNewProductValue(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddProduct()}
                    />
                    <button 
                      onClick={handleAddProduct} 
                      className="bg-green-600 text-white px-4 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                      <Plus className="w-5 h-5"/>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">포함 단어</th>
                      <th className="px-4 py-3">표준 상품명</th>
                      <th className="px-4 py-3 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(productRules).map(([key, value]) => (
                      <tr key={key} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-700">{key}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{value}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => removeProductRule(key)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50">
                            <Trash2 className="w-4 h-4 inline"/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-between items-center z-10">
          <button 
            onClick={resetSettings} 
            className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 설정 초기화
          </button>
          <button 
            onClick={onClose} 
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};