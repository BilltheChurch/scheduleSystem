import { io } from 'socket.io-client';
import { TimeSlot, ScheduleRequest } from '../types';

const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('teacher_token') || localStorage.getItem('student_token')
  },
  transports: ['websocket', 'polling'],
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

export const socketService = {
  socket,
  
  // 预约时间段
  bookTimeSlot: (data: {
    slotId: string;
    studentId: string;
    studentName: string;
    courseContent: string;
  }) => {
    console.log('Booking time slot:', data);
    socket.emit('book-slot', data);
  },

  // 提交修改请求
  submitModificationRequest: (request: ScheduleRequest) => {
    console.log('Submitting modification request:', request);
    socket.emit('modify-request', request);
  },

  // 教师添加时间段
  addTimeSlots: (slots: TimeSlot[]) => {
    console.log('Adding time slots:', slots);
    socket.emit('add-time-slots', slots);
  },

  // 教师确认预约
  confirmBooking: (slotId: string) => {
    console.log('Confirming booking:', slotId);
    socket.emit('confirm-booking', slotId);
  },

  // 教师审批修改请求
  approveModification: (requestId: string) => {
    console.log('Approving modification:', requestId);
    socket.emit('approve-modification', requestId);
  },

  // 删除时间段
  deleteTimeSlot: (slotId: string) => {
    console.log('Deleting time slot:', slotId);
    socket.emit('delete-time-slot', slotId);
  },

  // 监听时间段更新
  onSlotsUpdated: (callback: (slots: TimeSlot[]) => void) => {
    // 先移除之前的监听器，避免重复
    socket.off('slots-updated');
    socket.on('slots-updated', (updatedSlots: TimeSlot[]) => {
      console.log('Received slots update:', updatedSlots);
      callback(updatedSlots);
    });
  },

  // 监听请求更新
  onRequestsUpdated: (callback: (requests: ScheduleRequest[]) => void) => {
    // 先移除之前的监听器，避免重复
    socket.off('requests-updated');
    socket.on('requests-updated', (updatedRequests: ScheduleRequest[]) => {
      console.log('Received requests update:', updatedRequests);
      callback(updatedRequests);
    });
  },

  // 请求初始数据
  requestInitialData: () => {
    console.log('Requesting initial data');
    socket.emit('request-initial-data');
  },

  // 监听初始数据
  onInitialData: (callback: (data: { 
    timeSlots: TimeSlot[], 
    scheduleRequests: ScheduleRequest[] 
  }) => void) => {
    // 先移除之前的监听器，避免重复
    socket.off('initial-data');
    socket.on('initial-data', (data) => {
      console.log('Received initial data:', data);
      callback(data);
    });
  },

  // 教师拒绝修改请求
  rejectModification: (requestId: string) => {
    console.log('Sending reject modification request:', requestId);
    socket.emit('reject-modification', requestId);
  },

  // 添加监听器
  onModificationRejected: (callback: (response: { success: boolean, error?: string }) => void) => {
    socket.on('modification-rejected', callback);
  }
}; 