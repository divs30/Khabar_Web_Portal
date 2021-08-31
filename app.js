//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const _ = require("lodash");

/*************facebook authentication*********/
const passport = require('passport');
const session = require('express-session');
const FacebookStrategy = require('passport-facebook').Strategy
const shareFacebook = require('share-facebook');
/************************************ */
const request = require('request-promise');

/************************************ */
const tinyurl = require("tinyurl-api");




const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/blogSignDB3", {useNewUrlParser: true});

const postSchema = {
  title: String,
  content: String
};

const Post = mongoose.model("Post", postSchema);

/**************Authentication Part***************************/

const userSchema = {
  email : String,
  password : String
};

const User = mongoose.model("User", userSchema);
console.log("hi");
app.get("/", function(req, res){

  Post.find({}, function(err, posts){
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts
      });
  });
});
console.log("hi");



app.get("/compose", function(req, res){
 
  res.render("compose");
});

app.post("/compose", function(req, res){
  if(req.body.button === "delete"){
    res.redirect("/")
  }

  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });


  post.save(function(err){
    if (!err){
        res.redirect("/");
    }
  });
});


app.post("/facebook-share", function(req, res){

  shareFacebook({
    quote: req.body.title+'\n' +req.body.content,
    href: "http://localhost:3000/auth/facebook/secrets",
    redirect_uri:"http://localhost:3000/auth/facebook/secrets" ,
    app_id : process.env.APP_ID
  });
   
  
});



app.get("/posts/:postId", function(req, res){

const requestedPostId = req.params.postId;
const url = "http://localhost:3000/posts/60cb0b296245a50876acc4fc";
  
(async () => {
  url = await tinyurl("http://localhost:3000/posts/60cb0b296245a50876acc4fc");

  console.log(url);
})();
  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      title: post.title,
      content: post.content,
      id : req.params.postId,
      url:url
    });
  });

});

app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});
/**************Authentication Part***************************/

app.get("/signLog", function(req, res){
  //console.log("I am being targeted");
  res.render("signLog");
});


app.get("/secrets", function(req, res){
  Post.find({}, function(err, posts){
    res.render("secrets", {
      posts: posts
      });
  });
});
/****** middle ware****/
 

app.use(passport.initialize());

app.use(passport.session());
app.use(session({secret:process.env.SECRET}));

/*facebook strategy*/
console.log(process.env.APP_ID)
passport.use(new FacebookStrategy({

  // pull in our app id and secret from our auth.js file
  clientID        : process.env.APP_ID,
  clientSecret    : process.env.APP_SECRET,
  callbackURL     : "http://localhost:3000/auth/facebook/secrets",
  //about, email, accounts, link,
  profileFields   : ['id','displayName','name','gender','picture.type(large)','email']

},//DONE IS CALL BACK FUNCTION AND THE OTHER ARE THE HINGS THAT WILL BE RETURNED BY B
function(token, refreshToken, profile, done) {

  console.log(token);
  console.log(refreshToken);
  console.log(profile);
  return done(null,profile);
}));


passport.serializeUser(function(user, done) {
  done(null, user);
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {

  return done(null,id);
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email'}));

app.get('/auth/facebook/secrets',
        passport.authenticate('facebook', {
            successRedirect : '/secrets',
            failureRedirect : '/'
        }));




/**************Authentication Part***************************/




app.get("/register", function(req,res){
  res.render("register");
});


app.post("/register", function(req, res){
    if(req.body.username === "faculty@iemcal.com"){
      let newUser = new User({
        email: req.body.username,
        password : req.body.password
      });
      newUser.save(function(err){
        if(err){
          console.log(err);
        }
        else{

          Post.find({}, function(err, posts){
            res.render("secrets", {
              posts: posts
              });
          });
         
        }
      });

    }
    else{
      console.log("nooo");
      res.render("prohibit");
    }
    
});


app.get("/login", function(req, res){

  res.render("login");
});

app.post("/login", function(req, res){
 
  User.findOne({email : req.body.username}, function(err, foundUser){
    if(err){
      console.log(err);
    }
    else{
      
      if(foundUser){
        if(foundUser.password === req.body.password){
          Post.find({}, function(err, posts){
            res.render("secrets", {
              posts: posts
              });
          });
        }
      }
    }
  });
});


app.get("/delete", function(req, res){
    res.render("delete");
});

app.post("/delete", function(req, res){
  
  Post.deleteMany({title: req.body.postTitle})
  .then(function(){console.log("success")})
  .catch(function(error){
    console.log(error); // Failure
  });

   /*
    const req_name = _.lowerCase(req.body.postTitle);
      Post.forEach(function(post){
      console.log("again");
        if(_.lowerCase(post.title) === req_name){
          console.log("yes");
          Post.findByIdAndRemove(post._id, function(err){
            if(!err){ 
              //res.render("Operation successfull");
              res.redirect("/secret");
            }
        
          });
        
              Post.deleteMany({title : post.title}, function(){
            if(!err){ 
              //res.render("Operation successfull");
              
            }
          });
          */
     
    res.redirect("/");
       
});


/*
app.post("/edit", function(req, res){

})
*/

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
