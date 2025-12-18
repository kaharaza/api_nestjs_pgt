import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async validateUserById(userId: string) {
    return null;
  }



  async loginPgt(pgt: any) {
    const payload = {
      sub: pgt.id,
      email: pgt.email,
      fname: pgt.fname,
      codeId: pgt.codeId,
    };


    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async gencode(data: any) {
    const payload = {
      agencyId: data.agencyId,
      name: data.name,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async  loginUser(user: any) {
    const payload = {
      sub: user.id,
      fnameTh: user.fnameTh,
      lnameTh: user.lnameTh,
      email: user.email,
      role: user.role,
      codeId: user.codeId,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
