const db = require('../config/db');

exports.getUserProfile = async (req, res) => {
    try {
        const uid = req.user.id; // ดึง user id จาก JWT ที่แนบมากับ req

        const [rows] = await db.promise().execute(
            `SELECT
                uid,
                fname,
                lname,
                gender,
                house_no,
                alley,
                street,
                subdistrict,
                district,
                province,
                postal_code,
                no_card_id,
                phone
            FROM user
            WHERE uid = ?`,
            [uid]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User profile not found.' });
        }

        res.status(200).json(rows[0]); // ส่งข้อมูลผู้ใช้กลับไป
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.listRequest = async (req, res) => {
    try {
        const { count } = req.params;
        const uid = req.user.id; // <--- ดึง user id จาก JWT

        const [rows] = await db.promise().execute(
            'SELECT * FROM request WHERE uid = ? ORDER BY request_date DESC LIMIT ?',
            [uid, parseInt(count)]
        );

        res.status(200).json({
            message: "Fetch user-specific requests successfully",
            data: rows
        });

    } catch (error) {
        console.error('Error fetching user requests:', error); // เพิ่ม console.error เพื่อดู Error ใน Log
        res.status(500).json({ message: 'Server Error' });
    }
};