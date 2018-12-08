/* jshint esversion:6,node:true */
'use strict';

const https = require('https');
const fs = require('fs');

function loadImage(url, path) {
  if (!fs.existsSync(path)) {
    https.get(url, (resp) => {
        resp.setEncoding('binary');

        let data = [];
        let firstChunk = true;

        // A chunk of data has been recieved.                                         
        resp.on('data', (chunk) => {
          if (firstChunk) {
            console.log('loading ' + url);
            firstChunk = false;
          }
          data.push(Buffer.from(chunk, 'binary'));
        });

        // The whole response has been received. Print out the result.                
        resp.on('end', () => {
          let ws = fs.createWriteStream(path);

          ws.on('ready', () => {
              console.log('saving ' + url + ' to ' + path);
              //throw "break";
              ws.end(Buffer.concat(data));
            })
            .on("error", (err) => {
              console.log("Error: " + err.message);
            });
        });
      })
      .on("error", (err) => {
        console.log("Error: " + err.message);
      });
  }
}

const monthMap = {
  "января": "01",
  "февраля": "02",
  "марта": "03",
  "апреля": "04",
  "мая": "05",
  "июня": "06",
  "июля": "07",
  "августа": "08",
  "сентября": "09",
  "октября": "10",
  "ноября": "11",
  "декабря": "12"
};


function loadMonth(month) {
  let i = 1;
  month.slides.forEach((slide) => {
    //console.log(i, slide);

    const url = slide.src.replace(/\/crop.*00\//i, '/');
    const folder = slide.title.split(' ').map((s) => monthMap.hasOwnProperty(s) ? monthMap[s] : s).reverse().join('-') + '/';
    const file = (i.toString().padStart(2, '0') + '. ' + slide.text + '.jpg').replace(/:/g, '.');

    fs.mkdirSync(folder, {
      recursive: true
    });
    loadImage(url, `${folder}${file}`);

    i++;
  });
}

function loadGalleries(maxGalleries) {
  const url = 'https://www.ndv.ru/ajax/component/BuildingProcess/getGallery?format=json&amount=' + maxGalleries + '&start=0&housingGuid=-&complexId=332';
  https.get(
      url,
      (resp) => {
        let data = '';
        let firstChunk = true;

        // A chunk of data has been recieved.                                         
        resp.on('data', (chunk) => {
          if (firstChunk) {
            console.log('loading ' + url);
            firstChunk = false;
          }
          data += chunk;
        });

        // The whole response has been received. Print out the result.                
        resp.on('end', () => {
          JSON.parse(data).data.forEach((m) => {
            loadMonth(m);
          });
        });
      }
    )
    .on("error", (err) => {
      console.log("Error: " + err.message);
    });
}

loadGalleries(40)
