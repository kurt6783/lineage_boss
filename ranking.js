const BASE_URL = 'https://www.lovelykurt.com';
// const BASE_URL = 'http://localhost:8080';

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function fetchKillRank() {
    try {
        const response = await fetch(`${BASE_URL}/killRank`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({})
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`API 錯誤：${response.status}`);
        }

        const res = await response.json();
        renderRanking(res.data || []);
    } catch (err) {
        alert('讀取排行榜失敗: ' + err.message);
        console.error(err);
    }
}

function renderRanking(data) {
    const container = document.getElementById('rankingContainer');
    container.innerHTML = '';

    data.forEach(monthItem => {
        const { year_month, killers } = monthItem;

        const monthBlock = document.createElement('div');
        monthBlock.className = 'month-block';

        const monthTitle = document.createElement('h2');
        monthTitle.textContent = year_month;
        monthBlock.appendChild(monthTitle);

        const list = document.createElement('ul');
        list.className = 'killer-list';

        // 排序 killers
        const sortedKillers = Object.entries(killers).sort((a, b) => b[1] - a[1]);
        sortedKillers.forEach(([name, count]) => {
            const li = document.createElement('li');
            const displayName = name.trim() === '' ? '(無名)' : name;
            li.textContent = `${displayName}：${count} 次`;
            list.appendChild(li);
        });

        monthBlock.appendChild(list);
        container.appendChild(monthBlock);
    });
}

window.onload = () => {
    if (!checkAuth()) return;
    fetchKillRank();
};
