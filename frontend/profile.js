window.onload = function () {

    const userId = localStorage.getItem("user_id");

    console.log("Profile page user_id:", userId);

    if (!userId) {
        alert("Please login first");
        window.location.href = "login.html";
        return;
    }

    fetch(`http://127.0.0.1:8000/auth/profile/${userId}/`)
        .then(res => res.json())
        .then(data => {

            document.getElementById("username").innerText = data.username;
            document.getElementById("email").innerText = data.email;

        })
        .catch(err => {
            console.error(err);
            alert("Profile load failed");
        });
};
