/* =========================================================
   BIOCYCLE LOGIN
========================================================= */


const loginForm =
    document.getElementById("loginForm");


const loginMessage =
    document.getElementById("loginMessage");


const passwordInput =
    document.getElementById("password");


const togglePassword =
    document.getElementById("togglePassword");


const userMode =
    document.getElementById("userMode");


const adminMode =
    document.getElementById("adminMode");


const modeDescription =
    document.getElementById("modeDescription");


const adminIndicator =
    document.getElementById("adminIndicator");


let selectedMode = "user";



/* =========================================================
   PASSWORD SHOW / HIDE
========================================================= */

if (togglePassword && passwordInput) {

    togglePassword.addEventListener(
        "click",
        () => {

            if (
                passwordInput.type ===
                "password"
            ) {

                passwordInput.type =
                    "text";

                togglePassword.textContent =
                    "Hide";

            } else {

                passwordInput.type =
                    "password";

                togglePassword.textContent =
                    "Show";

            }

        }
    );

}



/* =========================================================
   USER MODE
========================================================= */

userMode.addEventListener(
    "click",
    () => {

        selectedMode = "user";

        userMode.classList.add("active");

        adminMode.classList.remove("active");

        modeDescription.textContent =
            "Sign in to access the BioCycle platform.";

        adminIndicator.classList.remove(
            "show"
        );

    }
);



/* =========================================================
   ADMIN MODE
========================================================= */

adminMode.addEventListener(
    "click",
    () => {

        selectedMode = "admin";

        adminMode.classList.add("active");

        userMode.classList.remove("active");

        modeDescription.textContent =
            "Sign in to access the BioCycle administration panel.";

        adminIndicator.classList.add(
            "show"
        );

    }
);



/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const identifier =
            document
                .getElementById("identifier")
                .value
                .trim();


        const password =
            passwordInput.value;


        loginMessage.textContent = "";


        if (!identifier || !password) {

            loginMessage.textContent =
                "Please enter your email/phone and password.";

            return;

        }


        const button =
            loginForm.querySelector(
                ".auth-button"
            );


        button.disabled = true;

        button.textContent =
            "Signing in...";


        try {


            const response =
                await fetch(
                    "/api/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            identifier,
                            password
                        })
                    }
                );


            const data =
                await response.json();



            /* LOGIN FAILED */

            if (
                !response.ok ||
                !data.success
            ) {

                loginMessage.textContent =
                    data.message ||
                    "Login failed.";

                return;

            }



            /* =================================================
               IMPORTANT:
               BACKEND ROLE IS THE AUTHORITY
            ================================================= */


            if (
                selectedMode === "admin" &&
                data.role !== "admin"
            ) {

                loginMessage.textContent =
                    "This account does not have administrator access.";

                return;

            }


            if (
                selectedMode === "user" &&
                data.role === "admin"
            ) {

                loginMessage.textContent =
                    "Please select Administrator for this account.";

                return;

            }



            /* SAVE TOKEN */

            localStorage.setItem(
                "biocycleToken",
                data.token
            );



            /* REDIRECT */

            if (data.role === "admin") {

                window.location.href =
                    "/admin.html";

            } else {

                window.location.href =
                    "/main.html";

            }

        }


        catch (error) {

            console.error(error);

            loginMessage.textContent =
                "Cannot connect to BioCycle server.";

        }


        finally {

            button.disabled = false;

            button.textContent =
                "Sign In";

        }

    }
);