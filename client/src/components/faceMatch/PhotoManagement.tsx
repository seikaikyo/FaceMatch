import React, { useState, useRef } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Table } from '../ui/Table';

interface PersonPhoto {
  id: string;
  personId: string;
  personName: string;
  filename: string;
  uploadedAt: string;
  fileSize: number;
  thumbnail?: string;
}

export const PhotoManagement: React.FC = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBatchUploadModal, setShowBatchUploadModal] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [personIds, setPersonIds] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [photos] = useState<PersonPhoto[]>([
    {
      id: '1',
      personId: 'P001',
      personName: '張三',
      filename: 'zhang_san_001.jpg',
      uploadedAt: '2024-01-15 10:30:00',
      fileSize: 245760,
    },
    {
      id: '2',
      personId: 'P002',
      personName: '李四',
      filename: 'li_si_001.jpg',
      uploadedAt: '2024-01-15 14:20:00',
      fileSize: 189440,
    },
  ]);

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
    // 初始化人員 ID 陣列
    setPersonIds(new Array(validFiles.length).fill(''));
  };

  const handleUpload = async () => {
    if (!selectedPersonId || !selectedFile) {
      alert('請選擇人員 ID 和照片檔案');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const response = await fetch(`/api/face-match/photos/${selectedPersonId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert('照片上傳成功');
        setShowUploadModal(false);
        setSelectedPersonId('');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // TODO: 重新載入照片列表
      } else {
        const error = await response.json();
        alert(`上傳失敗: ${error.message}`);
      }
    } catch (error) {
      alert('上傳失敗: 網路錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchUpload = async () => {
    if (selectedFiles.length === 0 || personIds.some(id => !id)) {
      alert('請確保所有照片都對應一個人員 ID');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append('photos', file);
      });
      formData.append('personIds', JSON.stringify(personIds));

      const response = await fetch('/api/face-match/photos/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert('批次上傳成功');
        setShowBatchUploadModal(false);
        setSelectedFiles([]);
        setPersonIds(['']);
        if (batchFileInputRef.current) {
          batchFileInputRef.current.value = '';
        }
        // TODO: 重新載入照片列表
      } else {
        const error = await response.json();
        alert(`批次上傳失敗: ${error.message}`);
      }
    } catch (error) {
      alert('批次上傳失敗: 網路錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm('確定要刪除這張照片嗎？')) {
      return;
    }

    try {
      const response = await fetch(`/api/face-match/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        alert('照片刪除成功');
        // TODO: 重新載入照片列表
      } else {
        const error = await response.json();
        alert(`刪除失敗: ${error.message}`);
      }
    } catch (error) {
      alert('刪除失敗: 網路錯誤');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const columns = [
    {
      key: 'personId',
      title: '人員 ID',
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'personName',
      title: '姓名',
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'filename',
      title: '檔案名稱',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value}</span>
      )
    },
    {
      key: 'fileSize',
      title: '檔案大小',
      render: (value: number) => (
        <span className="text-sm">{formatFileSize(value)}</span>
      )
    },
    {
      key: 'uploadedAt',
      title: '上傳時間',
      render: (value: string) => (
        <span className="text-sm text-gray-500">{value}</span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: PersonPhoto) => (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={() => {
              // TODO: 預覽照片
              alert('預覽功能開發中');
            }}
          >
            預覽
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDeletePhoto(record.id)}
          >
            刪除
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* 操作按鈕 */}
      <Card>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">照片管理</h2>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowUploadModal(true)}
            >
              上傳照片
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowBatchUploadModal(true)}
            >
              批次上傳
            </Button>
          </div>
        </div>
      </Card>

      {/* 照片列表 */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">照片列表</h3>
          <Table
            columns={columns}
            data={photos}
            loading={false}
          />
        </div>
      </Card>

      {/* 單張上傳模態框 */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="上傳人員照片"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              人員 ID
            </label>
            <Input
              type="text"
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              placeholder="請輸入人員 ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇照片
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileSelect}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              支援 JPEG、JPG、PNG 格式，檔案大小不超過 5MB
            </p>
          </div>

          {selectedFile && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-700">
                已選擇: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowUploadModal(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={isLoading || !selectedPersonId || !selectedFile}
            >
              {isLoading ? '上傳中...' : '上傳'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 批次上傳模態框 */}
      <Modal
        isOpen={showBatchUploadModal}
        onClose={() => setShowBatchUploadModal(false)}
        title="批次上傳照片"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇照片
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
              最多選擇 10 張照片，支援 JPEG、JPG、PNG 格式，單檔不超過 5MB
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">照片與人員 ID 對應</h4>
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-md">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <div className="w-32">
                    <Input
                      type="text"
                      value={personIds[index]}
                      onChange={(e) => {
                        const newPersonIds = [...personIds];
                        newPersonIds[index] = e.target.value;
                        setPersonIds(newPersonIds);
                      }}
                      placeholder="人員 ID"
                              />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowBatchUploadModal(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleBatchUpload}
              disabled={isLoading || selectedFiles.length === 0 || personIds.some(id => !id)}
            >
              {isLoading ? '上傳中...' : '批次上傳'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};