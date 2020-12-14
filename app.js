const fetch = require('node-fetch');
const express = require("express");
const multer = require('multer');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const multers3 = require('multer-s3');
const aws = require('aws-sdk');

const app = express();

// Create S3 service object
const s3 = new aws.S3({
    accessKeyId: `${process.env.AWS_ACCESS_KEY_ID}`,
    secretAccessKey: `${process.env.AWS_SECRET_ACCESS_KEY}`,
    apiVersion: '2006-03-01',
    region: 'us-west-1'
});

app.engine('html', require('ejs').renderFile);
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

const validator = require('./public/js/validator.js');
const pool = require('./dbPool.js');

const uploadS3 = multer({
  storage: multers3({
    s3: s3,
    acl: 'public-read',
    bucket: 'csumb-marianna',
    metadata: (req, file, cb) => {
      cb(null, {fieldName: file.fieldname})
    },
    key: (req, file, cb) => {
      cb(null, Date.now().toString() + '-' + file.originalname)
    }
  })
});

app.use(session({
  secret: 'aloe vera',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 20 * 60 * 1000 } // cookie life in milliseconds = 20 minutes here
}));

// DECLARING CUSTOM MIDDLEWARE
const ifNotLoggedin = (req, res, next) => {
    if(!req.session.logged_in){
        return res.redirect('/signIn');
    }
    next();
}

const ifLoggedin = (req,res,next) => {
    if(req.session.logged_in){
        return res.redirect('/');
    }
    next();
}
// END OF CUSTOM MIDDLEWARE

//routes
//root
app.get("/", async (req, res) => {
	res.render("home",{"isLoggedIn":req.session.logged_in}); //render
}); //root

app.get("/api/insertPlant", function(req, res) {
  let sql = "INSERT IGNORE INTO `Plant` (TrefleId, Common_Name, Scientific_Name, Family, Genus, Image_Url) VALUES (?,?,?,?,?,?)";
  let sqlParams = [req.query.id,
    decodeURIComponent(req.query.common_name),
    decodeURIComponent(req.query.scientific_name),
    decodeURIComponent(req.query.family),
    decodeURIComponent(req.query.genus),
    decodeURIComponent(req.query.image_url)];
  pool.query(sql, sqlParams, function (err, rows, fields) {
    if (err) throw err;
    if (rows.affectedRows == 0)
    {
      sql = "SELECT PlantId FROM `Plant` WHERE TrefleId = ?";
      pool.query(sql, [req.query.id], function (err, rows2, fields) {
        if (err) throw err;
        res.send(JSON.stringify(rows2));
      });
    }
    else
    {
      res.send(JSON.stringify([{PlantId: rows.insertId}]));
    }
    
  });
});

app.get("/api/insertLoginPlant", function(req, res) {
  if(req.session.logged_in){
    // check if plant is already in collection
    pool.query("SELECT * FROM LoginPlant WHERE LoginId=? AND PlantId=?", [req.session.login_id, decodeURIComponent(req.query.id)], function (error, result) {
      if (error) throw error;
      if (result.length > 0) { res.send('This plant is already in your collection!'); }
      else {
        let sql = "INSERT INTO `LoginPlant` (LoginId, PlantId) VALUES (?,?)";
        let sqlParams = [req.session.login_id,req.query.id];
        pool.query(sql, sqlParams, function (err, rows, fields) {
          if (err) throw err;
          res.send('Your collection has been updated!');
        });
      }
    });
  }
});

//yourPlants : requires login
app.get("/yourPlants", ifNotLoggedin, (req,res,next) => {

  let sql = `SELECT Description, Hardiness, WaterFrequency, Soil, 
  Temperature, LightExposure, Fertilization, FirstName, Common_Name,
  Scientific_Name, Family, Genus, Image_Url, LoginPlant.PlantId, LoginPlant.LoginId
  FROM Plant
	  INNER JOIN LoginPlant
      ON Plant.PlantId = LoginPlant.PlantId
    INNER JOIN Login
	    ON LoginPlant.LoginId = Login.LoginId
  WHERE Login.LoginId = ?`;
  
    pool.query(sql, [req.session.login_id], (err, rows ) => {
      if (err) throw err;
      res.render("yourPlants", {"isLoggedIn":req.session.logged_in, yourPlantsArray: rows}); //render
    }); //query
}); //yourPlants

//updatePlantProperties
app.post("/updatePlantProperties", (req,res) => {

  let sql = `UPDATE LoginPlant
  SET
	  Description = ?,
    Hardiness = ?,
    WaterFrequency = ?,
    Soil = ?,
    Temperature = ?,
    LightExposure = ?,
    Fertilization = ?
  WHERE
	  LoginId = ? AND PlantId = ?`;
	  
	//input validation; allow blank input
	if(!(validator.lengthValid(req.body.description, 0, 500) || req.body.description.length == 0)) {
	  res.send({message:"Error: Notes are not within 0 to 500 characters."});
	}
	else if(!(validator.lengthValid(req.body.hardiness, 0, 50) || req.body.hardiness.length == 0)) {
	  res.send({message:"Error: Hardiness is not within 0 to 50 characters."});
	}
	else if(!(validator.lengthValid(req.body.waterFreq, 0, 50)  || req.body.waterFreq.length == 0)) {
	  res.send({message:"Error: Water Frequency is not within 0 to 50 characters."});
	}
	else if(!(validator.lengthValid(req.body.soil, 0, 50) || req.body.soil.length == 0)) {
	  res.send({message:"Error: Soil is not within 0 to 50 characters."});
	}
	else if(!(validator.lengthValid(req.body.temperature, 0, 50) || req.body.temperature.length == 0)) {
	  res.send({message:"Error: Temperature is not within 0 to 50 characters."});
	}
	else if(!(validator.lengthValid(req.body.lightExposure, 0, 50) || req.body.lightExposure.length == 0)) {
	  res.send({message:"Error: Light Exposure is not within 0 to 50 characters."});
	}
	else if(!(validator.lengthValid(req.body.fertilization, 0, 50) || req.body.fertilization.length == 0)) {
	  res.send({message:"Error: Fertilization is not within 0 to 50 characters."});
	}
	else {
  	let sqlParams = [req.body.description ,req.body.hardiness, req.body.waterFreq
  	,req.body.soil, req.body.temperature, req.body.lightExposure, req.body.fertilization
  	,req.body.LoginId, req.body.PlantId];
  
    pool.query(sql, sqlParams, (err, rows) => {
      if(err) throw err;
      console.log(rows.affectedRows.toString());
      res.send({message:"Your plant data was saved!"});
    }); //query
	} //if else
}); //updatePlantProperties

//plantTalk
app.get("/plantTalk", ifNotLoggedin, async (req, res) => {
	res.render("plantTalk",{
	  "isLoggedIn":req.session.logged_in
	}); //render
}); //plantTalk

//plantTalk post
app.post("/plantTalk", uploadS3.single('file1'), function (req, res, next) {
  const file = req.file;
  let topic = req.body.topic;
  let posttext = req.body.posttext;
  let plantid = req.body.usersPlant;
  if (!file) {
    //const error = new Error('Please upload a file');
    //error.httpStatusCode = 400;
    //return next(error);
    res.render('plantTalk', {message: `Please upload a file`});
  }
  else if (plantid== "Select a plant to post about") {
    //const error = new Error('Please select a plant');
    //error.httpStatusCode = 400;
    //return next(error);
    res.render('plantTalk', {message: `Please select a plant`});
  }
  else if (topic.length == 0) {
    //const error = new Error('Please enter a topic');
    //error.httpStatusCode = 400;
    //return next(error);
    res.render('plantTalk', {message: `Please enter a topic`});
  }
  else if (posttext.length == 0) {
    //const error = new Error('Please enter a post');
    //error.httpStatusCode = 400;
    //return next(error);
    res.render('plantTalk', {message: `Please enter a post`});
  }
  else{
    let filepath = req.file.location;
    pool.query("INSERT INTO Post (PlantId, PostDte, Topic, PostText, Image_Url, LoginId) VALUES (?, CURRENT_TIMESTAMP(), ?, ?, ?, ?)",
                  [plantid, topic, posttext, filepath, req.session.login_id], function (err, rows, fields) {
          if (err) throw err;
          res.render('plantTalk', {message: `You post was published successfully.`});
    });
  }
}); //plantTalk post

app.get("/api/getMyPlants",  function(req, res) {
  let sql = "SELECT * FROM LoginPlant lp INNER JOIN Plant p on p.PlantId = lp.PlantId Where lp.LoginId = ? ORDER BY SortOrder";
  pool.query(sql, [req.session.login_id], function (err, rows) {
     if (err) throw err;
     res.send(rows);
  });  
});//getMyPlants

// get Plant Talk posts
app.get("/api/getPosts",  function(req, res) {
  let sql = "SELECT p.PostId, p.PlantId, p.PostDte, p.Topic, p.PostText, p.Image_Url, l.LoginName, pl.Common_Name, pl.Scientific_Name, pl.Family, pl.Genus, lp.Hardiness, lp.WaterFrequency, lp.Soil, lp.LightExposure, lp.Fertilization, lp.Description FROM Post p INNER JOIN Login l on p.LoginId = l.LoginId INNER JOIN LoginPlant lp on p.LoginId = lp.LoginId AND p.PlantId = lp.PlantId  INNER JOIN Plant pl on p.PlantId = pl.PlantId ORDER BY PostDte DESC";
  pool.query(sql, function (err, rows) {
     if (err) console.log(err);
     res.send(rows);
  });  
});

// post Plant Talk comments
app.post("/addCommment",  function(req, res) {
  let postId = req.body.postId;
  let comment = req.body.userComments;
  if(comment.length == 0){
    res.render('plantTalk', {message: `Please add a comment`});
  }
  else{
    pool.query("INSERT INTO Comment (PostId, CommentDte, LoginId, CommentText) VALUES (?, CURRENT_TIMESTAMP(), ?, ?)",
                  [postId, req.session.login_id, comment], function (err, rows, fields) {
          if (err) throw err;
          res.render('plantTalk', {message: `You comment was published successfully.`});
        });
  }
});

// get Plant Talk comments
app.get("/api/getComments",  function(req, res) {
  let sql = "SELECT PostId, CommentDte, LoginName, CommentText FROM Comment c INNER JOIN Login l on c.LoginId = l.LoginId ORDER BY CommentDte DESC";
  pool.query(sql, function (err, rows) {
     if (err) console.log(err);
     res.send(rows);
  });  
});

//signIn
app.get("/signIn", async (req, res) => {
	res.render("signIn",{"isLoggedIn":req.session.logged_in}); //render
}); //signIn

app.post("/signIn", function(req, res) {
    
  let login = req.body.login;
  let password = req.body.password;

  if (!validator.lengthValid(login, 5, 200) || !validator.lengthValid(password, 8, 20)) {
    res.render('signIn', {error: 'login or pass invalid'});
  } else {
    pool.query("SELECT * FROM `Login` WHERE `LoginName` = ?", login, (error, result) => {
      if (error) throw error;
      if (result.length === 0) {
        res.render('signIn', {error: 'No such user'});
      } else {
        let user = result[0];
        bcrypt.compare(password, user['HashedPwd'], (error, result) => {
          if (error) throw error;
          if (result) {
            req.session.name = user['LoginName'];
            req.session.login_id = user['LoginId'];
            req.session.logged_in = true;
            res.redirect('/');
          } else {
            res.render('signIn', {error: 'Wrong password'});
          }
        })
      }
    });
  }
});

//register
app.get("/register", async (req, res) => {
	res.render("register"); //render
}); //register

app.post('/register', function(req, res) {
  let email = req.body.email;
  let password = req.body.password;
  let re_password = req.body.re_password;
  let login = req.body.login;
  let fname = req.body.fname;
  let lname = req.body.lname;
  let gender = req.body.gender;
  let zip = req.body.zip;
  console.log(req.body);

  // an field is missing
  if (!validator.lengthValid(login, 5, 200) || !validator.lengthValid(password, 8, 20))
  {
    res.render('register', {error: 'Invalid login or password length'});
  } else if (!validator.lengthValid(email, 5, 200)) {
    res.render('register', {error: 'Invalid email length'});
  } else if (!validator.isEmail(email)) { // Wrong format
    res.render('register', {error: 'Wrong email format'});
  } else if (!validator.alphabetOnly(login)) {
    res.render('register', {error: 'Only alphanumeric logins allowed'});
  } else if (password !== re_password) {
    res.render('register', {error: 'Passwords do not match'});
  } else {
        // Check if email exists
        pool.query("SELECT * FROM Login WHERE Email=?", [email], function (error, result) {
        if (error) throw error;
        if (result.length > 0) { res.render('register', {error: 'This email already exists'}); }
        else {
          bcrypt.genSalt(10, function(error, salt) {
            if (error) throw error;
            bcrypt.hash(password, salt, function(error, hash) {
              if (error) throw error;
              pool.query("INSERT INTO Login (LoginName, HashedPwd, Email, FirstName, LastName, Gender, ZipCode) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [login, hash, email, fname, lname, gender, zip], function(error, result) {
                res.render('register', {message: `You have been registered, try logging in`});
              });
            });
          });
        } });
  }
});

//findPlants
app.get("/findPlants", async (req, res) => {
	res.render("findPlants",{"isLoggedIn":req.session.logged_in}); //render
});

//logout
app.get("/signout", (req,res) => {
  req.session.destroy();
  res.redirect("/");
}); //logout

//search for plants
app.get("/search", async (req, res) => {
    let keyword = "";
    if (req.query.keyword){
        keyword = req.query.keyword;
        let apiUrl = `https://trefle.io/api/v1/plants/search?token=6t4ZVV4DE7bKaqSg1CDFPHq3r5giNXINF3qlk43Povk&q=${keyword}`;
        let response = await fetch(apiUrl);
        let data = await response.json();
        data = data.data;
        let idArray = [];
        let imageUrlArray = [];
        let commonNameArray = [];
        let scienceNameArray = [];
        let genusArray = [];
        let familyNameArray = [];
        for(let i = 0; i < data.length; i++)
        {
            idArray.push(data[i].id);
            imageUrlArray.push(data[i].image_url);
            commonNameArray.push(data[i].common_name);
            scienceNameArray.push(data[i].scientific_name);
            familyNameArray.push(data[i].family);
            genusArray.push(data[i].genus);
        }
        let isVisible = (req.session.logged_in)? "": "hidden";
        res.render("results", {"isLoggedIn":req.session.logged_in, "idArray":idArray, "imageUrlArray":imageUrlArray, "commonNameArray":commonNameArray, "scienceNameArray":scienceNameArray,"familyNameArray": familyNameArray, "genusArray":genusArray, "isVisible": isVisible});
    }
});

// starting server
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Express server is running...");
});