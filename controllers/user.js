const db = require('../config/db');

exports.getUserProfile = async (req, res) => {
    try {
        const uid = req.user.id; // ดึง user id จาก JWT ที่แนบมากับ req

        const [rows] = await db.execute(
            `SELECT
                uid,
                fname,
                lname,
                title,

                house_no,
                village_no,
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
        const uid = req.user.id;
        console.log('Count:', count, 'UID:', uid);

        const [rows] = await db.execute(
            `
            SELECT
                r.req_id,
                r.request_date,
                GROUP_CONCAT(DISTINCT ddr.doc_type SEPARATOR ', ') AS requested_documents,
                GROUP_CONCAT(DISTINCT CONCAT(ddr.related_patient_fname, ' ', ddr.related_patient_lname) SEPARATOR '; ') AS related_patients,
                r.status,
                r.receive_date
            FROM
                request r
            LEFT JOIN
                document_main dm ON r.req_id = dm.req_id
            LEFT JOIN
                document_detail_request ddr ON dm.doc_id = ddr.doc_id
            WHERE
                r.uid = ?
            GROUP BY
                r.req_id, r.request_date, r.status, r.receive_date
            ORDER BY
                r.request_date DESC
            LIMIT ?;
            `,
            [uid, parseInt(count)]
        );

        res.status(200).json({
            message: "Fetch user-specific requests successfully",
            data: rows
        });

    } catch (error) {
        console.error('Error fetching user requests:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const uid = req.user.id;

        const {
            house_no,
            village_no,
            alley,
            street,
            subdistrict,
            district,
            province,
            postal_code,
            phone
        } = req.body;

        const [result] = await db.execute(
            `UPDATE user
             SET house_no = ?, village_no = ?, alley = ?, street = ?,
                 subdistrict = ?, district = ?, province = ?, postal_code = ?, phone = ?
             WHERE uid = ?`,
            [
                house_no,
                village_no,
                alley,
                street,
                subdistrict,
                district,
                province,
                postal_code,
                phone,
                uid
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found or no changes made.' });
        }

        res.status(200).json({ message: 'User profile updated successfully.' });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server Error' });
    }
}