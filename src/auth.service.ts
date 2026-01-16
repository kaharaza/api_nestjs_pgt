import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async loginPgt(pgt: {
    codeId: string;
    email: string;
    fnameEn: string;
    lnameEn: string;
    points: number;
    cecode: string;
    role: string;
    foodtype: string;
    sex: string;
  }) {
    const payload = {
      codeId: pgt.codeId,
      email: pgt.email,
      fnameEn: pgt.fnameEn,
      lnameEn: pgt.lnameEn,
      points: pgt.points,
      cecode: pgt.cecode,
      role: pgt.role,
      sex: pgt.sex,
      foodtype: pgt.foodtype,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
    };
  }

  async loginAdminPgt(cmu: any) {
    const payload = {
      sub: cmu.id,
      name: cmu.name,
      email: cmu.cmuitaccount,
      organization_code: cmu.organization_code,
      itaccounttype_id: cmu.itaccounttype_id,
      role: cmu.role,
      permission: cmu.permission,
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

  async loginUser(user: any) {
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
