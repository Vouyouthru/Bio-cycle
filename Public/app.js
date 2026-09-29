// =====================================================
// BIOCYCLE APP
// =====================================================

const token = localStorage.getItem("biocycleToken");


// =====================================================
// PROTECT USER PAGES
// =====================================================

const publicPages = [
    "/",
    "/login",
    "/login.html",
    "/signup",
    "/signup.html"
];

const currentPath = window.location.pathname;

if (!publicPages.includes(currentPath) && !token) {

    window.location.href = "/login";

}


// =====================================================
// LOAD USER
// =====================================================

async function loadUser() {

    if (!token) return;

    try {

        const response = await fetch("/api/me", {

            headers: {
                Authorization: `Bearer ${token}`
            }

        });


        if (!response.ok) {

            localStorage.removeItem("biocycleToken");

            window.location.href = "/login";

            return;
        }


        const data = await response.json();


        const userName =
            document.getElementById("userName");


        if (userName && data.user) {

            userName.textContent =
                data.user.name;

        }

    }

    catch (error) {

        console.error(error);

    }

}


// =====================================================
// LOGOUT
// =====================================================

const logoutButton =
    document.getElementById("logoutButton");


if (logoutButton) {

    logoutButton.addEventListener("click", async () => {

        try {

            await fetch("/api/logout", {

                method: "POST",

                headers: {
                    Authorization: `Bearer ${token}`
                }

            });

        }

        catch (error) {

            console.error(error);

        }


        localStorage.removeItem("biocycleToken");

        window.location.href = "/login";

    });

}


// =====================================================
// MOBILE MENU
// =====================================================

const menuToggle =
    document.getElementById("menuToggle");

const mainNav =
    document.getElementById("mainNav");


if (menuToggle && mainNav) {

    menuToggle.addEventListener("click", () => {

        mainNav.classList.toggle("open");

    });

}


// =====================================================
// CALCULATOR
// =====================================================

const calculateButton =
    document.getElementById("calculateButton");


if (calculateButton) {

    calculateButton.addEventListener("click", () => {

        const feedstock =
            Number(
                document.getElementById("feedstock").value
            );

        const quantity =
            Number(
                document.getElementById("quantity").value
            );


        if (!quantity || quantity <= 0) {

            return;

        }


        const biogas =
            feedstock * quantity;


        const energy =
            biogas * 5.5;


        document.getElementById(
            "biogasResult"
        ).textContent =
            biogas.toFixed(2) + " m³";


        document.getElementById(
            "energyResult"
        ).textContent =
            energy.toFixed(2) + " kWh";

    });

}


// =====================================================
// INITIALIZE
// =====================================================

loadUser();