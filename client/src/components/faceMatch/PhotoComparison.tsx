import React, { useState, useRef } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Table } from '../ui/Table';
import { StatusBadge } from '../ui/StatusBadge';

interface ComparisonResult {
  similarity: number;
  isMatch: boolean;
  confidence: number;
  targetPersonId?: string;
  sourceFileName?: string;
}

interface BatchComparisonResult {
  targetPersonId: string;
  sourceFileName: string;
  similarity: number;
  isMatch: boolean;
  confidence: number;
}

export const PhotoComparison: React.FC = () => {
  const [targetPersonId, setTargetPersonId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 批次比對狀態
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetPersonIds, setTargetPersonIds] = useState<string[]>(['']);
  const [batchResults, setBatchResults] = useState<BatchComparisonResult[]>([]);
  const [showBatchMode, setShowBatchMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 檢查檔案類型
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        alert('只允許上傳 JPEG、JPG、PNG 格式的圖片');
        return;
      }
      // 檢查檔案大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('檔案大小不能超過 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleBatchFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 10) {
      alert('一次最多只能上傳 10 張照片');
      return;
    }
    
    const validFiles = files.filter(file => {
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        return false;
      }
      return true;
    });

    if (validFiles.length !== files.length) {
      alert('部分檔案格式不正確或大小超過限制，已過濾');
    }

    setSelectedFiles(validFiles);
    setTargetPersonIds(new Array(validFiles.length).fill(''));
  };

  const handleCompare = async () => {
    if (!targetPersonId || !selectedFile) {
      alert('請選擇目標人員 ID 和比對照片');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const response = await fetch(`/api/face-match/compare/${targetPersonId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setComparisonResult({
          ...data.data,
          targetPersonId,
          sourceFileName: selectedFile.name,
        });
      } else {
        const error = await response.json();
        alert(`比對失敗: ${error.message}`);
      }
    } catch (error) {
      alert('比對失敗: 網路錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchCompare = async () => {
    if (selectedFiles.length === 0 || targetPersonIds.some(id => !id)) {
      alert('請確保所有照片都對應一個目標人員 ID');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append('photos', file);
      });
      formData.append('targetPersonIds', JSON.stringify(targetPersonIds));

      const response = await fetch('/api/face-match/compare/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.data.map((result: any, index: number) => ({
          ...result,
          targetPersonId: targetPersonIds[index],
          sourceFileName: selectedFiles[index].name,
        }));
        setBatchResults(results);
      } else {
        const error = await response.json();
        alert(`批次比對失敗: ${error.message}`);
      }
    } catch (error) {
      alert('批次比對失敗: 網路錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const getMatchStatusVariant = (isMatch: boolean): 'success' | 'danger' => {
    return isMatch ? 'success' : 'danger';
  };

  const getSimilarityColor = (similarity: number): string => {
    if (similarity >= 0.9) return 'text-green-600';
    if (similarity >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const columns = [
    {
      key: 'sourceFileName',
      title: '來源照片',
      render: (value: string) => (
        <span className="text-sm font-medium">{value}</span>
      )
    },
    {
      key: 'targetPersonId',
      title: '目標人員 ID',
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'similarity',
      title: '相似度',
      render: (value: number) => (
        <span className={`font-semibold ${getSimilarityColor(value)}`}>
          {formatPercentage(value)}
        </span>
      )
    },
    {
      key: 'confidence',
      title: '信心度',
      render: (value: number) => (
        <span className="text-sm">{formatPercentage(value)}</span>
      )
    },
    {
      key: 'isMatch',
      title: '比對結果',
      render: (value: boolean) => (
        <StatusBadge variant={getMatchStatusVariant(value)} size="sm">
          {value ? '匹配' : '不匹配'}
        </StatusBadge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* 模式切換 */}
      <Card>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">照片比對</h2>
          <div className="flex space-x-2">
            <Button
              variant={!showBatchMode ? 'primary' : 'secondary'}
              onClick={() => setShowBatchMode(false)}
            >
              單張比對
            </Button>
            <Button
              variant={showBatchMode ? 'primary' : 'secondary'}
              onClick={() => setShowBatchMode(true)}
            >
              批次比對
            </Button>
          </div>
        </div>
      </Card>

      {!showBatchMode ? (
        // 單張比對模式
        <>
          <Card>
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">單張照片比對</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目標人員 ID
                  </label>
                  <Input
                    type="text"
                    value={targetPersonId}
                    onChange={(e) => setTargetPersonId(e.target.value)}
                    placeholder="請輸入目標人員 ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    選擇比對照片
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileSelect}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              {selectedFile && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700">
                    已選擇: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleCompare}
                  disabled={isLoading || !targetPersonId || !selectedFile}
                >
                  {isLoading ? '比對中...' : '開始比對'}
                </Button>
              </div>
            </div>
          </Card>

          {/* 比對結果 */}
          {comparisonResult && (
            <Card>
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900">比對結果</h3>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className={`text-3xl font-bold ${getSimilarityColor(comparisonResult.similarity)}`}>
                        {formatPercentage(comparisonResult.similarity)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">相似度</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">
                        {formatPercentage(comparisonResult.confidence)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">信心度</p>
                    </div>
                    <div className="text-center">
                      <StatusBadge 
                        variant={getMatchStatusVariant(comparisonResult.isMatch)}
                        size="lg"
                      >
                        {comparisonResult.isMatch ? '匹配成功' : '不匹配'}
                      </StatusBadge>
                      <p className="text-sm text-gray-500 mt-1">比對結果</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">來源照片:</span>
                        <span className="ml-2 font-medium">{comparisonResult.sourceFileName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">目標人員:</span>
                        <span className="ml-2 font-mono">{comparisonResult.targetPersonId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      ) : (
        // 批次比對模式
        <>
          <Card>
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">批次照片比對</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選擇比對照片
                </label>
                <input
                  ref={batchFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  multiple
                  onChange={handleBatchFileSelect}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  最多選擇 10 張照片，支援 JPEG、JPG、PNG 格式
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">照片與目標人員 ID 對應</h4>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-md">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div className="w-32">
                        <Input
                          type="text"
                          value={targetPersonIds[index]}
                          onChange={(e) => {
                            const newTargetPersonIds = [...targetPersonIds];
                            newTargetPersonIds[index] = e.target.value;
                            setTargetPersonIds(newTargetPersonIds);
                          }}
                          placeholder="目標人員 ID"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleBatchCompare}
                  disabled={isLoading || selectedFiles.length === 0 || targetPersonIds.some(id => !id)}
                >
                  {isLoading ? '批次比對中...' : '開始批次比對'}
                </Button>
              </div>
            </div>
          </Card>

          {/* 批次比對結果 */}
          {batchResults.length > 0 && (
            <Card>
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900">批次比對結果</h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-gray-900">
                        {batchResults.length}
                      </p>
                      <p className="text-sm text-gray-500">總比對數</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-green-600">
                        {batchResults.filter(r => r.isMatch).length}
                      </p>
                      <p className="text-sm text-gray-500">匹配成功</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-red-600">
                        {batchResults.filter(r => !r.isMatch).length}
                      </p>
                      <p className="text-sm text-gray-500">不匹配</p>
                    </div>
                  </div>
                </div>

                <Table
                  columns={columns}
                  data={batchResults}
                  loading={false}
                />
              </div>
            </Card>
          )}
        </>
      )}

      {/* 操作說明 */}
      <Card>
        <div className="space-y-2">
          <h3 className="text-md font-medium text-gray-900">操作說明</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 支援 JPEG、JPG、PNG 格式的圖片檔案</li>
            <li>• 單檔大小不超過 5MB</li>
            <li>• 相似度越高表示兩張照片越相似</li>
            <li>• 信心度表示系統對比對結果的確信程度</li>
            <li>• 批次模式一次最多支援 10 張照片比對</li>
            <li>• 建議使用清晰的正面照片以獲得最佳比對效果</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};