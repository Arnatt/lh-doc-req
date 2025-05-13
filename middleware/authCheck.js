const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.authCheck = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided or invalid format' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SECRET);
    console.log("Decoded User Token:", decoded);

    req.user = decoded; // Attach decoded user info to request

    // ตรวจสอบ user ในฐานข้อมูล
    const [rows] = await db.execute(
      'SELECT uid, no_card_id FROM user WHERE uid = ? AND no_card_id = ?',
      [decoded.id, decoded.no_card_id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: 'Forbidden: User not found or unauthorized' });
    }

    next();
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
    console.log("Decoded Admin Token:", decoded);

    req.admin = decoded; // Attach decoded admin info to request

    // ตรวจสอบว่ามี isAdmin: true ใน token หรือ role เป็น 'admin'
    if (!decoded.isAdmin && decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }

    next();
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
