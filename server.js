/* eslint-disable camelcase */
var empty = require('is-empty')
var express = require('express')
var request = require('request')
var bodyParser = require('body-parser')
var cheerio = require("cheerio")
var http = require("http")
var mongoose = require('mongoose')
var nodemailer = require('nodemailer')

var app = express()
app.set('views', './views')
app.set('view engine', 'ejs')



app.listen(process.env.PORT || 8099, function () {
  console.log('It\'s working')

  
setInterval(function() {
    http.get("http://mine-crawler.herokuapp.com/");
}, 250000);

})

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'letsplaykc@gmail.com',
    pass: 'timtim12345'
  }
});

var mailOptions = {
  from: 'letsplaykc@gmail.com',
  to: 'timtim_1234@hotmail.com',
  subject: 'Skechers below 299 Sale',
  text: 'https://mine-crawler.herokuapp.com/'
};

app.get('/', function (req, res, next) {
  res.redirect("/search")
})

app.get('/search', function (req, res, next) {

  var loop = function() {

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
      var crawlSchema = new mongoose.Schema({
        html: String
      });
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
                transporter.sendMail(mailOptions, function(error, info){
                  if (error) {
                    console.log(error);
                  } else {
                    console.log('Email sent: ' + info.response);
                  }
                }); 
                
                crawl.save(function(err) {
                  if (err) {
                    console.log('save() error ' + err.name);
                  } else {
                    console.log('Crawl created!')
                  }
                });
              }
          }})

				
      });

      res.send(result_html)

})

  }

  loop()
  setInterval(loop, 12 * 60 * 60 * 1000);
  
})


// eslint-disable-next-line no-path-concat
app.use('/dist', express.static(__dirname + '/dist'))
