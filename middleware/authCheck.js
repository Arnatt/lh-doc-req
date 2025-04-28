const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.authCheck = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Check if Authorization header is provided AND is a string
        if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized: No token provided or invalid format' });
        }

        const token = authHeader.split(' ')[1];

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.SECRET);
        req.user = decoded; // Attach decoded user info to request

        // Check user existence in DB
        const [rows] = await db.execute(
            'SELECT uid, no_card_id FROM user WHERE uid = ? AND no_card_id = ?',
            [decoded.id, decoded.no_card_id]
        );

        if (rows.length === 0) {
            return res.status(403).json({ message: 'Forbidden: User not found or unauthorized' });
        }

        next(); // Authenticated, proceed to next middleware/controller
    } catch (error) {
        console.error('Authentication Error:', error.name, error.message);

        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }

        return res.status(500).json({ message: 'Internal Server Error during authentication' });
    }
};

exports.adminCheck = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized: No admin token provided or invalid format' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.SECRET);
        req.admin = decoded; // Attach decoded admin info to request

        // ตรวจสอบว่ามี isAdmin เป็น true ใน payload หรือไม่
        if (!req.admin.isAdmin) {
            return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
        }

        next(); // เป็น Admin แล้ว ส่งต่อไป
    } catch (error) {
        console.error('Admin Authentication Error:', error.name, error.message);

        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Unauthorized: Admin token expired' });
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Unauthorized: Invalid admin token' });
        }

        return res.status(500).json({ message: 'Internal Server Error during admin authentication' });
    }
};
