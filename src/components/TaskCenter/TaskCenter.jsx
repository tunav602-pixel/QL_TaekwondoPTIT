import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, CheckCircle, XCircle, Clock, Server, Loader2, Download, 
  Trash2, X, RefreshCw, Activity, ArrowUpRight, BellRing
} from 'lucide-react';
import useTaskStore from '../../store/useTaskStore';
import { BACKEND_URL } from '../../lib/axios';

const TaskCenter = ({ isOpen, onClose }) => {
  const { tasks, queueStats, fetchTasks, fetchQueueStats, startPolling, stopPolling } = useTaskStore();

  useEffect(() => {
    if (isOpen) {
      startPolling();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isOpen]);

  const handleRefresh = () => {
    fetchTasks();
    fetchQueueStats();
  };

  const getStatusIcon = (state) => {
    switch (state) {
      case 'queued':
        return <Clock className="w-4 h-4 text-gray-400 animate-pulse" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (state) => {
    switch (state) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-200">
            Đang xếp hàng
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 animate-pulse">
            Đang xử lý
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
            Hoàn thành
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
            Thất bại
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Transparent click-away backdrop */}
          <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white/92 backdrop-blur-xl border border-gray-100/90 shadow-[0_20px_50px_rgba(15,23,42,0.15)] rounded-3xl p-5 z-50 overflow-hidden flex flex-col gap-4 text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Activity className="w-4.5 h-4.5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 leading-none">Trung Tâm Tác Vụ</h3>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">Giám sát xử lý bất đồng bộ</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleRefresh}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Tải lại"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Queue Statistics Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/50 border border-slate-100/70 rounded-2xl p-3 flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Đang chạy</p>
                  <p className="text-base font-black text-blue-700 mt-0.5">
                    {queueStats.running} / {queueStats.maxConcurrent}
                  </p>
                </div>
              </div>
              <div className="bg-slate-50/50 border border-slate-100/70 rounded-2xl p-3 flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Hàng chờ</p>
                  <p className="text-base font-black text-amber-700 mt-0.5">
                    {queueStats.queued} / {queueStats.maxQueued}
                  </p>
                </div>
              </div>
            </div>

            {/* Task list container */}
            <div className="flex-1 overflow-y-auto max-h-[280px] pr-1 space-y-3.5">
              {tasks.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                  <Clock className="w-8 h-8 text-gray-200" />
                  <p className="text-xs text-gray-400 font-bold">Chưa có tác vụ nào phát sinh</p>
                  <p className="text-[10px] text-gray-300">Tác vụ xuất báo cáo, gửi thông báo sẽ hiện ở đây</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div 
                    key={task.taskId} 
                    className="p-3.5 rounded-2xl border border-gray-100 bg-gradient-to-r from-gray-50 to-transparent flex flex-col gap-2.5 hover:border-blue-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                            task.type === 'export_transactions' ? 'bg-indigo-500' : 'bg-emerald-500'
                          }`} />
                          <h4 className="text-xs font-bold text-gray-800 truncate" title={task.title}>
                            {task.title || 'Tác vụ hệ thống'}
                          </h4>
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold mt-0.5">
                          Tạo bởi: {task.createdBy} • ID: {task.taskId.slice(0, 15)}...
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-1.5">
                        {getStatusIcon(task.state)}
                        {getStatusBadge(task.state)}
                      </div>
                    </div>

                    {/* Progress Bar for Active Tasks */}
                    {(task.state === 'processing' || task.state === 'queued') && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                          <span>Tiến độ</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-150 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Result actions */}
                    {task.state === 'completed' && task.result && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-50 mt-1">
                        <p className="text-[10px] text-gray-400 font-bold">
                          Đã xử lý {task.result.count} mục
                        </p>
                        
                        {task.result.downloadUrl && (
                          <a 
                            href={`${BACKEND_URL}${task.result.downloadUrl}`}
                            download
                            className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm/5 border border-blue-100"
                            title="Tải xuống tệp báo cáo"
                          >
                            <Download className="w-3.5 h-3.5" /> Tải báo cáo
                          </a>
                        )}

                        {task.type === 'bulk_reminders' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                            <BellRing className="w-3.5 h-3.5" /> Đã gửi nhắc nhở
                          </span>
                        )}
                      </div>
                    )}

                    {/* Error display */}
                    {task.state === 'failed' && task.error && (
                      <p className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2.5 py-2 rounded-xl mt-1 leading-relaxed">
                        Lỗi: {task.error}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TaskCenter;
