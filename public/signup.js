const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signupMessage");

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");


// SHOW / HIDE PASSWORD
if (togglePassword) {

    togglePassword.addEventListener("click", () => {

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePassword.textContent = "Hide";
        } else {
            passwordInput.type = "password";
            togglePassword.textContent = "Show";
        }

    });

}


// SIGNUP
signupForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    signupMessage.textContent = "";

    const name =
        document.getElementById("name").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const phone =
        document.getElementById("phone").value.trim();

    const password =
        document.getElementById("password").value;


    // Basic validation

    if (!name) {

        signupMessage.textContent =
            "Please enter your name.";

        return;
    }


    if (!email && !phone) {

        signupMessage.textContent =
            "Enter either an email or phone number.";

        return;
    }


    if (password.length < 6) {

        signupMessage.textContent =
            "Password must contain at least 6 characters.";

        return;
    }


    const button =
        signupForm.querySelector(".auth-button");

    button.disabled = true;
    button.textContent = "Creating account...";


    try {

        const response = await fetch("/api/signup", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                email: email || null,
                phone: phone || null,
                password: password
            })

        });


        const data = await response.json();


        // IMPORTANT:
        // Only redirect if the server actually
        // created the account.

        if (!response.ok || !data.success) {

            signupMessage.textContent =
                data.message ||
                "Account creation failed.";

            return;
        }


        // Save authentication token

        localStorage.setItem(
            "biocycleToken",
            data.token
        );


        signupMessage.textContent =
            "Account created successfully!";


        // Redirect only after successful signup

        setTimeout(() => {

            window.location.href = "/main.html";

        }, 500);

    }


    catch (error) {

        console.error("SIGNUP ERROR:", error);

        signupMessage.textContent =
            "Cannot connect to BioCycle server.";

    }


    finally {

        button.disabled = false;
        button.textContent = "Create Account";

    }

});