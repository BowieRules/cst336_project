const fetch = require('node-fetch');
const express = require("express");
const bcrypt = require('bcrypt');
const session = require('express-session');

const validator = require('./public/js/validator.js');

const app = express();
app.use(express.static("public"));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies
app.set('view engine', 'ejs');
app.use(session({
  cookieName: 'session',
  secret: 'random_string_goes_here',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
  resave: true,
  saveUninitialized: true
}));

// routes
app.get("/", function(req, res){
    res.render("index.ejs"); 
});
app.get("/signIn", function(req, res){
    res.render("signIn"); 
});
app.post("/signIn", function(req, res) {
    
  let login = req.body.login;
  let password = req.body.password;

  if (!validator.lengthValid(login, 5, 200) || !validator.lengthValid(password, 8, 20)) {
    res.render('signIn', {error: 'login or pass invalid'});
  } else {
    connection.query("SELECT * FROM Login WHERE LoginName=?", login, (error, result) => {
      if (error) throw error;
      if (result.length === 0) {
        res.render('signIn', {error: 'No such user'});
      } else {
        let user = result[0];
        bcrypt.compare(password, user['HashedPwd'], (error, result) => {
          if (error) throw error;
          if (result) {
            req.session.user = {
              name: user['LoginName'],
              logged_in: true
            };
            res.render('login', {error: 'Login successful'});
          } else {
            res.render('login', {error: 'Wrong password'});
          }
        })
      }
    });
  }
});
//show the register form
app.get("/register", function(req, res) {
    res.render("register.ejs");
});

app.post('/register', function(req, res) {
  let email = req.body.email;
  let password = req.body.password;
  let re_password = req.body.re_password;
  let login = req.body.login;
  let fname = req.body.fname;
  let lname = req.body.lname;
  let gender = req.body.gender;
  let zip = req.body.zip;

  // an field is missing
  if (!validator.lengthValid(login, 5, 200) || !validator.lengthValid(password, 8, 20))
  {
    res.render('register', {error: 'Invalid login or password length'});
  } else if (!validator.lengthValid(email, 5, 200)) {
    res.render('register', {error: 'Invalid email length'});
  } else if (!validator.isEmail(email)) { // Wrong format
    res.render('register', {error: 'Wrong email format'});
  } else if (!validator.alphabetOnly(password)) {
    res.render('register', {error: 'Only alphsnumeric passwords allowed'});
  } else if (password !== re_password) {
    res.render('register', {error: 'Passwords do not match'});
  } else {
        // Check if email exists
        connection.query("SELECT * FROM Login WHERE Email=?", [email], function (error, result) {
            if (error) throw error;
            if (result.length > 0) { res.render('register', {error: 'This email already exists'}); }
            else {
              bcrypt.genSalt(10, function(error, salt) {
                if (error) throw error;
                bcrypt.hash(password, salt, function(error, hash) {
                  if (error) throw error;
                  connection.query("INSERT INTO Login (LoginName, HashedPwd, Email, FirstName, LastName, Gender, ZipCode) VALUES (?, ?, ?, ?, ?, ?, ?)",
                  [login, hash, email, fname, lname, gender, zip], function(error, result) {
                  res.render('register', {message: `You have been registered, try logging in`});
                  });
                });
              });
            } });
  }
});

// app cant access browser because it runs on server side,
app.get("/api/trefle", async function(req, res){
    let apiUrl = "https://trefle.io/api/v1/plants?token=6t4ZVV4DE7bKaqSg1CDFPHq3r5giNXINF3qlk43Povk";
    let response = await fetch(apiUrl);
    let data = await response.json();
    res.send(data);
});

// database
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'r1bsyfx4gbowdsis.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'qc0w3lq0xdqs5ny3',
    password: 'ea3ex48nw4hd4v3q',
    database: 'sn1qvahom0zodcij'
});
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
});

// starting server
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Express server is running...");
});