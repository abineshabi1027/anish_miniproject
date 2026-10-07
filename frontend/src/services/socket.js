import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to QueueLess Socket.IO server:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('⚠️ Disconnected from socket server:', reason);
    });
  }
  return socket;
};

export const joinServiceQueueRoom = (serviceId) => {
  const s = getSocket();
  if (serviceId) {
    s.emit('join_service_room', serviceId);
  }
};

export const leaveServiceQueueRoom = (serviceId) => {
  const s = getSocket();
  if (serviceId) {
    s.emit('leave_service_room', serviceId);
  }
};

export const registerUserSocket = (userId) => {
  const s = getSocket();
  if (userId) {
    s.emit('join_user_room', userId);
  }
};
