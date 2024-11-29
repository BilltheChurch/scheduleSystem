import React, { useState, useEffect } from 'react';
import { Calendar } from '../components/Calendar';
import { TeacherTimeSelection } from '../components/TeacherTimeSelection';
import { socketService } from '../services/socket';
import { TimeSlot, ScheduleRequest } from '../types';
import { RequestsSidebar } from '../components/RequestsSidebar';

export const TeacherDashboard: React.FC = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [requests, setRequests] = useState<ScheduleRequest[]>([]);
  const [processedRequests, setProcessedRequests] = useState<ScheduleRequest[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const user = JSON.parse(localStorage.getItem('teacher_user') || '{}');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    // 监听初始数据
    const handleInitialData = (data: { timeSlots: TimeSlot[], scheduleRequests: ScheduleRequest[] }) => {
      console.log('Received initial data:', data);
      setTimeSlots(data.timeSlots);
      setRequests(data.scheduleRequests);
    };

    // 监听时间段更新
    const handleSlotsUpdate = (updatedSlots: TimeSlot[]) => {
      console.log('Received updated slots:', updatedSlots);
      setTimeSlots(updatedSlots);
    };

    // 监听请求更新
    const handleRequestsUpdate = (updatedRequests: ScheduleRequest[]) => {
      console.log('Received updated requests:', updatedRequests);
      setRequests(updatedRequests);
    };

    // 添加处理历史记录的监听器
    const handleProcessedHistory = (history: ScheduleRequest[]) => {
      console.log('Received processed history:', history);
      setProcessedRequests(history);
    };

    // 注册监听器
    socketService.socket.on('initial-data', handleInitialData);
    socketService.socket.on('slots-updated', handleSlotsUpdate);
    socketService.socket.on('requests-updated', handleRequestsUpdate);
    socketService.socket.on('processed-history', handleProcessedHistory);

    // 请求初始数据和历史记录
    socketService.socket.emit('request-initial-data');
    socketService.socket.emit('request-processed-history');

    // 清理函数
    return () => {
      socketService.socket.off('initial-data', handleInitialData);
      socketService.socket.off('slots-updated', handleSlotsUpdate);
      socketService.socket.off('requests-updated', handleRequestsUpdate);
      socketService.socket.off('processed-history', handleProcessedHistory);
    };
  }, []);

  const handleTimeSelect = (slots: TimeSlot[]) => {
    console.log('Sending time slots to server:', slots);
    socketService.addTimeSlots(slots);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    if (slot.status === 'free') {
      if (confirm('是否要删除这个时间段？')) {
        socketService.deleteTimeSlot(slot.id);
      }
    } else if (!slot.isConfirmed && slot.status === 'busy') {
      if (confirm('是否确认这个预约？')) {
        socketService.confirmBooking(slot.id);
      }
    }
  };

  const handleApproveRequest = (requestId: string) => {
    console.log('Approving request:', requestId);
    socketService.approveModification(requestId);
    setIsSidebarOpen(false); // 关闭侧边栏
  };

  const handleRejectRequest = (requestId: string) => {
    console.log('Rejecting request:', requestId);
    socketService.rejectModification(requestId);
    setIsSidebarOpen(false); // 关闭侧边栏
  };

  const handleDeleteSlots = (slotIds: string[]) => {
    // 批量删除时间段
    slotIds.forEach(id => {
      socketService.deleteTimeSlot(id);
    });
  };

  const formatTimeRange = (slot: TimeSlot) => {
    const startTime = new Date(slot.startTime).toLocaleString();
    const endTime = new Date(slot.endTime).toLocaleString();
    return `${startTime} - ${endTime}`;
  };

  const handleRequestSelect = (requestId: string) => {
    setSelectedRequestId(requestId);
    setIsSidebarOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">教师面板</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">添加可用时间段</h2>
          <TeacherTimeSelection 
            onTimeSelect={handleTimeSelect}
            existingSlots={timeSlots}
            onDeleteSlots={handleDeleteSlots}
            requests={requests}
            onRequestSelect={handleRequestSelect}
          />
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">课程表</h2>
          <Calendar
            timeSlots={timeSlots}
            requests={requests}
            onSlotSelect={handleSlotSelect}
            userRole="teacher"
            currentUserId={user.id}
          />
        </div>

        <RequestsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          requests={requests}
          timeSlots={timeSlots}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
        />
      </div>
    </div>
  );
}; 