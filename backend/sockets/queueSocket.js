let ioInstance = null;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  ioInstance = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Join specific service queue room
    socket.on('join_service_room', (serviceId) => {
      const room = `service_${serviceId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('leave_service_room', (serviceId) => {
      const room = `service_${serviceId}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });

    // Join user-specific notification channel
    socket.on('join_user_room', (userId) => {
      const room = `user_${userId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} registered for user room ${room}`);
    });

    // Join organization-wide room
    socket.on('join_org_room', (orgId) => {
      const room = `org_${orgId}`;
      socket.join(room);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

const getIO = () => {
  if (!ioInstance) {
    console.warn('Socket.IO has not been initialized yet.');
  }
  return ioInstance;
};

// Emit live queue state updates for a service
const emitQueueUpdate = (serviceId, data) => {
  if (ioInstance) {
    ioInstance.to(`service_${serviceId}`).emit('queue_updated', data);
    ioInstance.emit('global_queue_change', { serviceId, ...data });
  }
};

// Emit private notification to a specific user
const emitUserNotification = (userId, notification) => {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit('notification', notification);
  }
};

// Emit staff dashboard trigger
const emitStaffUpdate = (serviceId, data) => {
  if (ioInstance) {
    ioInstance.to(`service_${serviceId}`).emit('staff_queue_updated', data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitQueueUpdate,
  emitUserNotification,
  emitStaffUpdate
};
