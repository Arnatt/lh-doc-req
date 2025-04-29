const db = require('../config/db');


exports.listAllRequest = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT
                r.req_id,
                r.request_date,
                r.receive_date,
                r.status,
                r.uid,
                u.fname,
                u.lname,
                ddr.doc_type
            FROM
                request r
            LEFT JOIN
                user u ON r.uid = u.uid
            LEFT JOIN
                document_main dm ON r.req_id = dm.req_id
            LEFT JOIN
                document_detail_request ddr ON dm.doc_id = ddr.doc_id
            ORDER BY
                r.request_date DESC
        `);
        res.status(200).json({ message: "Fetch requests successfully", data: rows });
    } catch (error) {
        console.error('Error listing all requests with doc_type:', error);
        res.status(500).json({ message: 'Failed to fetch requests with doc_type', error: error.message });
    }
};

exports.readRequest = async (req, res) => {
    try {
        const requestId = req.params.id;

        // Query เพื่อดึงข้อมูลคำขอหลัก พร้อมชื่อผู้ร้องขอ และข้อมูลที่เกี่ยวข้องกับเอกสาร
        const [requestRows] = await db.execute(
            `SELECT
                r.req_id,
                r.request_date,
                r.receive_date,
                r.status,
                u.fname AS requester_fname,
                u.lname AS requester_lname
            FROM
                request r
            LEFT JOIN
                user u ON r.uid = u.uid
            WHERE
                r.req_id = ?`,
            [requestId]
        );

        if (requestRows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const requestData = requestRows[0];

        // Query เพื่อดึงข้อมูลรายละเอียดเอกสาร (ชื่อเอกสาร, ชื่อผู้ป่วย, วันที่เกี่ยวข้อง)
        const [docDetailsRows] = await db.execute(
            `SELECT
                ddr.docd_id AS doc_detail_id,
                ddr.related_patient_fname,
                ddr.related_patient_lname,
                ddr.from_date,
                ddr.to_date,
                ddr.doc_type AS document_name
            FROM
                document_detail_request ddr
            LEFT JOIN
                document_main dm ON ddr.doc_id = dm.doc_id
            WHERE
                dm.req_id = ?`,
            [requestId]
        );

        const docDetailsData = docDetailsRows;

        res.status(200).json({
            message: 'Fetch request details successfully',
            data: {
                requestInfo: { // แยกส่วนข้อมูลหลักของคำขอ
                    requester_fname: requestData.requester_fname,
                    requester_lname: requestData.requester_lname,
                    request_date: requestData.request_date,
                },
                documentDetails: docDetailsData, // รายละเอียดเอกสารแต่ละรายการ
                status: requestData.status,
                receiveDate: requestData.receive_date,
            },
        });

    } catch (error) {
        console.error('Error reading request details:', error);
        res.status(500).json({ message: 'Failed to fetch request details', error: error.message });
    }
};

exports.updateRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const { status, receive_date } = req.body;

        // ตรวจสอบว่ามี status หรือ receive_date ที่ต้องการอัปเดตหรือไม่
        if (!status && !receive_date) {
            return res.status(400).json({ message: 'Please provide status or receive_date to update' });
        }

        // สร้างส่วนของ SET ใน SQL Query แบบ Dynamic
        const updates = [];
        const values = [];
        if (status) {
            updates.push('status = ?');
            values.push(status);
        }

        if (receive_date) {
            updates.push('receive_date = ?');
            values.push(receive_date);
        }

        values.push(requestId); // เพิ่ม req_id สำหรับ WHERE clause
        // สร้าง SQL Query สำหรับการอัปเดต
        const sql = `UPDATE request SET ${updates.join(', ')} WHERE req_id = ?`;

        // Execute SQL Query
        const [result] = await db.execute(sql, values);

        // ตรวจสอบว่ามีการอัปเดตข้อมูลหรือไม่
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Request not found or no changes applied' });
        }

        // ดึงข้อมูลคำร้องที่อัปเดตแล้ว
        const [updatedRows] = await db.execute('SELECT * FROM request WHERE req_id = ?', [requestId]);

        res.status(200).json({ message: 'Request updated successfully', data: updatedRows[0] });

    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ message: 'Failed to update request', error: error.message });
    }
}