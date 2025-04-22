const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.authCheck = async (req, res, next) => {
    try { 
        const headerToken = req.headers.authorization;
        if (!headerToken) {
            return res.status(401).json({ message: "No Token, Authorization" });
        }

        const token = headerToken.split(" ")[1];
        const decode = jwt.verify(token, process.env.SECRET);
        req.user = decode;

        // check user in db
        const [rows] = await db.execute(
            'SELECT * FROM user WHERE uid = ? AND no_card_id = ?',
            [decode.id, decode.no_card_id]
        );

        if (rows.length === 0) {
            return res.status(403).json({ message: 'User not found or unauthorized' });
        }

        next(); // ผ่านการตรวจสอบ ส่งต่อไปยัง controller ถัดไป
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// exports.adminCheck = async (req, res) => {

// }