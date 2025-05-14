const BASE_URL = 'https://www.lovelykurt.com';
// const BASE_URL = 'http://localhost:8080';

// 檢查 token 是否存在，若無則跳轉到 login.html
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 獲取帶有 Authorization Header 的 fetch 配置
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function updateConnectionCount() {
    try {
        const res = await fetch(`${BASE_URL}/count`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            if (res.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            throw new Error("無法取得連線人數");
        }
        const data = await res.json();
        const countSpan = document.getElementById("connection-count");
        countSpan.textContent = data.count ?? '--';
    } catch (err) {
        console.error("更新連線人數時出錯:", err);
        const countSpan = document.getElementById("connection-count");
        countSpan.textContent = '--';
    }
}

function updateConnectionStatus(status, className) {
    const statusElement = document.getElementById("connection-status");
    statusElement.textContent = status;
    statusElement.className = className;
}

function requestNotificationPermission() {
    if (Notification.permission === "granted") {
        console.log("通知權限已授予");
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("用戶已授予通知權限");
            } else {
                console.log("用戶拒絕通知權限");
                showNotificationPrompt();
            }
        });
    } else {
        console.log("通知權限已被拒絕");
        showNotificationPrompt();
    }
}

function showNotificationPrompt() {
    const prompt = document.getElementById("notificationPrompt");
    prompt.style.display = "block";
}

let source;
function connectSSE() {
    const token = localStorage.getItem('token');
    source = new EventSource(`${BASE_URL}/notify`);
    source.onopen = function () {
        console.log("SSE 連線已建立");
        updateConnectionStatus("已連線", "connected");
    };
    source.onmessage = function (event) {
        console.log("收到推送:", event.data);
        try {
            const data = JSON.parse(event.data);
            if (data.title && data.body) {
                if (Notification.permission === "granted") {
                    console.log("即將顯示通知:", data.title, data.body);
                    new Notification(data.title, {
                        body: data.body,
                        icon: "https://via.placeholder.com/50"
                    });
                } else if (Notification.permission !== "denied") {
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            console.log("權限授予，即將顯示通知:", data.title, data.body);
                            new Notification(data.title, {
                                body: data.body,
                                icon: "https://via.placeholder.com/50"
                            });
                        } else {
                            console.log("用戶拒絕通知權限");
                            showNotificationPrompt();
                        }
                    });
                } else {
                    console.log("通知權限被拒絕，無法顯示通知");
                    showNotificationPrompt();
                }
            } else {
                console.log("推送資料無效:", data);
            }
        } catch (error) {
            console.error("解析推送資料失敗:", error);
        }
    };
    source.onerror = function () {
        console.error("SSE 連線失敗或中斷");
        updateConnectionStatus("已斷線", "disconnected");
        if (localStorage.getItem('token')) {
            checkTokenValidity();
        }
    };
}

async function checkTokenValidity() {
    try {
        const res = await fetch(`${BASE_URL}/api/profile`, {
            headers: getAuthHeaders()
        });
        if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    } catch (err) {
        console.error("驗證 token 失敗:", err);
    }
}

const tableBody = document.getElementById('tableBody');

async function fetchData() {
    try {
        const response = await fetch(`${BASE_URL}/killList`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({})
        });
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        tableBody.innerHTML = '';
        if (data.data && Array.isArray(data.data)) {
            data.data.forEach(item => {
                const row = document.createElement('tr');
                const nameCell = document.createElement('td');
                nameCell.textContent = `${item.Name}(${item.KoreaName})`;
                row.appendChild(nameCell);
                const timeCell = document.createElement('td');
                const date = new Date(item.NextTime);
                if (item.NextTime) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    const seconds = String(date.getSeconds()).padStart(2, '0');
                    timeCell.textContent = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
                } else {
                    timeCell.textContent = '未提供時間';
                }
                row.appendChild(timeCell);
                const actionCell = document.createElement('td');
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '❌';
                deleteBtn.className = 'delete-btn';
                deleteBtn.title = '刪除此 Boss';
                deleteBtn.addEventListener('click', async () => {
                    if (confirm(`確定要刪除 "${item.Name} (${item.KoreaName})" 嗎？`)) {
                        try {
                            const res = await fetch(`${BASE_URL}/delete`, {
                                method: 'POST',
                                headers: getAuthHeaders(),
                                body: JSON.stringify({ id: item.ID })
                            });
                            if (!res.ok) {
                                if (res.status === 401) {
                                    window.location.href = 'login.html';
                                    return;
                                }
                                throw new Error(`刪除失敗，狀態碼：${res.status}`);
                            }
                            await fetchData();
                        } catch (err) {
                            alert('刪除時發生錯誤: ' + err.message);
                        }
                    }
                });
                actionCell.appendChild(deleteBtn);
                row.appendChild(actionCell);
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="3">無可用數據</td></tr>';
        }
    } catch (error) {
        console.error('獲取數據時出錯:', error);
        tableBody.innerHTML = '<tr><td colspan="3">載入數據失敗: ' + error.message + '</td></tr>';
        alert('載入數據失敗，請稍後再試: ' + error.message);
    }
}

const killRecordsTableBody = document.getElementById('killRecordsTableBody');

async function fetchKillRecords() {
    try {
        const response = await fetch(`${BASE_URL}/killRecord`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({})
        });
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Kill Records API Response:', JSON.stringify(data, null, 2)); // 詳細調試日誌
        killRecordsTableBody.innerHTML = '';
        if (data.data && Array.isArray(data.data)) {
            data.data.forEach(item => {
                console.log('Processing item:', item); // 每條記錄的調試日誌
                const row = document.createElement('tr');
                const nameCell = document.createElement('td');
                nameCell.textContent = item.BossName || '未知';
                row.appendChild(nameCell);
                const killerCell = document.createElement('td');
                killerCell.textContent = item.Killer || '無';
                row.appendChild(killerCell);
                const serverLocationCell = document.createElement('td');
                serverLocationCell.textContent = item.ServerLocation || '無';
                row.appendChild(serverLocationCell);
                const timeCell = document.createElement('td');
                const date = new Date(item.NextTime);
                if (item.NextTime && !isNaN(date)) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    const seconds = String(date.getSeconds()).padStart(2, '0');
                    timeCell.textContent = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
                } else {
                    timeCell.textContent = '無效時間';
                }
                row.appendChild(timeCell);
                killRecordsTableBody.appendChild(row);
            });
        } else {
            killRecordsTableBody.innerHTML = '<tr><td colspan="4">無擊殺紀錄</td></tr>';
        }
    } catch (error) {
        console.error('獲取擊殺紀錄時出錯:', error);
        killRecordsTableBody.innerHTML = '<tr><td colspan="4">載入擊殺紀錄失敗: ' + error.message + '</td></tr>';
        alert('載入擊殺紀錄失敗，請稍後再試: ' + error.message);
    }
}

let allBosses = [];
async function fetchAllBoss() {
    try {
        const response = await fetch(`${BASE_URL}/boss`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({})
        });
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const container = document.getElementById('allBossContainer');
        const bossSelect = document.getElementById('bossSelect');
        container.innerHTML = '';
        bossSelect.innerHTML = '<option value="">選擇 Boss</option>';
        if (data.data && Array.isArray(data.data)) {
            allBosses = data.data;
            data.data.forEach(item => {
                const card = document.createElement('div');
                card.className = 'boss-card';
                const img = document.createElement('img');
                img.src = item.Image || '';
                img.alt = item.Name || '圖片';
                const namePeriod = document.createElement('div');
                const period = item.Period || 0;
                namePeriod.textContent = `${item.Name}(${item.KoreaName}) - ${period} 小時`;
                card.addEventListener('click', async () => {
                    if (confirm(`確定要處理 "${item.Name} (${item.KoreaName})" 嗎？`)) {
                        try {
                            const res = await fetch(`${BASE_URL}/kill`, {
                                method: 'POST',
                                headers: getAuthHeaders(),
                                body: JSON.stringify({ id: item.ID })
                            });
                            if (!res.ok) {
                                if (res.status === 401) {
                                    window.location.href = 'login.html';
                                    return;
                                }
                                throw new Error(`操作失敗，狀態碼：${res.status}`);
                            }
                            alert(`${item.Name} 處理成功！`);
                            await fetchData();
                            await fetchKillRecords();
                        } catch (err) {
                            alert('操作時發生錯誤: ' + err.message);
                        }
                    }
                });
                card.appendChild(img);
                card.appendChild(namePeriod);
                container.appendChild(card);

                const option = document.createElement('option');
                option.value = item.ID;
                option.textContent = `${item.Name}(${item.KoreaName})`;
                bossSelect.appendChild(option);
            });
        } else {
            container.innerHTML = '<p>無可用資料</p>';
            bossSelect.innerHTML = '<option value="">無可用 Boss</option>';
        }
    } catch (error) {
        console.error('取得全部 Boss 資料失敗:', error);
        const container = document.getElementById('allBossContainer');
        container.innerHTML = '<p>載入資料失敗: ' + error.message + '</p>';
        alert('載入資料失敗，請稍後再試: ' + error.message);
    }
}

// 格式化日期為 YYYY/MM/DD HH:mm:ss
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

// 設置預設時間為當前本地時間
function setDefaultTime() {
    const now = new Date();
    document.getElementById('killTimeDisplay').value = formatDateTime(now);
}

async function submitCustomKill() {
    const bossId = document.getElementById('bossSelect').value;
    const killTimeInput = document.getElementById('killTimeDisplay').value;

    if (!bossId) {
        alert('請選擇一個 Boss');
        return;
    }
    if (!killTimeInput) {
        alert('請輸入擊殺時間');
        return;
    }

    // 驗證時間格式
    const regex = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
    const match = killTimeInput.match(regex);
    if (!match) {
        alert('時間格式錯誤，請使用 YYYY/MM/DD HH:mm:ss');
        return;
    }

    const year = match[1];
    const month = match[2] - 1;
    const day = match[3];
    const hours = match[4];
    const minutes = match[5];
    const seconds = match[6];
    const date = new Date(year, month, day, hours, minutes, seconds);

    if (isNaN(date)) {
        alert('無效的時間，請檢查輸入');
        return;
    }

    try {
        const selectedBoss = allBosses.find(boss => boss.ID == bossId);
        const res = await fetch(`${BASE_URL}/killCustomization`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                id: parseInt(bossId, 10),
                time: date.toISOString()
            })
        });
        if (!res.ok) {
            if (res.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`操作失敗，狀態碼：${res.status}`);
        }
        alert(`${selectedBoss.Name} 處理成功！`);
        await fetchData();
        await fetchKillRecords();
    } catch (err) {
        alert('操作時發生錯誤: ' + err.message);
    }
}

window.onload = () => {
    if (!checkAuth()) return;

    fetchData();
    fetchAllBoss();
    fetchKillRecords();
    setDefaultTime();
    document.getElementById('refreshButton').addEventListener('click', () => {
        fetchData();
    });
    document.getElementById('refreshKillRecordsButton').addEventListener('click', () => {
        fetchKillRecords();
    });
    document.getElementById('submitKill').addEventListener('click', submitCustomKill);
    requestNotificationPermission();
    connectSSE();
    updateConnectionCount();
    setInterval(updateConnectionCount, 60000);

    const killTimeDisplay = document.getElementById('killTimeDisplay');
    killTimeDisplay.addEventListener('change', () => {
        const input = killTimeDisplay.value;
        const regex = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
        const match = input.match(regex);
        if (!match) {
            alert('時間格式錯誤，請使用 YYYY/MM/DD HH:mm:ss');
            setDefaultTime();
            return;
        }
        const year = match[1];
        const month = match[2] - 1;
        const day = match[3];
        const hours = match[4];
        const minutes = match[5];
        const seconds = match[6];
        const date = new Date(year, month, day, hours, minutes, seconds);
        if (isNaN(date)) {
            alert('無效的時間格式，請使用 YYYY/MM/DD HH:mm:ss');
            setDefaultTime();
        }
    });
};
