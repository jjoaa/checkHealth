const CLIENT_ID = '';  
const redirectUri = 'http://localhost:5500/index.html';

const scope = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.location.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.blood_glucose.read'
].join(' ');

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(redirectUri)}` +
  `&response_type=token` +
  `&scope=${encodeURIComponent(scope)}` +
  `&include_granted_scopes=true`;

function startOAuth() {
  window.location.href = authUrl;
}

function getTodayTimeRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return {
    startTimeMillis: start.getTime(),
    endTimeMillis: Date.now()
  };
}

//통합형
async function fetchData(token, dataTypeName, dataSourceId, elementId, formatter) {
  const { startTimeMillis, endTimeMillis } = getTodayTimeRange();

  try {
    const res = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        aggregateBy: [{ dataTypeName, dataSourceId }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis,
        endTimeMillis
      })
    });

    const data = await res.json();
    const point = data.bucket?.[0]?.dataset?.[0]?.point?.[0];

    if (point) {
      const value = point.value[0];
      document.getElementById(elementId).textContent = formatter(value);
    } else {
      document.getElementById(elementId).textContent = '-'; //데이터 없음
    }
  } catch (err) {

    document.getElementById(elementId).textContent = '-' //데이터 없음
  }
}

function fetchAll(token) {
  fetchData(token,
    'com.google.step_count.delta',
    'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
    'stepCount',
    (v) => `${v.intVal} 걸음`
  );

  fetchData(token,
    'com.google.heart_rate.bpm',
    'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
    'heartRate',
    (v) => `${v.fpVal.toFixed(1)} bpm`
  );

  fetchData(token,
    'com.google.calories.expended',
    'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
    'calories',
    (v) => `${v.fpVal.toFixed(0)} kcal`
  );

  fetchData(token,
    'com.google.blood_glucose',
    'derived:com.google.blood_glucose:com.google.android.gms:merged',
    'bloodGlucose',
    (v) => `${v.fpVal.toFixed(1)} mmol/L`  
  );
}

window.onload = () => {

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get('access_token');
  
    if (accessToken) {
      localStorage.setItem('google_access_token', accessToken);
      window.history.replaceState({}, document.title, redirectUri);
      fetchAll(accessToken);
    } else {

      const savedToken = localStorage.getItem('google_access_token');
      if (savedToken) {
        fetchAll(savedToken);
      }
    }
    document.getElementById('login-btn').addEventListener('click', () => {
      startOAuth();
    });
  };

 
