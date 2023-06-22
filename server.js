const express = require('express')
const cron = require("node-cron");
const axios = require('axios')
const cheerio = require('cheerio')
require('dotenv').config();


const app = express()

let prev_product_list = []
let sent = false


cron.schedule(process.env.CRON_EXPRESSION, function () {
  processData(process.env.CRAWL_URL, process.env.KEYWORD)
});


app.listen(process.env.PORT, function () {

  console.log('It\'s working on port ' + process.env.PORT)

})

function sendNotificationIfNeeded(product_list) {

  if (prev_product_list !== product_list && !sent) {
    console.log("send notification...")
    const url = `${process.env.TELEGRAM_BOT_API}${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`
    const product_list_string = product_list.map(product => {
      return `<b>${product.title}</b>\n${product.price}\n\n<a href="${process.env.APPLE_BASE_URL + product.url}">Click here!</a>`
    }).join('\n\n')
    const request = {
      chat_id: process.env.TELEGRAM_BOT_CHANNEL_ID,
      parse_mode: 'HTML',
      text: `Stock available now 👋\n\n${product_list_string}`
    }
    sendData(url, request)
    prev_product_list = product_list
  }
}

function processData(url, keyword) {
  fetchData(url).then((res) => {
    const html = res.data;
    const $ = cheerio.load(html);

    const ul = $(".rf-refurb-category-grid-no-js").children()
    const li = $(ul).children()

    const product_list = li.map((i, e) => {
      // console.log(i)
      // console.log($(e).children('div').text().trim())
      // console.log($(e).children('h3').text().trim())
      let a = $(e).children('h3').children('a')
      return a.map((ai, ae) => ({
        // console.log(i, ai)
        // console.log($(ae).attr('href'))
        price: $(e).children('div').text().trim(),
        title: $(e).children('h3').text().trim(),
        url: $(ae).attr('href'),
      })).get()
    }).toArray()

    // console.log(product_list.toArray())
    // console.log(product_list.toArray().length)

    let filtered_product_list = product_list

    if (keyword) {
      filtered_product_list = product_list.filter(product => product.title.startsWith(keyword))
    }

    if (filtered_product_list.length > 0) {
      sendNotificationIfNeeded(filtered_product_list)
    } else {
      console.log("no result")
    }
  })
}


async function fetchData(url) {
  // make http call to url
  let response = await axios(url, { timeout: 20000 }).catch((err) => console.log(err));

  if (response.status !== 200) {
    console.log("Error occurred while fetching data");
    return;
  }
  return response;
}

function sendData(url, request) {
  console.log(request)
  axios.post(url, request)
    .then((response) => {
      sent = true
      console.log('sent successfully!')
    }).catch((error) => {
      sent = false
      console.log(error)
    });
}

