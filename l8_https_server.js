var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');
var basicAuth = require('basic-auth-connect');
var auth = basicAuth(function ( user, pass )
{
  return (( user === 'cs360' ) && ( pass === 'test' ));
});
var http = require('http');
var fs = require('fs');
var url = require('url');
var app = express();
app.use(bodyParser());

var ROOT_DIR = "html";

var options = {
  host: '127.0.0.1',
  key: fs.readFileSync('ssl/server.key'),
  cert: fs.readFileSync('ssl/server.crt')
};

http.createServer(app).listen(80);
https.createServer(options, app).listen(443);

app.get('/', function ( request, response )
{
  console.log("A CONNECTION");
  response.send("Get Index");
  //response.end(200);
});

app.use('/', express.static('./html', {maxAge: 60*60*1000}));

app.get('/CS360/getcity', function ( request, response )
{
  // execute "getcity" REST service...

  var urlObj = url.parse(request.url, true, false);

  console.log("getcity routine");

  console.log(ROOT_DIR + urlObj.pathname);
  console.log("URL search: " + urlObj.search);
  if( urlObj.search )
  {
    console.log("does 'q' exist? " + urlObj.search.indexOf("q"));
    if( urlObj.search.indexOf("q") >= 0 )
    {
      console.log("URL query: " + urlObj.query['q']);

      fs.readFile(ROOT_DIR + "/CS360/cities.dat.txt", function (err, data)
      {
        if(err) throw err;
        var cities = data.toString().split("\n");
        var myRegEx = new RegExp("^"+urlObj.query['q']);
        var jsonresult = [];
        for(var i=0; i<cities.length; i++)
        {
          if( cities[i].search(myRegEx) != -1 )
            jsonresult.push({city:cities[i]}); // only add cities that contain search string
        }
        response.writeHead(200);
        response.end(JSON.stringify(jsonresult));
      });
    }
  }
});

app.post('/CS360/clear', auth, function (request, response )
{
  console.log("clearing comments...");

  var MongoClient = require('mongodb').MongoClient;

  MongoClient.connect("mongodb://localhost/weather", function(err, db)
  {
    if(err) throw err;
          
    db.collection('comments').remove({}, function(err){if(err) throw err;});
  });

  // report everything went fine so that the client stops repeating info to the server

  console.log("cleared.");

  //response.writeHead(200);
  //response.end("");
  response.status(200);
  response.end();
});

app.get('/CS360/comment', function ( request, response )
{
  console.log("comment GET routine");
      
  // read all of the database entries and return them in a JSON array
      
  var MongoClient = require('mongodb').MongoClient;
     
  // access 'weather' database

  MongoClient.connect("mongodb://localhost/weather", function( err, db )
  {
    if( err ) throw err;
        
    // access 'comments' collection

    db.collection("comments", function( err, comments )
    {
      if( err ) throw err;

      // get all items in 'comments' collection
      comments.find( function( err, items )
      {
        items.toArray( function( err, itemArray )
        {
          console.log("Document Array: ");
          console.log(itemArray);
            
          //response.writeHead(200);
          response.json(itemArray);
          //response.end(JSON.stringify(itemArray));
          response.end();
        });
      });
    });
  });
});
app.post('/CS360/comment', auth, function ( request, response )
{
  console.log("comment POST routine");
  //console.log(request.body);
  //console.log(request.body.Name);
  //console.log(request.body.Comment);

  // read the form data

  /*var jsonData = "";
  request.on('data', function( chunk )
  {
    console.log("comment POST on data");
    jsonData += chunk;
  });
  request.on('end', function()
  {*/
    console.log("comment POST on end");
    //var requestObj = JSON.parse( jsonData );
    console.log("request.body: " + request.body);
    console.log("Name: " + request.body.Name);
    console.log("Comment: " + request.body.Comment);

    // put it in the database
      
    var MongoClient = require('mongodb').MongoClient;

    MongoClient.connect("mongodb://localhost/weather", function(err, db)
    {
      if(err) throw err;
          
      db.collection('comments').insert(request.body, function(err, records)
      {
        //console.log( "Record added as " + records[0]._id );
      });
    });

    // report everything went fine so that the client stops repeating info to the server

    //response.writeHead(200);
    response.status(200);
    response.end();
  //});
});