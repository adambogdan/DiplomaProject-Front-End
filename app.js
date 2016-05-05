var express=require('express');
var bodyParser=require('body-parser'); // read the body, post information on the request
var mongoose=require('mongoose');
var sessions=require('client-sessions');
var bcrypt=require('bcryptjs');
var engines = require('consolidate'); // convertire jade-to-html

var Schema=mongoose.Schema;
var ObjectId=Schema.ObjectId;

var User=mongoose.model('User',new Schema({
	id:ObjectId,
	firstName:String,
	lastName:String,
	email:{type:String,unique:true},
	password:String,
}));


var app=express();

app.set('views', __dirname + '/public'); //directorul unde se afla fisierele statice de vizualizare
app.use(express.static(__dirname + '/public'));
app.engine('html', engines.mustache);  //http://stackoverflow.com/questions/16111386/node-js-cannot-find-module-html
app.set('view engine', 'html'); //setare view

app.locals.pretty=true; //in codul sursa nu apare minified

//conexiune la MongoLab
var username= "bogdan"; //username for MongoLab
var password = "bogdan"; //password
var addr = "@ds054128.mlab.com:54128/experiement"; //address to MongoLab
var url = 'mongodb://' + username + ':' + password + addr;
mongoose.connect(url); //connection with mongoose module


//middleware -take the body of http request, pana a executa functiile de mai jos
app.use(bodyParser.urlencoded({extended:true}));

app.use(sessions({
	cookieName:'session',
	secret:'dasajhdad7whfeh9fhew',
	duration:30*60*1000, //timpul de expirare
	activeDuration:5*60*1000,
	httpOnly:true, //don't let browser javascript access cookies
	secure:true, //only use cookies over https
	ephemeral:true,// delete this cookie when the browser is closed
}));


//middleware
app.use(function(req,res,next){
	if(req.session && req.session.user){
		User.findOne({email:req.session.user.email},function(err,user){
			if(user){
				req.user=user;
				delete req.user.password;//securitate sporita, pe langa hash, parola este stearsa din sesiune
				req.session.user=req.user;
				res.locals.user=req.user;
			}
			next();
		});
	}else{
		next();
	}
}); 

function requireLogin(req,res,next){
	if(!req.user){
		res.redirect('/login');
	}else{
		next();
	}
};

function loggedIn(req, res, next) {
    if (req.user) {
	  /*  alert("Logged In"); */
       next();	
    } else {
        res.redirect('/login');
		/* alert("Logged Out"); */
    }
}

app.get('/',function(req,res){
	res.render('index.html');
});

app.get('/register',function(req,res){
	res.render('register.html');
});

app.get('/demo',function(req,res){
	res.render('demo.html');
});

app.get('/photogallery',function(req,res){
	res.render('photogallery.html');
});

//daca user-ul trimite un post request(completeaza form-ul si dau submit) -> luam ce trimite user-ul si afisam in browser
app.post('/register',function(req,res){
	//res.json(req.body);
	var hash=bcrypt.hashSync(req.body.password,bcrypt.genSaltSync(10));
	var user=new User({
		firstName:req.body.firstName,
		lastName:req.body.lastName,
		email:req.body.email,
		password:hash,
	});
	user.save(function(err){
		if(err){
			console.log(err);
			var err="Something bad happened";

			if(err.code===11000){
				error='That email is already taken, try another.';
			}
			res.render('register.html',{error:error});
		}
		else
		{
			res.redirect('/dashboard');
		}
	})
});

app.get('/login',function(req,res){
	res.render('login.html');
});

app.post('/login',function(req,res){
	User.findOne({email:req.body.email},function(err,user){
		if(!user){
			res.render('login.html',{error:'Invalid email or password.'});
		}else{
			if (bcrypt.compareSync(req.body.password,user.password)){
				req.session.user=user; //set-cookie:session{email:"/..passqword"}
				/* req.session.success = 'Authenticated as ' + user.name                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
          + ' click to <a href="/logout">logout</a>. '                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
          + ' You may now access <a href="/restricted">/restricted</a>.';    */  
				res.redirect('/dashboard');
				                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
/*         res.redirect('back');    */
			}else{
				res.render('login.html',{error:'Invalid email or password.'});
			}		
		}
	});
});

app.get('/dashboard',requireLogin,function(req,res){
/*	if(req.session && req.session.user){
		User.findOne({email:req.session.user.email},function(err,user){
			if(!user){
				req.session.reset();
				res.redirect('/login');
			}else{
				res.locals.user=user;
				res.render('dashboard.jade');
			}
		});
	}else{
		res.redirect('/login');
	}*/
	res.render('dashboard.html');
});

app.get('/logout',function(req,res){
	req.session.reset();
	res.redirect('/login');
});


app.listen(3001);