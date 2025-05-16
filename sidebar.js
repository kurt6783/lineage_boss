// loadSidebar.js
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 動態載入 sidebar.html
        const response = await fetch('sidebar.html');
        if (!response.ok) {
            throw new Error('無法載入 sidebar.html');
        }
        const sidebarHtml = await response.text();

        // 將 sidebar.html 的內容插入到 sidebarContainer
        const sidebarContainer = document.getElementById('sidebarContainer');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = sidebarHtml;
        } else {
            console.error('未找到 sidebarContainer');
            return;
        }

        // 初始化側邊欄互動邏輯
        const sidebar = document.getElementById('sidebar');
        const toggleButton = document.getElementById('sidebarToggle');

        if (!sidebar || !toggleButton) {
            console.error('找不到 sidebar 或 sidebarToggle 元素');
            return;
        }

        // 切換側邊欄展開/關閉
        toggleButton.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            toggleButton.textContent = sidebar.classList.contains('open') ? '✖' : '☰';
        });

        // 點擊外部關閉側邊欄
        document.addEventListener('click', (event) => {
            if (!sidebar.contains(event.target) && !toggleButton.contains(event.target) && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                toggleButton.textContent = '☰';
            }
        });

        // 設置當前頁面高亮
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const links = {
            'index.html': document.getElementById('indexLink'),
            'ranking.html': document.getElementById('rankingLink')
        };
        if (links[currentPath]) {
            links[currentPath].style.backgroundColor = '#4CAF50';
        }
    } catch (error) {
        console.error('載入側邊欄失敗:', error);
    }
});
