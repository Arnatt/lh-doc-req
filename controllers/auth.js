const db = require('../config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();



exports.login = async (req, res) => {
    try {
        const { no_card_id, phone } = req.body;

        // check in database
        const [rows] = await db.execute(
            'SELECT * FROM user WHERE no_card_id = ?',
            [no_card_id]
        );

        if (rows.length === 0) {
            return res.status(400).json({ message: 'User not found or not enabled' });
        }

        // check password
        if (rows[0].phone !== phone) {
            return res.status(400).json({ message: 'Incorrect phone no.' });
        }

        const user = rows[0]; // get the first user

        // JWT PAYLOAD
        const payload = {
            id: user.uid,
            no_card_id: user.no_card_id,
            phone: user.phone
        };

        //  Create JWT token
        jwt.sign(payload, process.env.SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) {
                return res.status(500).json({ message: 'Token generation failed' });
            }

            res.status(200).json({
                message: 'Login successful',
                payload,
                token
            });
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server Error' });       
        
    }
}

exports.loginAdmin = async (req, res) => {
    try {
        res.send('Admin Login Page - Controller');
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server Error' });       
        
    }
}

exports.currentUser = async (req, res) => {
    try {
        res.send('User Login Page - Controller');
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server Error' });       
        
    }
}