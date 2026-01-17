function signup() {
    const username = document.getElementById("su-username").value;
    const email = document.getElementById("su-email").value;
    const password = document.getElementById("su-password").value;

    if (!username || !email || !password) {
        alert("Please fill all fields");
        return;
    }

    localStorage.setItem("user", JSON.stringify({
        username,
        email,
        password
    }));

    alert("Signup successful!");
    window.location.href = "login.html";
}

function login() {
    const username = document.getElementById("li-username").value;
    const password = document.getElementById("li-password").value;

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.username !== username || user.password !== password) {
        alert("Invalid username or password");
        return;
    }

    localStorage.setItem("loggedIn", "true");
    window.location.href = "index.html";
}

function logout() {
    localStorage.removeItem("loggedIn");
    window.location.href = "login.html";
}

function checkLogin() {
    if (localStorage.getItem("loggedIn") !== "true") {
        window.location.href = "login.html";
    }
}
