const BASE_URL = 'https://www.lovelykurt.com';
// const BASE_URL = 'http://localhost:8080';

const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spinBtn');
const resultText = document.getElementById('result');
const downloadLink = document.getElementById('downloadLink');
const prizeList = document.getElementById('prizeList');
const selectedPrizeList = document.getElementById('selectedPrizeList');
const prizeNameInput = document.getElementById('prizeNameInput');

let allPrizes = [];
let selectedPrizes = [];
let prizeName = ''; // 儲存獎品名稱
const colors = ['#f44336', '#2196f3', '#4caf50', '#ffeb3b', '#9c27b0', '#ff9800', '#e91e63', '#3f51b5', '#8bc34a', '#ffc107', '#ff5722', '#673ab7', '#cddc39', '#ff4081', '#00bcd4', '#795548', '#607d8b', '#9e9e9e', '#d81b60', '#4caf50', '#f44336', '#2196f3', '#4caf50', '#ffeb3b', '#9c27b0', '#ff9800', '#e91e63', '#3f51b5', '#8bc34a', '#ffc107'];
let isSpinning = false;
let mediaRecorder;
let recordedChunks = [];

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

// 獲取獎品列表
async function fetchRaffleList() {
    try {
        const response = await fetch(`${BASE_URL}/raffleList`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({})
        });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
            allPrizes = data.data.map(item => ({
                username: item.username,
                name: item.name || '未知',
                role: item.role || '',
                server_location: item.server_location || '',
                line_name: item.line_name || ''
            }));
            updatePrizeList();
        } else {
            prizeList.innerHTML = '<li>無可用人員</li>';
            spinBtn.disabled = true;
        }
    } catch (error) {
        console.error('獲取獎品列表失敗:', error);
        prizeList.innerHTML = '<li>載入資料失敗: ' + error.message + '</li>';
        alert('載入人員列表失敗，請稍後再試: ' + error.message);
        spinBtn.disabled = true;
    }
}

// 更新全部人員列表
function updatePrizeList() {
    prizeList.innerHTML = '';
    allPrizes.forEach((prize, index) => {
        const li = document.createElement('li');
        li.textContent = `${prize.name} - ${prize.line_name || '快去改名字'}`;
        li.dataset.index = index;
        li.addEventListener('dblclick', () => {
            console.log('雙擊項目:', prize.name, 'Username:', prize.username); // 調試日誌
            if (!selectedPrizes.some(p => p.username === prize.username)) {
                selectedPrizes.push(prize);
                console.log('添加至抽獎人員:', prize.name); // 調試日誌
                updateSelectedPrizeList();
                updateWheel();
            } else {
                console.log('項目已存在:', prize.name); // 調試日誌
            }
        });
        prizeList.appendChild(li);
    });
    // 動態調整 Grid 列數，最多 10 列
    const columns = Math.min(allPrizes.length, 10);
    const rows = Math.ceil(allPrizes.length / 10);
    prizeList.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    prizeList.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
}

// 更新抽獎人員列表
function updateSelectedPrizeList() {
    selectedPrizeList.innerHTML = '';
    selectedPrizes.forEach((prize, index) => {
        const li = document.createElement('li');
        li.textContent = `${prize.name} - ${prize.line_name || '快去改名字'}`;
        li.dataset.index = index;
        li.addEventListener('dblclick', () => {
            console.log('移除項目:', prize.name, 'Username:', prize.username); // 調試日誌
            selectedPrizes.splice(index, 1);
            updateSelectedPrizeList();
            updateWheel();
        });
        selectedPrizeList.appendChild(li);
    });
    spinBtn.disabled = selectedPrizes.length === 0;
    console.log('當前抽獎人員:', selectedPrizes); // 調試日誌
}

// 更新轉盤
function updateWheel() {
    wheel.innerHTML = '';
    wheel.style.background = selectedPrizes.length > 0 ?
        `conic-gradient(${selectedPrizes.map((_, i) => `${colors[i % colors.length]} ${i * 360 / selectedPrizes.length}deg ${(i + 1) * 360 / selectedPrizes.length}deg`).join(', ')})` :
        '#ccc';

    selectedPrizes.forEach((prize, i) => {
        const section = document.createElement('div');
        section.className = 'section';
        section.style.transform = `rotate(${i * 360 / selectedPrizes.length}deg)`;
        section.textContent = `${prize.name} - ${prize.line_name || '快去改名字'}`;
        wheel.appendChild(section);
    });
}

// 開始錄影
async function startRecording() {
    recordedChunks = [];
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
        });
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadLink.download = 'wheel_spin.webm';
            downloadLink.style.display = 'block';
            downloadLink.textContent = '下載錄影';
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
    } catch (err) {
        console.error('錄影失敗:', err);
        isSpinning = false;
        spinBtn.disabled = selectedPrizes.length === 0;
        resultText.textContent = '錄影失敗，請重試！';
    }
}

// 停止錄影
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}

// 抽獎邏輯
async function spinWheel() {
    if (isSpinning || selectedPrizes.length === 0) return;
    isSpinning = true;
    spinBtn.disabled = true;
    downloadLink.style.display = 'none';
    resultText.textContent = '抽獎進行中...';

    try {
        // 開始錄影
        await startRecording();

        // 隨機選擇中獎項目
        const randomIndex = Math.floor(Math.random() * selectedPrizes.length);
        const anglePerSection = 360 / selectedPrizes.length;
        const randomAngle = randomIndex * anglePerSection;
        const totalRotation = 360 * 5 + randomAngle + Math.random() * anglePerSection;

        // 執行旋轉
        wheel.style.transform = `rotate(${totalRotation}deg)`;

        // 動畫結束後等待3秒
        setTimeout(() => {
            isSpinning = false;
            spinBtn.disabled = selectedPrizes.length === 0;
            resultText.textContent = `恭喜您抽中「${prizeName || '獎品'}」：${selectedPrizes[randomIndex].name} - ${selectedPrizes[randomIndex].line_name || '快去改名字'}！`;

            // 再延遲3秒停止錄影
            setTimeout(() => {
                stopRecording();
            }, 3000);
        }, 4000); // 動畫持續4秒
    } catch (err) {
        console.error('抽獎過程中出錯:', err);
        isSpinning = false;
        spinBtn.disabled = selectedPrizes.length === 0;
        resultText.textContent = '抽獎失敗，請重試！';
    }
}

// 初始化
window.onload = () => {
    if (!checkAuth()) return;

    fetchRaffleList();
    updateSelectedPrizeList();
    updateWheel();
    spinBtn.addEventListener('click', spinWheel);
    prizeNameInput.addEventListener('input', () => {
        prizeName = prizeNameInput.value.trim();
        console.log('獎品名稱更新:', prizeName); // 調試日誌
    });
};
