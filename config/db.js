const mysql = require('mysql2/promise');


// สร้างการเชื่อมต่อกับฐานข้อมูล MariaDB
const db = mysql.createPool({
    host: 'localhost',     // ชื่อ host ของ MariaDB
    port: 3306,           // พอร์ตที่ใช้เชื่อมต่อ
    user: 'root', // ชื่อ user ที่ใช้เชื่อม
    password: 'password', // รหัสผ่าน user
    database: 'lh_doc_req', // ชื่อฐานข้อมูล
    waitForConnections: true,
    connectionLimit: 10,   // จำกัดจำนวนการเชื่อมสูงสุด
    queueLimit: 0
  });

module.exports = db;
