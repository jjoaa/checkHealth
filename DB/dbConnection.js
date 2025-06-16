import pkg from 'mongodb';
import dotenv from 'dotenv';

dotenv.config(); // .env 파일 로드
const { MongoClient } = pkg;
const uri = process.env.MONGODB_URI; // ✅ 이 값이 .env에서 읽힘
const dbName = process.env.MONGODB_DBNAME || 'healthData'; // 선택적

let client = null;
let db = null;

async function connectDB() {
    if (client) return db;

    try {
        client = await MongoClient.connect(uri); // ✅ 수정됨
        console.log('MongoDB connection successful');
        db = client.db(dbName);
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

async function closeConnection() {
    if (client) {
        await client.close();
        client = null;
        db = null;
    }
}

// Custom data operations
async function getCustomData() {
    const db = await connectDB();
    const collection = db.collection('customData');
    const result = await collection.find({}).toArray();
    return result;
}

async function updateCustomData(data) {
    const db = await connectDB();
    const collection = db.collection('customData');
    
    const { date, hospital, entries, source = 'manual' } = data;
    
    // 기존 데이터 확인
    const existingData = await collection.findOne({ date });
    
    // XML 데이터 처리
    if (existingData?.source === 'xml') {
        // 기존 XML 데이터의 병원 정보가 null인 경우에만 업데이트 허용
        if (existingData.hospital === null && hospital !== null) {
            await collection.updateOne(
                { date },
                { 
                    $set: { 
                        hospital,
                        updatedAt: new Date()
                    } 
                }
            );
            return;
        }
        // 그 외의 모든 수정 시도는 거부
        throw new Error('XML 데이터는 수정할 수 없습니다. 병원 정보는 최초 1회만 입력 가능합니다.');
    }

    // 새로운 XML 데이터 저장
    if (source === 'xml') {
        await collection.updateOne(
            { date },
            { 
                $set: { 
                    date, 
                    hospital: null, // 병원 정보는 항상 null로 시작
                    entries,
                    source: 'xml',
                    updatedAt: new Date()
                } 
            },
            { upsert: true }
        );
        return;
    }

    // 일반 수동 입력 데이터 처리
    await collection.updateOne(
        { date },
        { 
            $set: { 
                date, 
                hospital, 
                entries,
                source: 'manual',
                updatedAt: new Date()
            } 
        },
        { upsert: true }
    );
}

async function deleteCustomData(date, label) {
    const db = await connectDB();
    const collection = db.collection('customData');
    
    // XML 데이터는 삭제 불가
    const existingData = await collection.findOne({ date });
    if (existingData?.source === 'xml') {
        throw new Error('XML 데이터는 삭제할 수 없습니다.');
    }
    
    if (label) {
        // 일반 데이터의 특정 항목 삭제
        await collection.updateOne(
            { date },
            { $pull: { entries: { label } } }
        );
    } else {
        // 일반 데이터 전체 삭제
        await collection.deleteOne({ date });
    }
}

// Hospital data operations
async function getHospitalData() {
    const db = await connectDB();
    const collection = db.collection('hospitalData');
    const result = await collection.find({}).toArray();
        return result.reduce((acc, item) => {
        if (item.date && item.hospital !== undefined) {
            acc[item.date] = item.hospital;
        }
        return acc;
    }, {});
}

async function updateHospitalData(date, hospital) {
    const db = await connectDB();
    const collection = db.collection('hospitalData');
    
    await collection.updateOne(
        { date },
        { $set: { date, hospital } },
        { upsert: true }
    );
}

async function deleteHospitalData(date) {
    const db = await connectDB();
    const collection = db.collection('hospitalData');
    await collection.deleteOne({ date });
}

// Bulk data import from input.html
async function importBulkData(dataArray) {
    const db = await connectDB();
    const customCollection = db.collection('customData');
    const hospitalCollection = db.collection('hospitalData');

    try {
        // Process each entry
        for (const entry of dataArray) {
            const { date, hospital, entries } = entry;

            // Save hospital data if exists
            if (hospital) {
                await hospitalCollection.updateOne(
                    { date },
                    { $set: { date, hospital } },
                    { upsert: true }
                );
            }

            // Save custom data
            if (entries && entries.length > 0) {
                await customCollection.updateOne(
                    { date },
                    { $set: { date, hospital, entries } },
                    { upsert: true }
                );
            }
        }
        return true;
    } catch (error) {
        console.error('Error importing bulk data:', error);
        throw error;
    }
}

// Get all data for a specific date
async function getDataByDate(date) {
    const db = await connectDB();
    const customCollection = db.collection('customData');
    const hospitalCollection = db.collection('hospitalData');

    try {
        const [customData, hospitalData] = await Promise.all([
            customCollection.findOne({ date }),
            hospitalCollection.findOne({ date })
        ]);

        return {
            date,
            hospital: hospitalData?.hospital || customData?.hospital,
            entries: customData?.entries || []
        };
    } catch (error) {
        console.error('Error getting data by date:', error);
        throw error;
    }
}

export {
    connectDB,
    closeConnection,
    getCustomData,
    updateCustomData,
    deleteCustomData,
    getHospitalData,
    updateHospitalData,
    deleteHospitalData,
    importBulkData,
    getDataByDate
}; 
