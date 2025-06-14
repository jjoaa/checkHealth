import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { 
  importBulkData, 
  connectDB, 
  closeConnection,
  getCustomData,
  updateCustomData,
  deleteCustomData,
  getHospitalData,
  updateHospitalData,
  deleteHospitalData,
  getDataByDate
} from './dbConnection.js';

dotenv.config();

const app = express();
const port = process.env.PORT;

// Middleware
app.use(cors());  // 브라우저의 CORS 요청 허용
app.use(express.json());  // JSON 요청 처리
app.use(express.static('../list'));  // list 폴더의 정적 파일 제공


// 커스텀 데이터 API 엔드포인트
app.get('/api/custom-data', async (req, res) => {
    try {
        const data = await getCustomData();
        res.json(data);
    } catch (error) {
        console.error('Error getting custom data:', error);
        res.status(500).json({ error: '데이터 조회 중 오류가 발생했습니다.' });
    }
});

app.post('/api/custom-data', async (req, res) => {
    try {
        const data = req.body;
        await updateCustomData(data);
        res.json({ success: true, message: '데이터가 성공적으로 저장되었습니다.' });
    } catch (error) {
        console.error('Error updating custom data:', error);
        res.status(500).json({ error: '데이터 저장 중 오류가 발생했습니다.' });
    }
});

app.delete('/api/custom-data/:date', async (req, res) => {
    try {
        const { date } = req.params;
        await deleteCustomData(date);
        res.json({ success: true, message: '데이터가 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('Error deleting custom data:', error);
        res.status(500).json({ error: '데이터 삭제 중 오류가 발생했습니다.' });
    }
});

// 병원 데이터 API 엔드포인트
app.get('/api/hospital-data', async (req, res) => {
    try {
        const data = await getHospitalData();
        res.json(data);
    } catch (error) {
        console.error('Error getting hospital data:', error);
        res.status(500).json({ error: '데이터 조회 중 오류가 발생했습니다.' });
    }
});

app.post('/api/hospital-data', async (req, res) => {
    try {
        const { date, hospital } = req.body;

        if (!date || !hospital) {
            return res.status(400).json({ error: '날짜와 병원 정보를 모두 입력해야 합니다.' });
        }

        await updateHospitalData(date, hospital);
        res.json({ success: true, message: '데이터가 성공적으로 저장되었습니다.' });
    } catch (error) {
        console.error('Error updating hospital data:', error);
        res.status(500).json({ error: '데이터 저장 중 오류가 발생했습니다.' });
    }
});

app.delete('/api/hospital-data/:date', async (req, res) => {
    try {
        const { date } = req.params;
        await deleteHospitalData(date);
        res.json({ success: true, message: '데이터가 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('Error deleting hospital data:', error);
        res.status(500).json({ error: '데이터 삭제 중 오류가 발생했습니다.' });
    }
});

// 기존 데이터 저장 API 엔드포인트
app.post('/api/import-data', async (req, res) => {
    try {
        const dataArray = req.body;
        if (!Array.isArray(dataArray)) {
            return res.status(400).json({ error: '데이터는 배열 형태여야 합니다.' });
        }
        await importBulkData(dataArray);
        res.json({ success: true, message: '데이터가 성공적으로 저장되었습니다.' });
    } catch (error) {
        console.error('Error importing data:', error);
        res.status(500).json({ error: '데이터 저장 중 오류가 발생했습니다.' });
    }
});

// XML 데이터 저장 엔드포인트
app.post('/api/xml-data', async (req, res) => {
    console.log('Received XML data request');
    try {
        const xmlData = req.body;
        console.log('Received data:', xmlData);
        
        if (!Array.isArray(xmlData)) {
            throw new Error('Invalid data format: expected an array');
        }
        
        // 각 날짜별 데이터를 customData 형식으로 변환하여 저장
        for (const entry of xmlData) {
            const { date, records } = entry;
            
            // customData 형식으로 변환
            const customEntries = records.map(record => ({
                label: record.label,
                value: record.unit ? `${record.value} ${record.unit}` : record.value
            }));

            // XML 소스로 저장 (병원 정보는 null로 시작)
            await updateCustomData(date, null, customEntries, 'xml');
        }
        console.log('XML data saved successfully to customData collection');       
        res.json({ success: true, message: 'XML data saved successfully to customData' });
    } catch (error) {
        console.error('Error saving XML data:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error',
            details: error.stack
        });
    }
});

// 병원 정보만 업데이트하는 엔드포인트
app.post('/api/update-hospital', async (req, res) => {
    try {
        const { date, hospital } = req.body;
        
        if (!date || !hospital) {
            return res.status(400).json({ 
                success: false, 
                error: '날짜와 병원 정보가 필요합니다.' 
            });
        }
        
        // 기존 데이터 조회
        const existingData = await getDataByDate(date);
        
        if (!existingData) {
            await closeConnection();
            return res.status(404).json({
                success: false,
                error: '해당 날짜의 데이터를 찾을 수 없습니다.'
            });
        }

        try {
            // XML 데이터인 경우 병원 정보가 null일 때만 업데이트 가능
            if (existingData.source === 'xml' && existingData.hospital !== null) {
                return res.status(400).json({
                    success: false,
                    error: 'XML 데이터의 병원 정보는 최초 1회만 입력 가능합니다.'
                });
            }

            await updateCustomData(date, hospital, existingData.entries || []);
            res.json({ 
                success: true, 
                message: '병원 정보가 성공적으로 업데이트되었습니다.' 
            });
        } catch (error) {
            if (error.message.includes('XML 데이터는 수정할 수 없습니다')) {
                res.status(400).json({
                    success: false,
                    error: error.message
                });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error updating hospital:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error' 
        });
    }
});

// 서버 시작 시 MongoDB 연결 후 시작
connectDB().then(() => {
    console.log('MongoDB 연결 완료');
    app.listen(port, () => {
        console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
    });
}).catch(err => {
    console.error('MongoDB 연결 실패:', err);
    process.exit(1);
});

// 선택: 서버 종료 시 연결 닫기
process.on('SIGINT', async () => {
    console.log('서버 종료 중... DB 연결 닫는 중');
    await closeConnection();
    process.exit(0);
});
