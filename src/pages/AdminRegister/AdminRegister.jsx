import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Mail, Lock, User, Briefcase, Calendar, Users, ArrowUpRight, ArrowDownRight, ShieldAlert, AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/axios';

const SUB_ADMIN_ROLES = [
  { value: 'Chủ nhiệm', label: 'Chủ Nhiệm', color: 'red' },
  { value: 'Ban chuyên môn', label: 'Ban Chuyên Môn', color: 'blue' },
  { value: 'Ban tài chính', label: 'Ban Tài Chính', color: 'emerald' },
  { value: 'Ban sự kiện', label: 'Ban Sự Kiện', color: 'purple' },
  { value: 'Ban nhân sự', label: 'Ban Nhân Sự', color: 'amber' },
  { value: 'Ban truyền thông', label: 'Ban Truyền Thông', color: 'pink' }
];

const AdminRegister = () => {
  const [activeTab, setActiveTab] = useState('admins'); // 'admins' | 'members'
  
  // Form states
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', subRole: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Lists
  const [subAdmins, setSubAdmins] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Modal states
  const [promoteModal, setPromoteModal] = useState(null); // { userId, userName }
  const [demoteModal, setDemoteModal] = useState(null);
  const [selectedSubRole, setSelectedSubRole] = useState('');

  useEffect(() => {
    fetchSubAdmins();
    fetchMembers();
  }, []);

  const fetchSubAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const res = await api.get('/users/sub-admins');
      if (res.data.success) setSubAdmins(res.data.subAdmins);
    } catch (error) {
      console.error('Error fetching sub-admins:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await api.get('/users/members');
      if (res.data.success) setMembers(res.data.members);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập họ tên';
    if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if (!formData.password) newErrors.password = 'Vui lòng nhập mật khẩu';
    else if (formData.password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    if (!formData.subRole) newErrors.subRole = 'Vui lòng chọn chức vụ';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/users/register-sub-admin', {
        name: formData.name, email: formData.email, password: formData.password, subRole: formData.subRole
      });
      if (res.data.success) {
        toast.success('Đăng ký Sub-Admin thành công! 🎉');
        setFormData({ name: '', email: '', password: '', confirmPassword: '', subRole: '' });
        setShowCreateForm(false);
        fetchSubAdmins();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromote = async () => {
    if (!promoteModal || !selectedSubRole) {
      toast.error('Vui lòng chọn chức vụ');
      return;
    }
    try {
      const res = await api.put(`/users/${promoteModal.userId}/promote`, { subRole: selectedSubRole });
      if (res.data.success) {
        toast.success(res.data.message);
        setPromoteModal(null);
        setSelectedSubRole('');
        fetchSubAdmins();
        fetchMembers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể nâng quyền.');
    }
  };

  const handleDemote = async () => {
    if (!demoteModal) return;
    try {
      const res = await api.put(`/users/${demoteModal.userId}/demote`);
      if (res.data.success) {
        toast.success(res.data.message);
        setDemoteModal(null);
        fetchSubAdmins();
        fetchMembers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể hạ quyền.');
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const getInitials = (name) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto w-full animate-slideUp">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg border border-white/10">
            <Plus className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(15,23,42,0.85)]">Quản Lý Người Dùng</h1>
        </div>
        <p className="text-sm text-blue-100/90 font-medium ml-14 drop-shadow-[0_1px_4px_rgba(15,23,42,0.6)]">
          Trang quản lý dành riêng cho <span className="font-bold text-red-400">Super Admin</span>. Quản lý tài khoản Admin và Thành viên CLB.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('admins')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95
            ${activeTab === 'admins' ? 'bg-white text-blue-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ShieldAlert className="w-4 h-4" />
          Quản lý Admin
          <span className={`text-xs px-2 py-0.5 rounded-full transition-all duration-300 ${activeTab === 'admins' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
            {subAdmins.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95
            ${activeTab === 'members' ? 'bg-white text-emerald-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users className="w-4 h-4" />
          Quản lý Thành viên
          <span className={`text-xs px-2 py-0.5 rounded-full transition-all duration-300 ${activeTab === 'members' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
            {members.length}
          </span>
        </button>
      </div>

      {/* === TAB: Quản lý Admin === */}
      {activeTab === 'admins' && (
        <div className="animate-slideUp">
          {/* Create Admin Button & Form */}
          <div className="mb-6">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-5 h-5 animate-pulse" /> Tạo Sub-Admin Mới
              </button>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-slideUp">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-600" /> Tạo Sub-Admin Mới
                  </h3>
                  <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer transition-colors">✕ Đóng</button>
                </div>
                <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider"><User className="w-3.5 h-3.5 inline mr-1 text-gray-400" />Họ và Tên</label>
                    <input type="text" name="name" value={formData.name} onChange={onChange} placeholder="VD: Nguyễn Văn A"
                      className={`w-full p-3 border rounded-xl outline-none text-sm font-semibold transition-all duration-300 ${errors.name ? 'border-red-400 focus:ring-4 focus:ring-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:border-gray-300'}`} />
                    {errors.name && <p className="text-red-500 text-xs font-semibold">{errors.name}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider"><Mail className="w-3.5 h-3.5 inline mr-1 text-gray-400" />Email</label>
                    <input type="email" name="email" value={formData.email} onChange={onChange} placeholder="admin@example.com"
                      className={`w-full p-3 border rounded-xl outline-none text-sm font-semibold transition-all duration-300 ${errors.email ? 'border-red-400 focus:ring-4 focus:ring-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:border-gray-300'}`} />
                    {errors.email && <p className="text-red-500 text-xs font-semibold">{errors.email}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider"><Lock className="w-3.5 h-3.5 inline mr-1 text-gray-400" />Mật khẩu</label>
                    <input type="password" name="password" value={formData.password} onChange={onChange} placeholder="••••••••"
                      className={`w-full p-3 border rounded-xl outline-none text-sm font-semibold transition-all duration-300 ${errors.password ? 'border-red-400 focus:ring-4 focus:ring-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:border-gray-300'}`} />
                    {errors.password && <p className="text-red-500 text-xs font-semibold">{errors.password}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider"><Lock className="w-3.5 h-3.5 inline mr-1 text-gray-400" />Xác nhận mật khẩu</label>
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={onChange} placeholder="••••••••"
                      className={`w-full p-3 border rounded-xl outline-none text-sm font-semibold transition-all duration-300 ${errors.confirmPassword ? 'border-red-400 focus:ring-4 focus:ring-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:border-gray-300'}`} />
                    {errors.confirmPassword && <p className="text-red-500 text-xs font-semibold">{errors.confirmPassword}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider"><Briefcase className="w-3.5 h-3.5 inline mr-1 text-gray-400" />Chức vụ / Ban</label>
                    <select name="subRole" value={formData.subRole} onChange={onChange}
                      className={`w-full p-3 border rounded-xl outline-none text-sm font-semibold transition-all duration-300 ${errors.subRole ? 'border-red-400 focus:ring-4 focus:ring-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:border-gray-300'}`}>
                      <option value="">-- Chọn chức vụ --</option>
                      {SUB_ADMIN_ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                    </select>
                    {errors.subRole && <p className="text-red-500 text-xs font-semibold">{errors.subRole}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <button type="submit" disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-xl hover:shadow-blue-500/25 active:scale-98 hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                      {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><UserPlus className="w-5 h-5" /> Tạo Sub-Admin</>}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Admin List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Shield className="w-5 h-5 text-blue-600" /> Danh Sách Sub-Admin</h3>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{subAdmins.length} Admin</span>
            </div>
            <div className="p-4">
              {loadingAdmins ? (
                <div className="flex items-center justify-center py-12"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
              ) : subAdmins.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><p className="font-medium">Chưa có Sub-Admin nào</p></div>
              ) : (
                <div className="space-y-3">
                  {subAdmins.map((admin) => (
                    <div 
                      key={admin.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100 hover:shadow-sm hover:translate-x-1 duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                          {getInitials(admin.name)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{admin.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{admin.email}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Briefcase className="w-3 h-3" />{admin.subRole}
                            </span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />{formatDate(admin.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setDemoteModal({ userId: admin.id, userName: admin.name })}
                        className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <ArrowDownRight className="w-3.5 h-3.5" /> Hạ quyền
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === TAB: Quản lý Thành viên === */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-slideUp hover:shadow-md transition-all duration-300">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" /> Danh Sách Thành Viên</h3>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">{members.length} Thành viên</span>
          </div>
          <div className="p-4">
            {loadingMembers ? (
              <div className="flex items-center justify-center py-12"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div>
            ) : members.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><p className="font-medium">Chưa có thành viên nào</p></div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100 hover:shadow-sm hover:translate-x-1 duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{member.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{member.email}</p>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />{formatDate(member.createdAt)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setPromoteModal({ userId: member.id, userName: member.name }); setSelectedSubRole(''); }}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Nâng quyền
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Promote Modal */}
      {promoteModal && (
        <div className="fixed inset-0 bg-slate-950/20 z-50 flex items-center justify-center animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-elasticScaleIn">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 animate-pulse"><ArrowUpRight className="w-7 h-7" /></div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Nâng quyền lên Admin</h3>
                <p className="text-sm text-gray-500">Nâng quyền <strong>{promoteModal.userName}</strong> lên Sub-Admin</p>
              </div>
              <select value={selectedSubRole} onChange={(e) => setSelectedSubRole(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-300">
                <option value="">-- Chọn chức vụ --</option>
                {SUB_ADMIN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <div className="flex gap-3 w-full">
                <button onClick={() => setPromoteModal(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm">Hủy</button>
                <button onClick={handlePromote} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm">Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demote Modal */}
      {demoteModal && (
        <div className="fixed inset-0 bg-slate-950/20 z-50 flex items-center justify-center animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-elasticScaleIn">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 animate-pulse"><AlertTriangle className="w-7 h-7" /></div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Hạ quyền xuống Thành viên</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Bạn có chắc chắn muốn hạ quyền <strong>{demoteModal.userName}</strong> xuống Thành viên thường?</p>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDemoteModal(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm">Hủy</button>
                <button onClick={handleDemote} className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm">Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default AdminRegister;
