const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");

const app = express();
mongoose.connect("mongodb://127.0.0.1:27017", {
    dbName: "backend",
}).then(() => {
    console.log("Database Connected");
}).catch((e) => console.log(e));

const messageSchema = new mongoose.Schema({
    name: String,
    email: String
});

const Message = mongoose.model("Message", messageSchema);

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
})

const User = mongoose.model("User", userSchema);

// app.get("/", (req, res) => {
//     //res.send("Hey");
//     //res.sendStatus(500);
//     // res.json({
//     //     sucess: true,
//     //     products: ["Mac, VP"]
//     // })
//     res.status(203).json({
//         message: "MZ"
//     })
// })

// const location = path.resolve();
// const fpath = path.join(location, "./exm.html")

//sending File
// app.get("/", (req, res) => {
//     res.sendFile(fpath);
// })

let users = [];

app.use(express.static(path.join(path.resolve(), "./public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//displaying ejs
app.set("view engine", "ejs");
app.get("/", (req, res) => {
    res.render("exm", { name: "Abhijeet" });
})

app.get("/add", async(req, res) => {
    await Message.create({
        name: "Abhi",
        email: "abhi@gmail.com"
    });
    res.send("Created");
})

//public static file disp... nw
// app.get("/", (req, res) => {
//     res.sendFile("pub.html");
// })

app.get("/sucess", (req, res) => {
    res.render("sucess");
})

app.get("/users", (req, res) => {
    res.json({
        users
    })
})

app.post("/contact", async(req, res) => {
    //users.push({ name: req.body.name, email: req.body.email });
    const { name, email } = req.body;
    await Message.create({
        name,
        email
    })
    res.redirect("/sucess");
})

//middleware
const isAuth = async(req, res, next) => {
    const { token } = req.cookies;
    if (token) {
        const decode = jwt.verify(token, "mysecret");
        const user = await User.findById(decode._id);
        req.user = user;
        next();
    } else {
        res.redirect("/login");
    }
}

app.get("/main", isAuth, (req, res) => {
    res.render("logout", { name: req.user.name });
})

app.get("/login", (req, res) => {
    //console.log(req.cookies);
    // const { token } = req.cookies;
    // if (token) {
    //     res.render("logout");
    // } else {
    //     res.render("login");
    // }
    //console.log(req.user);
    res.render("login");
})

app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now())
    });
    res.redirect("/login");
})

app.get("/register", (req, res) => {
    res.render("register");
})

app.post("/register", async(req, res) => {

    const { name, email, password } = req.body;
    const emailC = await User.findOne({ email });
    //console.log(emailC);
    const hashedP = await bcrypt.hash(password, 9);
    if (emailC) return res.redirect("/login");
    const user = await User.create({
        name,
        email,
        password: hashedP
    })

    const token = jwt.sign({ _id: user._id }, "mysecret");

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000)
    });
    res.redirect("/main");
})

app.post("/login", async(req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.redirect("/register");
    }

    const passwordM = await bcrypt.compare(password, user.password);
    if (!passwordM) return res.render("login", { message: "Incorrect Password" });

    const token = jwt.sign({ _id: user._id }, "mysecret");

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000)
    });
    res.redirect("/main");
})

app.post("/", (req, res) => {
    //console.log(req.body);
    users.push({ name: req.body.name, email: req.body.email });
    console.log(users);
    //res.render("sucess");
    res.redirect("/sucess");
})

app.listen(5000, () => {
    console.log("Server is Working...");
});