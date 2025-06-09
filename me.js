const BASE_URL = 'https://www.lovelykurt.com';
// const BASE_URL = 'http://localhost:8080';

window.onload = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("無法取得使用者資料，請重新登入");
        }

        const res = await response.json();
        const user = res.data;

        document.getElementById("name").value = user.name || "";
        document.getElementById("line_name").value = user.line_name || "";
        document.getElementById("server_location").value = user.server_location || "";

    } catch (error) {
        console.error("載入使用者資料錯誤：", error);
        document.getElementById("errorMessage").textContent = error.message;
    }
};

document.getElementById("meForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const name = document.getElementById("name").value.trim();
    const line_name = document.getElementById("line_name").value.trim();
    const server_location = document.getElementById("server_location").value.trim();

    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");
    errorMessage.textContent = "";
    successMessage.textContent = "";

    try {
        const response = await fetch(`${BASE_URL}/me`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name, line_name, server_location })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "更新失敗");
        }

        successMessage.textContent = "更新成功，請重新登入...";

        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("name");
        localStorage.removeItem("role");

        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);

    } catch (error) {
        console.error("更新錯誤：", error);
        errorMessage.textContent = error.message;
    }
});

