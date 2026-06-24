import { create } from 'zustand';
import api from '../lib/axios';

const useTaskStore = create((set, get) => {
  let pollIntervalId = null;

  return {
    tasks: [],
    queueStats: { running: 0, queued: 0, total: 0, maxConcurrent: 3, maxQueued: 50 },
    isLoading: false,
    hasActiveTasks: false,

    fetchQueueStats: async () => {
      try {
        const res = await api.get('/tasks/stats/queue');
        if (res.data.success) {
          set({ queueStats: res.data.stats });
        }
      } catch (error) {
        console.error('Fetch queue stats error:', error);
      }
    },

    fetchTasks: async () => {
      try {
        const res = await api.get('/tasks?pageSize=10');
        if (res.data.success) {
          const tasks = res.data.tasks || [];
          
          // Check if there are active tasks (processing or queued)
          const hasActive = tasks.some(t => t.state === 'processing' || t.state === 'queued');
          
          set({ 
            tasks, 
            hasActiveTasks: hasActive 
          });
        }
      } catch (error) {
        console.error('Fetch tasks error:', error);
      }
    },

    startPolling: () => {
      if (pollIntervalId) return;

      // Poll immediately
      get().fetchTasks();
      get().fetchQueueStats();

      // Poll every 3 seconds
      pollIntervalId = setInterval(() => {
        get().fetchTasks();
        get().fetchQueueStats();
        
        // If no active tasks are left, transition to slower polling or stop
        const { hasActiveTasks } = get();
        if (!hasActiveTasks) {
          // Keep polling but slower (every 15s) to get stats changes
        }
      }, 3000);
    },

    stopPolling: () => {
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
      }
    }
  };
});

export default useTaskStore;
