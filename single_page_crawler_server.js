const express = require('express')
const cron = require("node-cron");
const axios = require('axios')
const cheerio = require('cheerio')
require('dotenv').config();


const app = express()

var send_notification = false
var sent = false
var product = {
  title: null,
  price: null
}

cron.schedule(process.env.CRON_EXPRESSION, function () {
  processData(process.env.CRAWL_URL)
  sendNotificationIfNeeded()
});


app.listen(process.env.PORT, function () {

  // if (process.env.NODE_ENV !== 'production') {
  //   require('dotenv').config();
  // }

  console.log('It\'s working on port ' + process.env.PORT)
  console.log("crawling website " + process.env.CRAWL_URL)

})

function sendNotificationIfNeeded() {
  if (send_notification && !sent) {
    console.log("send notification...")
    const product_url = process.env.CRAWL_URL
    const url = `${process.env.TELEGRAM_BOT_API}${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`
    const request = {
        chat_id: process.env.TELEGRAM_BOT_CHANNEL_ID,
        parse_mode: 'HTML',
        text: `Stock available now 👋\n\n<b>${product.title}</b>\n${product.price}\n\n<a href="${product_url}">Click here!</a>`
   }
    sendData(url, request)
    // console.log(request)
  }
}

function processData(url) {
  fetchData(url).then( (res) => {
    const html = res.data;    
    const $ = cheerio.load(html);
    const title = $("h1[class='rf-pdp-title']").text().trim()
    const price = $(".rf-pdp-currentprice").text().trim()
    product = {title: title, price: price}
    const disabled = $("button[name='add-to-cart']").attr().disabled
    if (disabled) {
      send_notification = send_notification? !send_notification : send_notification
      sent = false
      console.log(`can not add to cart - need to send notification? ${send_notification}, sent? ${sent}`)
    } else {
      send_notification = send_notification? send_notification : !send_notification
      console.log(`can add to cart - need to send notification? ${send_notification}, sent? ${sent}`)
    }
  })
}


async function fetchData(url){
  // console.log("Crawling data...")
  // make http call to url
  let response = await axios(url, {timeout: 20000}).catch((err) => console.log(err));

  if(response.status !== 200){
      console.log("Error occurred while fetching data");
      return;
  }
  return response;
}

function sendData(url, request){
  axios.post(url,request)
               .then((response) => { 
                    // res.status(200).send(response);
                    sent = true
                    console.log('sent successfully!')
               }).catch((error) => {
                    // res.send(error);
                    sent = false
                    console.log(error)
               });
}

