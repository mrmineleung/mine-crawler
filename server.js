/* eslint-disable camelcase */
var empty = require('is-empty')
var express = require('express')
var request = require('request')
var bodyParser = require('body-parser')
var cheerio = require("cheerio")
var http = require("http")
var mongoose = require('mongoose');

var app = express()
app.set('views', './views')
app.set('view engine', 'ejs')



app.listen(process.env.PORT || 8099, function () {
  console.log('It\'s working')

  
setInterval(function() {
    http.get("http://mine-crawler.herokuapp.com/");
}, 300000);

})

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', function (req, res, next) {
  //res.render('index', { e: null })
})

app.get('/search', function (req, res, next) {

  var crawlSchema = new mongoose.Schema({
    html: String
  });


  
    request.get({
      uri: 'https://www.skechers.com.hk/en_HK/men-299?prefn1=size&prefv1=43.5%7C43',
      method: 'GET',
      timeout: 10000,
      followRedirect: true,
      maxRedirects: 10
    }, function (error, response, body) {
      // Error Checking
      
      //console.log(body)
      
      const $ = cheerio.load(body);
      var result_html = $('ul[id=search-result-items]').html()
      //var pname = $('.product-name','.grid-item-info').text()
      //console.log(pname)
      mongoose.connect('mongodb://user:pass1234@ds023098.mlab.com:23098/crawl', {useNewUrlParser: true});
      var db = mongoose.connection;
      db.on('error', console.error.bind(console, 'connection error:'));
      db.once('open', function() {
        // we're connected!


        
        var CrawlInfo = mongoose.model('Crawl', crawlSchema);
				var new_k = {};
				new_k['html'] = result_html;
        var crawl = new CrawlInfo(new_k);
        
        CrawlInfo.findOne({},{_id: 0},{ sort: { '_id': -1 }}, function(err, res){
          if(err){
              console.log(err);
          }
          else{
              console.log(res.html);
              if (result_html != res.html){
                crawl.save(function(err) {
                  //if (err) throw err
                  if (err) {
                    console.log('save() error ' + err.name);
                    //res.writeHead(500,{"Content-Type":"text/plain"});
                    //res.end(JSON.stringify(err.name));
                  } else {
                    console.log('Crawl created!')
                    //db.close();
                    //res.writeHead(200,{"Content-Type":"text/plain"});
                    //res.end("Created: " + JSON.stringify(new_k));
                  }
                });
              }
          }})

				
      });

      res.send(result_html)

})
  
})

// eslint-disable-next-line no-path-concat
app.use('/dist', express.static(__dirname + '/dist'))
