const BASE_URL = 'https://www.lovelykurt.com';
// const BASE_URL = 'http://localhost:8080';

window.onload = () => {
    document.getElementById("errorMessage").textContent = "";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
};

document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.textContent = "";
    if (!username || !password) {
        errorMessage.textContent = "帳號和密碼不能為空";
        return;
    }
    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        console.log('Response status:', response.status);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "登入失敗，請檢查帳號或密碼");
        }
        const data = await response.json();
        console.log('Login response data:', data);
        if (data && data.token && data.user && data.user.username) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.user.username);
            localStorage.setItem("name", data.user.name);
            localStorage.setItem("role", data.user.role);
            console.log('Token stored:', localStorage.getItem('token'));
            if (!localStorage.getItem("token")) {
                throw new Error("無法儲存 token，請檢查瀏覽器設定或禁用隱私模式");
            }
            window.location.href = "index.html";
        } else {
            throw new Error("回傳資料格式錯誤");
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = error.message;
    }
});
