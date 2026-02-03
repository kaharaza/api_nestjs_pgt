import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class WsService {
  private readonly logger = new Logger(WsService.name);
  private server?: Server;

  setServer(server: Server) {
    this.server = server;
    this.logger.log('Socket.IO server registered in WsService');
    console.log('WsService got server ✅');
  }

  // ตัวอย่าง emit ไปที่ทั้งระบบ
  emit(event: string, payload: any) {
    if (!this.server) return;
    this.server.emit(event, payload);
  }

  // ตัวอย่าง emit ไปที่ room โปรเจกต์
  emitToProject(projectId: number, event: string, payload: any) {
    if (!this.server) return;
    this.server.to(`project:${projectId}`).emit(event, payload);
    console.log('emitToProject', projectId, event, !!this.server);
  }

  // helper room
  roomProject(projectId: number) {
    return `project:${projectId}`;
  }
}
