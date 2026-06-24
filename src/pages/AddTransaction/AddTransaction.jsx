import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Save } from 'lucide-react';
import api from '../../lib/axios';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';

const CATEGORIES = [
  'Học phí tháng', 'Quỹ CLB', 'Mua Võ phục & Đai', 
  'Chi phí Sự kiện (Camp 26/3, Big Game)', 'Thuê sân bãi', 'Khác'
];

const AddTransaction = () => {
  const [data, setData] = useState({
    date: new Date().toLocaleDateString('en-CA'),
    description: "",
    amount: "",
    type: "income",
    category: CATEGORIES[0],
    person: "",
    quantity: 1,
    unitPrice: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto calculate total amount if quantity and unitPrice change
      if (name === 'quantity' || name === 'unitPrice') {
        const qty = Number(name === 'quantity' ? value : prev.quantity) || 1;
        const price = Number(name === 'unitPrice' ? value : prev.unitPrice) || 0;
        updated.amount = qty * price;
      }
      
      return updated;
    });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!data.description || !data.amount || !data.person) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/transactions', {
        ...data,
        amount: Number(data.amount),
        quantity: Number(data.quantity) || 1,
        unitPrice: Number(data.unitPrice) || 0
      });

      if (res.data.success) {
        toast.success("Đã thêm giao dịch thành công!");
        setData({
          ...data,
          description: "",
          amount: "",
          quantity: 1,
          unitPrice: "",
          person: ""
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm giao dịch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollReveal direction="up" duration={0.5}>
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 w-full hover:shadow-md transition-all duration-300">
        <h2 className="text-xl font-bold text-gray-800 mb-6">➕ Thêm Giao Dịch Mới</h2>
        
        <form onSubmit={onSubmitHandler} className="flex flex-col gap-5">
          <div className="flex gap-4">
            <label className="flex-1 cursor-pointer group">
              <input type="radio" name="type" value="income" checked={data.type === 'income'} onChange={onChangeHandler} className="hidden peer" />
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-center py-3.5 rounded-xl border-2 border-gray-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-600 font-bold text-gray-400 transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50/20"
              >
                💰 Khoản Thu
              </motion.div>
            </label>
            <label className="flex-1 cursor-pointer group">
              <input type="radio" name="type" value="expense" checked={data.type === 'expense'} onChange={onChangeHandler} className="hidden peer" />
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-center py-3.5 rounded-xl border-2 border-gray-200 peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-600 font-bold text-gray-400 transition-all duration-300 hover:border-red-300 hover:bg-red-50/20"
              >
                💸 Khoản Chi
              </motion.div>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-600">Ngày giao dịch</label>
            <input 
              type="date" 
              name="date" 
              value={data.date} 
              onChange={onChangeHandler} 
              className="p-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-300 hover:border-gray-300 font-medium" 
              required 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-600">Tên hàng chi / Tên hàng thu (Sản phẩm)</label>
            <input 
              type="text" 
              name="description" 
              value={data.description} 
              onChange={onChangeHandler} 
              placeholder="VD: Mua nước khoáng, Thu quỹ tháng 5..." 
              className="p-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-300 hover:border-gray-300 font-medium" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-600">Số lượng</label>
              <input 
                type="number" 
                name="quantity" 
                value={data.quantity} 
                onChange={onChangeHandler} 
                placeholder="1" 
                min="1" 
                className="p-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-300 hover:border-gray-300 font-medium" 
                required 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-600">Đơn giá (VNĐ)</label>
              <input 
                type="number" 
                name="unitPrice" 
                value={data.unitPrice} 
                onChange={onChangeHandler} 
                placeholder="VD: 50000" 
                min="0" 
                className="p-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-300 hover:border-gray-300 font-medium" 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-600">Danh mục</label>
              <select 
                name="category" 
                value={data.category} 
                onChange={onChangeHandler} 
                className="p-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-300 hover:border-gray-300 font-medium cursor-pointer"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-600 flex items-center gap-1.5">
                Số tiền tổng cộng (VNĐ)
                <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Tự động tính</span>
              </label>
              <input 
                type="number" 
                name="amount" 
                value={data.amount} 
                readOnly
                placeholder="0" 
                className="p-3 border border-gray-200 bg-gray-50 text-blue-700 font-black rounded-xl outline-none cursor-not-allowed" 
                required 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-600">Người thực hiện/Người duyệt</label>
            <input 
              type="text" 
              name="person" 
              value={data.person} 
              onChange={onChangeHandler} 
              placeholder="VD: Nguyễn Văn A" 
              className="p-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-300 hover:border-gray-300 font-medium" 
              required 
            />
          </div>

          <motion.button 
            type="submit" 
            disabled={isSubmitting} 
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="mt-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-3.5 rounded-xl hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <><Save className="w-5 h-5" /> THÊM GIAO DỊCH</>
            )}
          </motion.button>
        </form>
      </div>
    </ScrollReveal>
  );
};


export default AddTransaction;
