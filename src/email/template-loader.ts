import * as fs from 'fs';
import * as path from 'path';

export type TemplateName =
  | 'reset-password'
  | 'register-success'
  | 'confirm-register'
  | 'alert-to-admin';

export function loadTemplate(name: TemplateName): string {
  const fileName = `${name}.html`;

  const distPath = path.join(
    process.cwd(),
    'dist',
    'email',
    'templates',
    fileName,
  );
  const srcPath = path.join(
    process.cwd(),
    'src',
    'email',
    'templates',
    fileName,
  );

  // อ่านจาก dist ก่อน
  try {
    return fs.readFileSync(distPath, 'utf8');
  } catch (e1) {
    // fallback ไป src
    try {
      return fs.readFileSync(srcPath, 'utf8');
    } catch (e2) {
      throw new Error(
        `ไม่พบไฟล์ template ${fileName} ที่ dist หรือ src\n` +
          `distPath: ${distPath}\n` +
          `srcPath: ${srcPath}\n` +
          `e1: ${(e1 as Error).message}\n` +
          `e2: ${(e2 as Error).message}`,
      );
    }
  }
}

export function renderTemplate(
  html: string,
  vars: Record<string, string | number | undefined>,
): string {
  let out = html;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(
      new RegExp(`{{\\s*${key}\\s*}}`, 'g'),
      String(value ?? ''),
    );
  }
  return out;
}
