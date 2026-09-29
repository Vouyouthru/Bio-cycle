const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const app = express();
const PORT = 3000;

const PUBLIC = path.join(__dirname, "public");


// =====================================================
// DATABASE
// =====================================================

const db = new DatabaseSync(
    path.join(__dirname, "biocycle.db")
);

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL
    );
`);


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// =====================================================
// PASSWORD SECURITY
// =====================================================

function hashPassword(password) {

    const salt = crypto
        .randomBytes(16)
        .toString("hex");

    const hash = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

    return `${salt}:${hash}`;
}


function verifyPassword(password, storedPassword) {

    const [salt, originalHash] =
        storedPassword.split(":");

    const hash = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

    const a = Buffer.from(hash, "hex");
    const b = Buffer.from(originalHash, "hex");

    return (
        a.length === b.length &&
        crypto.timingSafeEqual(a, b)
    );
}


// =====================================================
// SESSIONS
// =====================================================

function createSession(userId) {

    const token = crypto
        .randomBytes(32)
        .toString("hex");

    db.prepare(`
        INSERT INTO sessions
        (token, user_id)
        VALUES (?, ?)
    `).run(token, userId);

    return token;
}


function getUser(req) {

    const authorization =
        req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
        return null;
    }

    const token =
        authorization.substring(7);

    return db.prepare(`
        SELECT
            users.id,
            users.name,
            users.email,
            users.phone,
            users.role,
            users.created_at
        FROM sessions
        JOIN users
            ON users.id = sessions.user_id
        WHERE sessions.token = ?
    `).get(token);
}


// =====================================================
// PAGE ROUTES
// =====================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(PUBLIC, "login.html")
    );

});


app.get("/login", (req, res) => {

    res.sendFile(
        path.join(PUBLIC, "login.html")
    );

});


app.get("/signup", (req, res) => {

    res.sendFile(
        path.join(PUBLIC, "signup.html")
    );

});


// =====================================================
// SIGN UP
// =====================================================

app.post("/api/signup", (req, res) => {

    try {

        const name =
            String(req.body.name || "").trim();

        const email =
            String(req.body.email || "")
                .trim()
                .toLowerCase() || null;

        const phone =
            String(req.body.phone || "")
                .trim() || null;

        const password =
            String(req.body.password || "");


        if (!name || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Name and password are required."
            });

        }


        if (!email && !phone) {

            return res.status(400).json({
                success: false,
                message:
                    "Enter an email or phone number."
            });

        }


        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters."
            });

        }


        const existing =
            db.prepare(`
                SELECT id
                FROM users
                WHERE email = ?
                   OR phone = ?
            `).get(email, phone);


        if (existing) {

            return res.status(409).json({
                success: false,
                message:
                    "An account with that email or phone already exists."
            });

        }


        const result =
            db.prepare(`
                INSERT INTO users
                (name, email, phone, password, role)
                VALUES (?, ?, ?, ?, 'user')
            `).run(
                name,
                email,
                phone,
                hashPassword(password)
            );


        const token =
            createSession(result.lastInsertRowid);


        res.json({
            success: true,
            token,
            role: "user"
        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Could not create account."
        });

    }

});


// =====================================================
// LOGIN
// =====================================================

app.post("/api/login", (req, res) => {

    try {

        const identifier =
            String(req.body.identifier || "").trim();

        const password =
            String(req.body.password || "");


        if (!identifier || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Enter your email/phone and password."
            });

        }


        const user =
            db.prepare(`
                SELECT *
                FROM users
                WHERE email = ?
                   OR phone = ?
            `).get(
                identifier.toLowerCase(),
                identifier
            );


        if (!user) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email/phone or password."
            });

        }


        if (
            !verifyPassword(
                password,
                user.password
            )
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email/phone or password."
            });

        }


        const token =
            createSession(user.id);


        res.json({
            success: true,
            token,
            role: user.role
        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Login failed."
        });

    }

});


// =====================================================
// CURRENT USER
// =====================================================

app.get("/api/me", (req, res) => {

    const user = getUser(req);


    if (!user) {

        return res.status(401).json({
            success: false,
            message: "Not logged in."
        });

    }


    res.json({
        success: true,
        user
    });

});


// =====================================================
// LOGOUT
// =====================================================

app.post("/api/logout", (req, res) => {

    const authorization =
        req.headers.authorization || "";


    if (authorization.startsWith("Bearer ")) {

        const token =
            authorization.substring(7);

        db.prepare(`
            DELETE FROM sessions
            WHERE token = ?
        `).run(token);

    }


    res.json({
        success: true
    });

});


// =====================================================
// ADMIN USERS
// =====================================================

app.get("/api/admin/users", (req, res) => {

    const admin = getUser(req);


    if (
        !admin ||
        admin.role !== "admin"
    ) {

        return res.status(403).json({
            success: false,
            message:
                "Admin access required."
        });

    }


    const users =
        db.prepare(`
            SELECT
                id,
                name,
                email,
                phone,
                role,
                created_at
            FROM users
            ORDER BY id DESC
        `).all();


    res.json({
        success: true,
        users
    });

});


// =====================================================
// DEFAULT ADMIN
// =====================================================

const admin =
    db.prepare(`
        SELECT id
        FROM users
        WHERE role = 'admin'
        LIMIT 1
    `).get();


if (!admin) {

    db.prepare(`
        INSERT INTO users
        (name, email, password, role)
        VALUES (?, ?, ?, 'admin')
    `).run(
        "BioCycle Administrator",
        "admin@biocycle.local",
        hashPassword("biogas123")
    );

    console.log(
        "Default admin account created."
    );

}


// =====================================================
// STATIC WEBSITE
// =====================================================

app.use(
    express.static(PUBLIC)
);


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

    console.log("");
    console.log("==============================");
    console.log("       BIOCYCLE SERVER");
    console.log("==============================");
    console.log(
        `http://localhost:${PORT}`
    );
    console.log("==============================");
    console.log("");

});