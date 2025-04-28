const db = require('../config/db');


exports.listAllRequest = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM request ORDER BY request_date DESC');
        res.status(200).json({ message: "Fetch requests successfully", data: rows });
    } catch (error) {
        console.error('Error listing all requests:', error);
        res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
    }
};

exports.readRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
    } catch (error) {
        
    }
}