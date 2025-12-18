// module.exports = {
//   apps: [
//     {
//       name: "API pgt:3003",
//       script: "npm run start:dev",
//       watch: false, // ตั้งค่านี้เป็น false เพื่อความเสถียร เปลี่ยนเป็น true หากคุณต้องการเปิดใช้งานในอนาคต
//       autorestart: true, // เริ่มแอปพลิเคชันใหม่โดยอัตโนมัติหากเกิดความล้มเหลว
//       max_restarts: 5, // จำนวนครั้งสูงสุดของการเริ่มใหม่ในกรณีที่เกิดความล้มเหลว
//       restart_delay: 5000, // การหน่วงเวลาระหว่างการเริ่มใหม่ (เป็นมิลลิวินาที)
//       env: {
//         NODE_ENV: "development",
//         // ตัวแปรสภาพแวดล้อมอื่นๆ สำหรับการพัฒนา
//       },
//       env_production: {
//         NODE_ENV: "production",
//         // ตัวแปรสภาพแวดล้อมอื่นๆ สำหรับการผลิต
//       }
//     }
//   ],
// };

module.exports = {
  apps: [
    {
      name: "API pgt:3003",
      script: "npm run start:dev",
      watch: false, // ปิด watch เพื่อลดการรีสตาร์ทจากไฟล์เปลี่ยนแปลง
      autorestart: true, // เปิดการรีสตาร์ทอัตโนมัติเมื่อแครช
      max_restarts: 10, // เพิ่มจำนวนครั้งการรีสตาร์ทเป็น 10 เพื่อให้มีโอกาสกู้คืนมากขึ้น
      restart_delay: 10000, // เพิ่มดีเลย์เป็น 10 วินาที เพื่อให้ระบบมีเวลาคลายโหลด
      max_memory_restart: "1G", // รีสตาร์ทหากใช้หน่วยความจำเกิน 1GB เพื่อป้องกัน memory leak
      kill_timeout: 3000, // รอ 3 วินาทีก่อนฆ่าโปรเซส เพื่อให้ปิดอย่างสมบูรณ์
      wait_ready: true, // รอจนกว่าแอปจะส่งสัญญาณว่าเริ่มทำงานสมบูรณ์
      listen_timeout: 10000, // รอ 10 วินาทีสำหรับการเริ่มต้นเซิร์ฟเวอร์
      instances: 1, // ใช้ 1 instance เพื่อลดการแข่งขันทรัพยากร (ปรับตามจำนวน CPU หากจำเป็น)
      env: {
        NODE_ENV: "development",
        PORT: 3003, // ระบุพอร์ตให้ชัดเจน
        // ตัวแปรสภาพแวดล้อมอื่นๆ สำหรับการพัฒนา
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3003,
        // ตัวแปรสภาพแวดล้อมอื่นๆ สำหรับการผลิต
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss", // รูปแบบวันที่ในログ
      error_file: "./logs/error.log", // ไฟล์เก็บ error logs
      out_file: "./logs/out.log", // ไฟล์เก็บ output logs
      merge_logs: true, // รวม logs จากทุก instances
      time: true, // เพิ่ม timestamp ใน logs เพื่อช่วย debug
    },
  ],
};
