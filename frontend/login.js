function loginUser() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch("http://127.0.0.1:8000/auth/login/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(res => res.json())
    .then(data => {

        if (data.user_id) {
            // 🔥 THIS IS THE KEY PART
            localStorage.setItem("user_id", data.user_id);

            console.log("Saved user_id:", data.user_id);

            window.location.href = "profile.html";
        } else {
            alert("Invalid login");
        }
    })
    .catch(err => {
        console.error(err);
        alert("Login failed");
    });
}
