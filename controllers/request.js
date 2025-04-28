const db = require('../config/db');

exports.createRequest = async (req, res) => {
    let connection;
    try {

        connection = await db.getConnection(); // ดึง connection จาก pool
        await connection.beginTransaction(); // เริ่ม transaction
        const {
            related_role,
            related_patient_id,
            related_patient_fname,
            related_patient_lname,
            patient_phone,
            company_name,
            doc_type,
            from_date,
            to_date,
            purpose
        } = req.body;

        const uid = req.user.id;

        // 1. สร้าง request
        const [requestResult] = await connection.execute(
            'INSERT INTO request (request_date, status, uid) VALUES (NOW(), ?, ?)',
            ['รอดำเนินการ', uid]
        );
        const req_id = requestResult.insertId;

        // 2. สร้าง document_main
        const [docMainResult] = await connection.execute(
            'INSERT INTO document_main (req_id, uid) VALUES (?, ?)', [req_id, uid]
        );        
        const doc_id = docMainResult.insertId;

        // 3. สร้าง document_detail_request
        await connection.execute(
            `INSERT INTO document_detail_request (
                doc_id, related_role, related_patient_id, related_patient_fname, related_patient_lname, patient_phone, company_name, doc_type, from_date, to_date, purpose ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?)`,
                [
                    doc_id,
                    related_role,
                    related_patient_id,
                    related_patient_fname,
                    related_patient_lname,
                    patient_phone,
                    company_name,
                    doc_type,
                    from_date,
                    to_date,
                    purpose
                ]
        );
        await connection.commit();
        res.status(201).json({ message: 'Document request submitted successfully.' });
    } catch (error) {
        if (connection) await connection.rollback(); // มีข้อผิดพลาด → rollback
        console.log(error);
        res.status(500).json({ message: 'Server Error' });       
    } finally {
        if (connection) connection.release(); // คืน connection กลับไปที่ pool
    }
}

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
        console.log(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


exports.readRequest = async (req, res) => {
    let connection;
    try {
        const { req_id } = req.params;
        const uid = req.user.id; // จาก JWT authCheck

        connection = await db.getConnection();

        // เช็คว่า request เป็นของ user หรือไม่
        const [reqRows] = await connection.execute(
            'SELECT * FROM request WHERE req_id = ? AND uid = ?',
            [req_id, uid]
        );

        if(reqRows.length === 0) {
            return res.status(404).json({ message: 'Request not found or not authorized.' })
        }

        //ดึงข้อมูล document_main
        const [docMainRows] = await connection.execute(
            'SELECT * FROM document_main WHERE req_id = ?', [req_id]
        )

        if(docMainRows.length === 0) {
            return res.status(404).json({ message: 'Document main not found.'});
        }
        const doc_id = docMainRows[0].doc_id;

        //ดึงข้อมูล document_detail_request
        const [detailRows] = await connection.execute(
            'SELECT * FROM document_detail_request WHERE doc_id = ?', [doc_id]
        );

        res.status(200).json({
            request: reqRows[0],
            document_main: docMainRows[0],
            document_detail: detailRows[0] || null
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server Error' });
    } finally {
        if (connection) connection.release();
    }
}

exports.deleteRequest = async (req, res) => {
    let connection;
    try {
        const { req_id } = req.params;
        const uid = req.user.id; // ดึงจาก token JWT

        connection = await db.getConnection();
        await connection.beginTransaction();

        // ตรวจสอบว่า request นี้มีอยู่ และเป็นของผู้ใช้ที่ login มาหรือไม่
        const [reqRows] = await connection.execute(
            'SELECT req_id FROM request WHERE req_id = ? AND uid = ?',
            [req_id, uid]
        );

        if (reqRows.length === 0) {
            await connection.rollback();
            return res.status(403).json({ message: 'You are not authorized to delete this request or it does not exist.' });
        }
        
        // หา doc_id จาก document_main ที่เกี่ยวข้องกับ req_id นี้
        const [docRows] = await connection.execute(
            'SELECT doc_id FROM document_main WHERE req_id = ?', [req_id]
        );

        if (docRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Document not found for this request.' });
        }

        const doc_id = docRows[0].doc_id;

        // delete from document_detail_request
        await connection.execute(
            'DELETE FROM document_detail_request WHERE doc_id = ?', [doc_id]
        );

        // delete from document_main
        await connection.execute(
            'DELETE FROM document_main WHERE doc_id = ?', [doc_id]
        );

        // delete from request
        await connection.execute(
            'DELETE FROM request WHERE req_id = ?', [req_id]
        );

        await connection.commit();
        res.status(200).json({ message: 'Request deleted successfully' });


    } catch (error) {
        if (connection) await connection.rollback();
        console.log(error);
        res.status(500).json({ message: 'Server Error' });
    } finally {
        if (connection) connection.release();
    }
}

// exports.listAllRequest = async (req, res) => {
//     try {
//         const { count } = req.params;
        
//         const [rows] = await db.promise().execute(
//             'SELECT * FROM request ORDER BY request_date DESC LIMIT ?', [parseInt(count)]
//         )

//         res.status(200).json({
//             message: "Fetch requests successfully",
//             data: rows
//         });

//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// }