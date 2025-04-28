const db = require('../config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Helper function: sign JWT with Promise
const signToken = (payload) => {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, process.env.SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) reject(err);
            else resolve(token);
        });
    });
};

exports.login = async (req, res) => {
    try {
        const { no_card_id, phone } = req.body;

        // Check if user exists and select fname, lname
        const [rows] = await db.execute(
            'SELECT uid, no_card_id, phone, fname, lname FROM user WHERE no_card_id = ?',
            [no_card_id]
        );

        if (rows.length === 0 || rows[0].phone !== phone) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];

        // Prepare JWT payload including fname and lname
        const payload = {
            id: user.uid,
            no_card_id: user.no_card_id,
            phone: user.phone,
            fname: user.fname,
            lname: user.lname // Include lname in payload
        };

        // Generate token
        const token = await signToken(payload);

        res.status(200).json({
            message: 'Login successful',
            payload,
            token
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.currentUser = async (req, res) => {
    try {
        const userId = req.user.id; // <-- ใช้ข้อมูลที่ authCheck ทำไว้แล้ว

        const [rows] = await db.execute(
            'SELECT uid, no_card_id, phone, fname, lname FROM user WHERE uid = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const currentUser = rows[0];

        res.status(200).json({ currentUser });
    } catch (error) {
        console.error('CurrentUser Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // ตรวจสอบผู้ดูแลระบบจากฐานข้อมูล (สมมติว่ามีตารางชื่อ 'admin')
        const [rows] = await db.execute(
            'SELECT admin_id, username, password FROM admin WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        const admin = rows[0];

        // เปรียบเทียบรหัสผ่าน (ควรใช้ bcrypt ในการ Hash รหัสผ่านจริง)
        if (password !== admin.password) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        // เตรียม JWT payload สำหรับผู้ดูแลระบบ
        const payload = {
            adminId: admin.admin_id,
            username: admin.username,
            isAdmin: true // เพิ่ม flag เพื่อระบุว่าเป็นผู้ดูแลระบบ
        };

        // สร้าง token
        const token = await signToken(payload);

        res.status(200).json({
            message: 'Admin login successful',
            payload,
            token
        });

    } catch (error) {
        console.error('Admin Login Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.currentAdmin = async (req, res) => {
    try {
        const adminId = req.admin.adminId; // ดึง adminId จากข้อมูลที่ adminCheck แนบไว้

        const [rows] = await db.execute(
            'SELECT admin_id, username, role, fname, lname FROM admin WHERE admin_id = ?',
            [adminId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const currentAdmin = rows[0];

        res.status(200).json({ currentAdmin });
    } catch (error) {
        console.error('Current Admin Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
