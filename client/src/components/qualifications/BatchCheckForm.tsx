import React, { useState } from 'react';
import { ContractorPerson } from '../../types';
import { BatchCheckRequest, BatchCheckResponse } from '../../services/qualifications';
import { Button, Input, Card } from '../ui';

interface BatchCheckFormProps {
  persons: ContractorPerson[];
  onSubmit: (data: BatchCheckRequest) => Promise<void>;
  result: BatchCheckResponse | null;
  loading?: boolean;
}

const BatchCheckForm: React.FC<BatchCheckFormProps> = ({
  persons,
  onSubmit,
  result,
  loading = false
}) => {
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [qualificationType, setQualificationType] = useState<string>('');

  const handlePersonToggle = (personId: string) => {
    setSelectedPersons(prev => 
      prev.includes(personId) 
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPersons.length === persons.length) {
      setSelectedPersons([]);
    } else {
      setSelectedPersons(persons.map(p => p._id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPersons.length === 0) return;

    onSubmit({
      personIds: selectedPersons,
      qualificationType: qualificationType || undefined
    });
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? 'text-green-600' : 'text-red-600';
  };

  const getStatusText = (isValid: boolean) => {
    return isValid ? '有效' : '無效/過期';
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-medium mb-4">批次資格檢核</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇檢核人員
            </label>
            <div className="mb-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedPersons.length === persons.length ? '取消全選' : '全選'}
              </Button>
              <span className="ml-2 text-sm text-gray-600">
                已選擇 {selectedPersons.length} / {persons.length} 人
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              {persons.map((person) => (
                <div key={person._id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`person-${person._id}`}
                    checked={selectedPersons.includes(person._id)}
                    onChange={() => handlePersonToggle(person._id)}
                    className="mr-2"
                  />
                  <label htmlFor={`person-${person._id}`} className="text-sm">
                    {person.name} ({person.employeeId})
                    {person.contractor && ` - ${person.contractor.name}`}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              指定資格類型 (可選)
            </label>
            <select
              value={qualificationType}
              onChange={(e) => setQualificationType(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">所有資格類型</option>
              <option value="SAFETY">安全資格</option>
              <option value="TECHNICAL">技術資格</option>
              <option value="MANAGEMENT">管理資格</option>
              <option value="ENVIRONMENTAL">環境資格</option>
              <option value="QUALITY">品質資格</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="submit"
              disabled={selectedPersons.length === 0 || loading}
            >
              {loading ? '檢核中...' : '開始檢核'}
            </Button>
          </div>
        </form>
      </Card>

      {result && (
        <Card>
          <h3 className="text-lg font-medium mb-4">檢核結果</h3>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{result.summary.valid}</div>
              <div className="text-sm text-gray-600">資格有效</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{result.summary.expiringSoon}</div>
              <div className="text-sm text-gray-600">即將到期</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{result.summary.expired}</div>
              <div className="text-sm text-gray-600">資格過期</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{result.summary.notFound}</div>
              <div className="text-sm text-gray-600">無資格記錄</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">人員</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">員工編號</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有效資格數</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">過期資格數</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">資格詳情</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {result.results.map((item) => (
                  <tr key={item.personId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.personInfo?.name || '未知'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.personInfo?.employeeId || '未知'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="text-green-600 font-medium">
                        {item.validQualifications}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="text-red-600 font-medium">
                        {item.expiredQualifications}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {item.qualificationDetails.map((qual, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{qual.type}</span>
                            <span className={`ml-2 ${getStatusColor(qual.isValid)}`}>
                              ({getStatusText(qual.isValid)})
                            </span>
                            {qual.isValid && qual.daysRemaining <= 30 && (
                              <span className="ml-2 text-orange-600">
                                ({qual.daysRemaining}天後到期)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            檢核日期: {new Date(result.checkDate).toLocaleDateString('zh-TW')}
          </div>
        </Card>
      )}
    </div>
  );
};

export default BatchCheckForm;