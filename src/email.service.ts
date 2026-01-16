import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import {
  loadTemplate,
  renderTemplate,
  TemplateName,
} from './email/template-loader';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendTemplateEmail(
    to: string,
    template: TemplateName,
    subject: string,
    vars: {
      fnameTh?: string;
      lnameTh?: string;
      redirect?: string;
      year?: string | number;
      [key: string]: string | number | undefined;
    },
  ): Promise<void> {
    const htmlRaw = loadTemplate(template);
    const html = renderTemplate(htmlRaw, {
      ...vars,
      year: vars.year ?? new Date().getFullYear(),
    });

    await this.mailerService.sendMail({
      to: to,
      subject: subject,
      html: html,
    });
  }

  async sendTemplateEmailAdmin(
    to: string[],
    template: TemplateName,
    subject: string,
    vars: {
      fnameTh?: string;
      lnameTh?: string;
      redirect?: string;
      year?: string | number;
      [key: string]: string | number | undefined;
    },
  ): Promise<void> {
    const htmlRaw = loadTemplate(template);
    const html = renderTemplate(htmlRaw, {
      ...vars,
      year: vars.year ?? new Date().getFullYear(),
    });

    await this.mailerService.sendMail({
      to: to,
      subject: subject,
      html: html,
    });
  }

  async sendEmail(
    email: string,
    subject: string,
    html: string,
    isHtml: boolean = true,
  ) {
    const mailOptions: any = {
      to: email,
      subject: subject,
    };

    if (isHtml) {
      mailOptions.html = html;
    } else {
      mailOptions.text = html;
    }

    await this.mailerService.sendMail(mailOptions);
  }
}
