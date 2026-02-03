import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsService } from './pgt-ws.service';

@WebSocketGateway({
  namespace: '/pgt', // ตรงกับ client: io('.../pgt')
  //   path: '/ws/pgt/socket.io',
  cors: { origin: '*', credentials: true },
  // ถ้ามี custom path กับ nginx ค่อยเพิ่ม: path: '/ws/pgt/socket.io'
})
export class PgtWsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(PgtWsGateway.name);

  constructor(private readonly ws: WsService) {}

  afterInit(server: Server) {
    // ✅ ย้าย setServer มาไว้ที่ Gateway (ไม่ใช่ใน Controller)
    this.ws.setServer(server);
    this.logger.log('PgtWsGateway initialized');
    console.log('WS server set ✅');
  }

  handleConnection(client: Socket) {
    // ตัวอย่าง: auto join room จาก query (ถ้าต้องการ)
    const { projectId } = client.handshake.query;
    if (projectId && !Array.isArray(projectId)) {
      client.join(this.ws.roomProject(Number(projectId)));
    }
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
