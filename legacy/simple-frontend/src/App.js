import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5001/api';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('contractors');
  
  // 登入組件
  const LoginForm = () => {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin123');
    
    const handleLogin = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        } else {
          alert('登入失敗');
        }
      } catch (error) {
        alert('登入錯誤: ' + error.message);
      }
    };
    
    return (
      <div className="login-form">
        <h2>FaceMatch 管理系統</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>使用者名稱</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>密碼</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary">登入</button>
        </form>
      </div>
    );
  };
  
  // 承攬商管理
  const ContractorsTab = () => {
    const [contractors, setContractors] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
      name: '', code: '', contact: '', phone: '', status: 'ACTIVE'
    });
    
    useEffect(() => {
      fetchContractors();
    }, []);
    
    const fetchContractors = async () => {
      try {
        const response = await fetch(`${API_BASE}/contractors`);
        const data = await response.json();
        if (data.success) setContractors(data.data);
      } catch (error) {
        console.error('獲取承攬商失敗:', error);
      }
    };
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const url = editingId ? `${API_BASE}/contractors/${editingId}` : `${API_BASE}/contractors`;
        const method = editingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
          fetchContractors();
          setShowForm(false);
          setEditingId(null);
          setFormData({ name: '', code: '', contact: '', phone: '', status: 'ACTIVE' });
        }
      } catch (error) {
        alert('操作失敗: ' + error.message);
      }
    };
    
    const handleEdit = (contractor) => {
      setFormData(contractor);
      setEditingId(contractor.id);
      setShowForm(true);
    };
    
    const handleDelete = async (id) => {
      if (!window.confirm('確定要刪除嗎？')) return;
      try {
        const response = await fetch(`${API_BASE}/contractors/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) fetchContractors();
      } catch (error) {
        alert('刪除失敗: ' + error.message);
      }
    };
    
    return (
      <div>
        <div className="flex">
          <h2>承攬商管理</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '取消' : '新增承攬商'}
          </button>
        </div>
        
        {showForm && (
          <div className="card">
            <h3>{editingId ? '編輯承攬商' : '新增承攬商'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>公司名稱</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>公司代碼</label>
                <input 
                  type="text" 
                  value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>聯絡人</label>
                <input 
                  type="text" 
                  value={formData.contact} 
                  onChange={(e) => setFormData({...formData, contact: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>聯絡電話</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>狀態</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="ACTIVE">啟用</option>
                  <option value="INACTIVE">停用</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success">
                {editingId ? '更新' : '新增'}
              </button>
            </form>
          </div>
        )}
        
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>公司名稱</th>
                <th>代碼</th>
                <th>聯絡人</th>
                <th>電話</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map(contractor => (
                <tr key={contractor.id}>
                  <td>{contractor.name}</td>
                  <td>{contractor.code}</td>
                  <td>{contractor.contact}</td>
                  <td>{contractor.phone}</td>
                  <td>
                    <span className={`status-badge status-${contractor.status.toLowerCase()}`}>
                      {contractor.status === 'ACTIVE' ? '啟用' : '停用'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-primary" onClick={() => handleEdit(contractor)}>
                      編輯
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(contractor.id)}>
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // 施工單管理
  const WorkOrdersTab = () => {
    const [workOrders, setWorkOrders] = useState([]);
    const [contractors, setContractors] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
      orderNumber: '', title: '', contractorId: '', location: '', status: 'PENDING'
    });
    
    useEffect(() => {
      fetchWorkOrders();
      fetchContractors();
    }, []);
    
    const fetchWorkOrders = async () => {
      try {
        const response = await fetch(`${API_BASE}/work-orders`);
        const data = await response.json();
        if (data.success) setWorkOrders(data.data);
      } catch (error) {
        console.error('獲取施工單失敗:', error);
      }
    };
    
    const fetchContractors = async () => {
      try {
        const response = await fetch(`${API_BASE}/contractors`);
        const data = await response.json();
        if (data.success) setContractors(data.data);
      } catch (error) {
        console.error('獲取承攬商失敗:', error);
      }
    };
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const url = editingId ? `${API_BASE}/work-orders/${editingId}` : `${API_BASE}/work-orders`;
        const method = editingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({...formData, contractorId: parseInt(formData.contractorId)})
        });
        
        const data = await response.json();
        if (data.success) {
          fetchWorkOrders();
          setShowForm(false);
          setEditingId(null);
          setFormData({ orderNumber: '', title: '', contractorId: '', location: '', status: 'PENDING' });
        }
      } catch (error) {
        alert('操作失敗: ' + error.message);
      }
    };
    
    const handleEdit = (workOrder) => {
      setFormData(workOrder);
      setEditingId(workOrder.id);
      setShowForm(true);
    };
    
    const handleDelete = async (id) => {
      if (!window.confirm('確定要刪除嗎？')) return;
      try {
        const response = await fetch(`${API_BASE}/work-orders/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) fetchWorkOrders();
      } catch (error) {
        alert('刪除失敗: ' + error.message);
      }
    };
    
    return (
      <div>
        <div className="flex">
          <h2>施工單管理</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '取消' : '新增施工單'}
          </button>
        </div>
        
        {showForm && (
          <div className="card">
            <h3>{editingId ? '編輯施工單' : '新增施工單'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>施工單號</label>
                <input 
                  type="text" 
                  value={formData.orderNumber} 
                  onChange={(e) => setFormData({...formData, orderNumber: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>工程標題</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>承攬商</label>
                <select 
                  value={formData.contractorId} 
                  onChange={(e) => setFormData({...formData, contractorId: e.target.value})}
                  required
                >
                  <option value="">請選擇承攬商</option>
                  {contractors.map(contractor => (
                    <option key={contractor.id} value={contractor.id}>
                      {contractor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>施工地點</label>
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={(e) => setFormData({...formData, location: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>狀態</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="PENDING">待審核</option>
                  <option value="APPROVED">已核准</option>
                  <option value="COMPLETED">已完成</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success">
                {editingId ? '更新' : '新增'}
              </button>
            </form>
          </div>
        )}
        
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>施工單號</th>
                <th>工程標題</th>
                <th>承攬商</th>
                <th>施工地點</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{order.title}</td>
                  <td>{order.contractorName}</td>
                  <td>{order.location}</td>
                  <td>
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                      {order.status === 'PENDING' ? '待審核' : 
                       order.status === 'APPROVED' ? '已核准' : '已完成'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-primary" onClick={() => handleEdit(order)}>
                      編輯
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(order.id)}>
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // 年度資格管理
  const QualificationsTab = () => {
    const [qualifications, setQualifications] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
      personName: '', type: 'SAFETY', name: '', validTo: '', status: 'VALID'
    });
    
    useEffect(() => {
      fetchQualifications();
    }, []);
    
    const fetchQualifications = async () => {
      try {
        const response = await fetch(`${API_BASE}/qualifications`);
        const data = await response.json();
        if (data.success) setQualifications(data.data);
      } catch (error) {
        console.error('獲取資格失敗:', error);
      }
    };
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const url = editingId ? `${API_BASE}/qualifications/${editingId}` : `${API_BASE}/qualifications`;
        const method = editingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
          fetchQualifications();
          setShowForm(false);
          setEditingId(null);
          setFormData({ personName: '', type: 'SAFETY', name: '', validTo: '', status: 'VALID' });
        }
      } catch (error) {
        alert('操作失敗: ' + error.message);
      }
    };
    
    const handleEdit = (qualification) => {
      setFormData(qualification);
      setEditingId(qualification.id);
      setShowForm(true);
    };
    
    const handleDelete = async (id) => {
      if (!window.confirm('確定要刪除嗎？')) return;
      try {
        const response = await fetch(`${API_BASE}/qualifications/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) fetchQualifications();
      } catch (error) {
        alert('刪除失敗: ' + error.message);
      }
    };
    
    return (
      <div>
        <div className="flex">
          <h2>年度資格管理</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '取消' : '新增資格'}
          </button>
        </div>
        
        {showForm && (
          <div className="card">
            <h3>{editingId ? '編輯資格' : '新增資格'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>人員姓名</label>
                <input 
                  type="text" 
                  value={formData.personName} 
                  onChange={(e) => setFormData({...formData, personName: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>資格類型</label>
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="SAFETY">安全資格</option>
                  <option value="TECHNICAL">技術資格</option>
                  <option value="MANAGEMENT">管理資格</option>
                </select>
              </div>
              <div className="form-group">
                <label>資格名稱</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>有效期限</label>
                <input 
                  type="date" 
                  value={formData.validTo} 
                  onChange={(e) => setFormData({...formData, validTo: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>狀態</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="VALID">有效</option>
                  <option value="EXPIRES_SOON">即將到期</option>
                  <option value="EXPIRED">已過期</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success">
                {editingId ? '更新' : '新增'}
              </button>
            </form>
          </div>
        )}
        
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>人員姓名</th>
                <th>資格類型</th>
                <th>資格名稱</th>
                <th>有效期限</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {qualifications.map(qualification => (
                <tr key={qualification.id}>
                  <td>{qualification.personName}</td>
                  <td>{qualification.type === 'SAFETY' ? '安全資格' : 
                       qualification.type === 'TECHNICAL' ? '技術資格' : '管理資格'}</td>
                  <td>{qualification.name}</td>
                  <td>{qualification.validTo}</td>
                  <td>
                    <span className={`status-badge status-${qualification.status.toLowerCase().replace('_', '-')}`}>
                      {qualification.status === 'VALID' ? '有效' : 
                       qualification.status === 'EXPIRES_SOON' ? '即將到期' : '已過期'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-primary" onClick={() => handleEdit(qualification)}>
                      編輯
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(qualification.id)}>
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // FaceMatch 整合管理
  const FaceMatchTab = () => {
    const [records, setRecords] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
      personName: '', workOrderId: '', status: 'PENDING'
    });
    
    useEffect(() => {
      fetchRecords();
    }, []);
    
    const fetchRecords = async () => {
      try {
        const response = await fetch(`${API_BASE}/facematch`);
        const data = await response.json();
        if (data.success) setRecords(data.data);
      } catch (error) {
        console.error('獲取記錄失敗:', error);
      }
    };
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const url = editingId ? `${API_BASE}/facematch/${editingId}` : `${API_BASE}/facematch`;
        const method = editingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({...formData, workOrderId: parseInt(formData.workOrderId)})
        });
        
        const data = await response.json();
        if (data.success) {
          fetchRecords();
          setShowForm(false);
          setEditingId(null);
          setFormData({ personName: '', workOrderId: '', status: 'PENDING' });
        }
      } catch (error) {
        alert('操作失敗: ' + error.message);
      }
    };
    
    const handleEdit = (record) => {
      setFormData(record);
      setEditingId(record.id);
      setShowForm(true);
    };
    
    const handleDelete = async (id) => {
      if (!window.confirm('確定要刪除嗎？')) return;
      try {
        const response = await fetch(`${API_BASE}/facematch/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) fetchRecords();
      } catch (error) {
        alert('刪除失敗: ' + error.message);
      }
    };
    
    return (
      <div>
        <div className="flex">
          <h2>FaceMatch 整合管理</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '取消' : '新增記錄'}
          </button>
        </div>
        
        {showForm && (
          <div className="card">
            <h3>{editingId ? '編輯記錄' : '新增記錄'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>人員姓名</label>
                <input 
                  type="text" 
                  value={formData.personName} 
                  onChange={(e) => setFormData({...formData, personName: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>施工單 ID</label>
                <input 
                  type="number" 
                  value={formData.workOrderId} 
                  onChange={(e) => setFormData({...formData, workOrderId: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>同步狀態</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="PENDING">待同步</option>
                  <option value="SUCCESS">同步成功</option>
                  <option value="FAILED">同步失敗</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success">
                {editingId ? '更新' : '新增'}
              </button>
            </form>
          </div>
        )}
        
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>人員姓名</th>
                <th>施工單 ID</th>
                <th>同步狀態</th>
                <th>同步時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <tr key={record.id}>
                  <td>{record.personName}</td>
                  <td>{record.workOrderId}</td>
                  <td>
                    <span className={`status-badge status-${record.status.toLowerCase()}`}>
                      {record.status === 'PENDING' ? '待同步' : 
                       record.status === 'SUCCESS' ? '同步成功' : '同步失敗'}
                    </span>
                  </td>
                  <td>{record.syncTime ? new Date(record.syncTime).toLocaleString('zh-TW') : '-'}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => handleEdit(record)}>
                      編輯
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(record.id)}>
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  if (!user) {
    return <LoginForm />;
  }
  
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'contractors': return <ContractorsTab />;
      case 'workorders': return <WorkOrdersTab />;
      case 'qualifications': return <QualificationsTab />;
      case 'facematch': return <FaceMatchTab />;
      default: return <ContractorsTab />;
    }
  };
  
  return (
    <div className="container">
      <div className="header">
        <h1>FaceMatch 極簡管理系統</h1>
        <p>歡迎，{user.name} | <button onClick={() => setUser(null)} style={{background: 'none', border: '1px solid white', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'}}>登出</button></p>
      </div>
      
      <div className="nav">
        <button 
          className={activeTab === 'contractors' ? 'active' : ''} 
          onClick={() => setActiveTab('contractors')}
        >
          承攬商管理
        </button>
        <button 
          className={activeTab === 'workorders' ? 'active' : ''} 
          onClick={() => setActiveTab('workorders')}
        >
          施工單管理
        </button>
        <button 
          className={activeTab === 'qualifications' ? 'active' : ''} 
          onClick={() => setActiveTab('qualifications')}
        >
          年度資格管理
        </button>
        <button 
          className={activeTab === 'facematch' ? 'active' : ''} 
          onClick={() => setActiveTab('facematch')}
        >
          FaceMatch 整合
        </button>
      </div>
      
      {renderActiveTab()}
    </div>
  );
}

export default App;