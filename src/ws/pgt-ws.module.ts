import { Module } from '@nestjs/common';
import { PgtWsGateway } from './pgt-ws.gateway';
import { WsService } from './pgt-ws.service';

@Module({
  providers: [PgtWsGateway, WsService],
  exports: [WsService], // export service เพื่อให้ controller อื่น ๆ inject ได้
})
export class PgtWsModule {}
``;
