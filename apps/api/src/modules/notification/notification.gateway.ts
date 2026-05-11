import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['polling', 'websocket'], // Ensure polling-first for better compatibility with proxies
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('NotificationGateway');

  @SubscribeMessage('subscribeToAspiration')
  handleSubscribe(client: Socket, aspirationId: string) {
    client.join(`aspiration_${aspirationId}`);
    this.logger.log(
      `Client ${client.id} subscribed to aspiration_${aspirationId}`,
    );
  }

  @SubscribeMessage('subscribeToAdmin')
  handleAdminSubscribe(client: Socket) {
    client.join('admin_notifications');
    this.logger.log(`Client ${client.id} subscribed to admin_notifications`);
  }

  notifyStatusChange(aspirationId: string, data: any) {
    this.server.to(`aspiration_${aspirationId}`).emit('statusChanged', data);
    this.server.to('admin_notifications').emit('adminNotification', {
      type: 'STATUS_CHANGE',
      aspirationId,
      ...data,
    });
  }

  notifyNewAspiration(data: any) {
    this.server.to('admin_notifications').emit('adminNotification', {
      type: 'NEW_ASPIRATION',
      ...data,
    });
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }
}
