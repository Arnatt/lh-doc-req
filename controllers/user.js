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

exports.submitRequest = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            requesterType,
            patientDetails,
            selectedDocuments,
            requestDateRange,
            purpose,
            otherPurpose,
            companyName,
            relativeRelation,
        } = req.body;
        console.log('Request body:', req.body);

        const uid = req.user.id;

        // 1. Insert into request table
        const [requestResult] = await connection.execute(
            `INSERT INTO request (uid, request_date, status)
             VALUES (?, NOW(), 'กำลังดำเนินการ')`,
            [uid]
        );
        const reqId = requestResult.insertId;

        // 2. Insert into document_main
        const [docMainResult] = await connection.execute(
            `INSERT INTO document_main (req_id, uid)
             VALUES (?, ?)`,
            [reqId, uid]
        );
        const docId = docMainResult.insertId;

        // 3. Combine document labels
        const combinedDocType = Array.isArray(selectedDocuments)
            ? selectedDocuments.join(', ')
            : String(selectedDocuments);

        const fromDate = requestDateRange?.from || null;
        const toDate = requestDateRange?.to || null;

        let requestPurpose = purpose;
        if (purpose === 'other') {
            requestPurpose = otherPurpose || 'อื่นๆ';
        }

        const relatedRole =
            requesterType === 'relative' ? 'ญาติผู้ป่วย' :
                (requesterType === 'company' ? 'ตัวแทนบริษัท' :
                    (requesterType === 'patient' ? 'ผู้ป่วย' : 'อื่นๆ'));

        const relatedIsValue = requesterType === 'relative' ? (relativeRelation || null) : null;

        await connection.execute(
            `INSERT INTO document_detail_request
            (doc_id, related_role, related_is, related_patient_id, related_patient_fname, related_patient_lname, patient_phone, company_name, doc_type, from_date, to_date, purpose)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                docId,
                relatedRole,
                relatedIsValue,
                patientDetails?.idCard || null,
                patientDetails?.name ? patientDetails.name.split(' ')[0] : null,
                patientDetails?.name ? patientDetails.name.split(' ').slice(1).join(' ') : null,
                patientDetails?.phone || null,
                companyName || null,
                combinedDocType,
                fromDate,
                toDate,
                requestPurpose // ใช้ requestPurpose ที่ถูกปรับแล้ว
            ]
        );

        await connection.commit();
        res.status(201).json({ message: 'บันทึกคำร้องขอเอกสารสำเร็จ', requestId: reqId });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error submitting request:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกคำร้องขอเอกสาร' });
    } finally {
        if (connection) connection.release();
    }
};
