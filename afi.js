/* jshint esversion:6,node:true */
'use strict';

const https = require('https');
const fs = require('fs');

function logErr(err) {
  console.error("Error: " + err.message);
}

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
            ws.end(Buffer.concat(data));
          });
          ws.on("error", logErr);
        });
      })
      .on("error", logErr);
  }
}

function loadMonth(dataId) {
  let url = 'https://afiserebryakova.ru/ajax/construction_load?id=' + dataId;
  https.get(url, (resp) => {
      let data = [];
      let firstChunk = true;

      // A chunk of data has been recieved.                                         
      resp.on('data', (chunk) => {
        if (firstChunk) {
          console.log('loading ' + url);
          firstChunk = false;
        }
        data.push(chunk);
      });

      // The whole response has been received. Print out the result.                
      resp.on('end', () => {
        let firstImage = true;
        JSON.parse(data.join('')).images.forEach((i) => {
          let p = i.src.indexOf('/201');
          if (firstImage) {
            fs.mkdirSync(i.src.substring(p + 1, p + 11), {
              recursive: true
            });
            firstImage = false;
          }
          loadImage('https://afiserebryakova.ru' + encodeURIComponent(i.src).replace(/%2F/gi, '/'), i.src.substring(p + 1, p + 11) + '/' + i.file.replace(/\//g, '-') + '');
        });
      });
    })
    .on("error", logErr);
}

function loadYear(year) {
  let url = 'https://afiserebryakova.ru/about/construction/' + year;
  https.get(
      url, {
        headers: {
          "X-PJAX": true
        }
      },
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
          const matches = data.match(/data-id=\".*?\"/gi);
          if (matches) {
            for (let m of matches) {
              loadMonth(m.replace(/data-id=\"(.*?)\"/, '$1'));
            }
          }
        });
      }
    )
    .on("error", logErr);
}
loadYear(2017);
loadYear(2018);
loadYear(2019);
