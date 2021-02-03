const express = require('express');
const app = express();
const bodyParser = require ('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const cookieParser = require("cookie-parser");
const session = require("express-session");

const bcrypt = require("bcrypt");
const saltRounds = 10;

const db = mysql.createPool({
  database: 'news',
  host: "localhost",
  user: "root",
  password: "3123",
});

app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST","PUT","DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(
  session({
    key: "idUsers",
    secret: "1",
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: 60 * 60 * 24,
    },
  })
);

app.get("/api/get",(req,res) => {
	const isAdmin = req.session.user;
	const sqlSelect = "SELECT * FROM news";
	db.query(sqlSelect, isAdmin,(err, result)=>{
		res.send(result);
		console.log(isAdmin);
	})
});

app.post("/api/insert",(req,res) => {
	const title = req.body.title;
	const text = req.body.text;
	const date = req.body.date;
	const sqlInsert = "INSERT INTO news (title, text, date) VALUES (?,?,?)";
	db.query(sqlInsert, [title,text,date], (err, result)=>{
		console.log(err);
	})
});
app.post("/register", (req, res) => {
  const username = req.body.usernameReg;
  const password = req.body.passwordReg;
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.log(err);
    }
    db.query(
      "INSERT INTO users (username, password) VALUES (?,?)",
      [username, hash],
      (err, result) => {
         if (result) {
         	res.send({ message: "Success" });
          } else{
          	res.send({message: "username is already exist"})
          }
      }
    );
  });
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user });
  } else {
    res.send({ loggedIn: false });
  }
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  db.query(
    "SELECT * FROM users WHERE username = ?;",
    username,
    (err, result) => {
      if (err) {
        res.send({ err: err });
      }

      if (result.length > 0) {
        bcrypt.compare(password, result[0].password, (error, response) => {
          if (response) {
            req.session.user = username;
          //  console.log(req.session.user);
            res.send(result);
          } else {
            res.send({ message: "Wrong username/password combination!" });
          }
        });
      } else {
        res.send({ message: "User doesn't exist" });
      }
      
    }
  );
});

app.delete("/api/delete/:title", (req,res)=>{
  const name = req.params.title;
  const sqlDelete = "DELETE FROM news WHERE title = ?";
  db.query(sqlDelete, name, (err,result)=>{
    if (err){console.log(err)}
      else {
        res.send(result);
      }
  })
});

app.put("/api/put", (req,res)=>{
  const title = req.body.title;
  const text = req.body.newText;
  const sqlUpdate = "UPDATE news SET  text = ? WHERE title = ?";
  db.query(sqlUpdate, [text, title], (err,result)=>{
    if (err){console.log(err)}
      
  })
})


app.listen(3001, () => {
console.log("running on port 3001");
});