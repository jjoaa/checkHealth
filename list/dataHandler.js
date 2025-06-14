import { dataMap, allDates, mergeBloodPressure } from './xmlLoader.js';
import { renderTable } from './tableRenderer.js';

export const userEnteredLabels = new Set();
export const userEnteredCells = new Set();
export const hospitalByDate = {};

const API_BASE_URL = 'http://localhost:3001/api';

// 기존 함수들을 새로운 API 기반 구현으로 교체
export async function getCustomData() {
    try {
        const response = await fetch(`${API_BASE_URL}/custom-data`);
        if (!response.ok) throw new Error('Failed to fetch custom data');
        return await response.json();
    } catch (error) {
        console.error('Error fetching custom data:', error);
        return [];
    }
}

export async function updateCustomData(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/custom-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update custom data');
        return await response.json();
    } catch (error) {
        console.error('Error updating custom data:', error);
        throw error;
    }
}

export async function deleteCustomData(date) {
    try {
        const response = await fetch(`${API_BASE_URL}/custom-data/${date}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete custom data');
        return await response.json();
    } catch (error) {
        console.error('Error deleting custom data:', error);
        throw error;
    }
}

export async function getHospitalData() {
    try {
        const response = await fetch(`${API_BASE_URL}/hospital-data`);
        if (!response.ok) throw new Error('Failed to fetch hospital data');
        return await response.json();
    } catch (error) {
        console.error('Error fetching hospital data:', error);
        return [];
    }
}

export async function updateHospitalData(date, hospitalName) {
    try {
        const response = await fetch(`${API_BASE_URL}/update-hospital`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date, hospital: hospitalName })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update hospital data');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating hospital data:', error);
        throw error;
    }
}

export async function deleteHospitalData(date) {
    try {
        const response = await fetch(`${API_BASE_URL}/hospital-data/${date}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete hospital data');
        return await response.json();
    } catch (error) {
        console.error('Error deleting hospital data:', error);
        throw error;
    }
}

// 초기 사용자 데이터 로딩 (MongoDB → 메모리)
export async function initUserData() {
    console.log('Starting to load user data...');
    try {
        // 데이터 맵 초기화
        Object.keys(dataMap).forEach(key => delete dataMap[key]);
        allDates.clear();
        userEnteredLabels.clear();
        userEnteredCells.clear();
        Object.keys(hospitalByDate).forEach(key => delete hospitalByDate[key]);

        // 커스텀 데이터 로드
        console.log('Loading custom data...');
        const customData = await getCustomData();
        console.log('Loaded custom data:', customData);

        // 커스텀 데이터 처리
        customData.forEach(item => {
            const { date, entries, hospital, source } = item;
            if (!entries) {
                console.warn('No entries found for date:', date);
                return;
            }

            // 데이터 처리
            entries.forEach(entry => {
                const { label, value } = entry;
                if (!dataMap[label]) dataMap[label] = {};
                dataMap[label][date] = value;
                
                // XML 데이터가 아닌 경우에만 수정 가능하도록 표시
                if (source !== 'xml') {
                    userEnteredLabels.add(label);
                    userEnteredCells.add(`${label}||${date}`);
                }
            });

            // 날짜와 병원 정보 처리
            allDates.add(date);
            if (hospital) {
                hospitalByDate[date] = hospital;
            }
        });

        console.log('Data loading completed. Current state:');
        console.log('dataMap:', dataMap);
        console.log('allDates:', Array.from(allDates));
        console.log('userEnteredLabels:', Array.from(userEnteredLabels));
        console.log('userEnteredCells:', Array.from(userEnteredCells));
        console.log('hospitalByDate:', hospitalByDate);

    } catch (error) {
        console.error('Error initializing user data:', error);
        throw error;
    }
}

// 데이터 삭제 함수 수정
export async function removeFromLocalStorage(label, date) {
    try {
        // 해당 날짜의 데이터 확인
        const customData = await getCustomData();
        const existingData = customData.find(item => item.date === date);

        // XML 데이터는 삭제 불가
        if (existingData?.source === 'xml') {
            throw new Error('XML 데이터는 수정하거나 삭제할 수 없습니다.');
        }

        if (label) {
            await deleteCustomData(date, label);
        } else {
            await deleteCustomData(date);
        }

        const allCustom = await getCustomData();
        await mergeBloodPressure(allCustom);

        const stillExists = allCustom.some(e => e.date === date);
        if (!stillExists) {
            delete hospitalByDate[date];
        }

        await initUserData();  // 데이터 새로고침
    } catch (error) {
        console.error('Error removing data:', error);
        alert(error.message);  // 사용자에게 에러 메시지 표시
    }
}

// 데이터 업데이트 함수 수정
export async function updateLocalStorage(label, date, newValue) {
    try {
        // 해당 날짜의 데이터 확인
        const customData = await getCustomData();
        const existingData = customData.find(item => item.date === date);

        // XML 데이터는 수정 불가
        if (existingData?.source === 'xml') {
            throw new Error('XML 데이터는 수정하거나 삭제할 수 없습니다.');
        }

        const allCustom = await getCustomData();
        let entry = allCustom.find(e => e.date === date);
        
        if (!entry) {
            entry = { date, entries: [] };
            allCustom.push(entry);
        }

        if (label === "혈압(최고/최저)") {
            const match = newValue.match(/^(\d+)\s*\/\s*(\d+)$/);
            if (match) {
                const SBP = match[1];
                const DBP = match[2];
                
                // Update or add SBP and DBP entries
                const sbpEntry = entry.entries.find(e => e.label === "SBP");
                const dbpEntry = entry.entries.find(e => e.label === "DBP");

                if (sbpEntry) sbpEntry.value = SBP;
                else entry.entries.push({ label: "SBP", value: SBP });

                if (dbpEntry) dbpEntry.value = DBP;
                else entry.entries.push({ label: "DBP", value: DBP });
            }
        } else {
            const target = entry.entries.find(e => e.label === label);
            if (target) {
                target.value = newValue;
            } else {
                entry.entries.push({ label, value: newValue });
            }
        }

        await updateCustomData(date, entry.hospital, entry.entries);
        await mergeBloodPressure(allCustom);
        await initUserData();  // 데이터 새로고침
    } catch (error) {
        console.error('Error updating data:', error);
        alert(error.message);  // 사용자에게 에러 메시지 표시
    }
}

// 병원명 업데이트
export async function updateHospitalInLocalStorage(date, hospitalName) {
    try {
        await updateHospitalData(date, hospitalName);
        hospitalByDate[date] = hospitalName;
        
        // 테이블 새로고침
        await initUserData();
    } catch (error) {
        console.error('Error updating hospital:', error);
        throw error;
    }
}

// 병원명 삭제
export async function removeHospitalFromLocalStorage(date) {
    try {
        const allCustom = await getCustomData();
        const entry = allCustom.find(e => e.date === date);

        if (entry) {
            delete entry.hospital;
            await updateCustomData(date, null, entry.entries);
        }

        await deleteHospitalData(date);
        delete hospitalByDate[date];
    } catch (error) {
        console.error('Error removing hospital:', error);
    }
}

//XML 데이터용 병원명 로드
export async function initHospitalOnlyData() {
    try {
        const hospitalData = await getHospitalData();
        Object.assign(hospitalByDate, hospitalData);
    } catch (error) {
        console.error('Error initializing hospital data:', error);
    }
}

//병원명 저장 (XML용)
export async function saveHospitalOnly(date, hospitalName) {
    try {
        // 새로운 API 엔드포인트 사용
        const response = await fetch(`${API_BASE_URL}/update-hospital`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date, hospital: hospitalName })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update hospital data');
        }

        // 성공적으로 업데이트되면 로컬 상태도 업데이트
        hospitalByDate[date] = hospitalName;
        
        // 테이블 새로고침
        await initUserData();
    } catch (error) {
        console.error('Error saving hospital data:', error);
        throw error;
    }
}

// 병원명 삭제 (XML용)
export async function deleteHospitalOnly(date) {
    try {
        await deleteHospitalData(date);
        delete hospitalByDate[date];
    } catch (error) {
        console.error('Error deleting hospital data:', error);
    }
}

//혈압그래프......
export async function getAllDataMap() {
    try {
        return await getCustomData();
    } catch (error) {
        console.error('Error getting all data:', error);
        return [];
    }
}