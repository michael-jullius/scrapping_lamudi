import request from 'request';
import cheerio from 'cheerio';
import mysql from 'mysql';
import dotenv from 'dotenv';
dotenv.config();


const date = new Date();
let dbName = `data_lamudi_${date.toISOString().slice(0, 10).replace(/\-/g, '')}`;

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: dbName
});

db.connect((err) => {
    if (err) throw err;
    console.log('db connected');
});

let i = 0;
while (true) {
    i++;
    console.log('page ke ' + i);
    try {
        const url = `https://www.lamudi.co.id/lampung/land/buy/?page=${i}`;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        };
        const mainRequest = await new Promise((resolve, reject) => {
            request({ url, headers }, async (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    resolve(body);
                } else {
                    reject(error);
                    console.log(error);
                }

            });
        });

        const $ = cheerio.load(mainRequest);
        const listings = $('.small-12.columns.card.ListingCell-content.js-MainListings-container.ListingCell-wrapper');
        let value = [];
        for (let i = 0; i < listings.length; i++) {
            const $listings = $(listings[parseInt(i)]);
            let url_child = $listings.find('.js-listing-link').attr('href');
            try {
                const bodyChild = await new Promise((resolve, reject) => {
                    request({ url: url_child, headers }, (errorChild, responseChild, bodyChild) => {
                        if (!errorChild && responseChild.statusCode === 200) {
                            resolve(bodyChild);
                        } else {
                            reject(errorChild);
                        }
                    });
                });
                const $child_listing = cheerio.load(bodyChild);
                let title = $child_listing('.Title-pdp-title').text().replace(/\n\s+/g, "").trim();
                let address = $child_listing('.Title-pdp-address').text().replace(/\n\s+/g, "").trim();
                let price = $child_listing('.Title-pdp-price').text().replace(/\n\s+/g, "").trim();
                let luas = $child_listing('.Title-pdp-attribute-item').text().replace(/\n\s+/g, "").trim();
                let long = $child_listing('.LandmarksPDP-Wrapper').attr('data-lon');
                let lat = $child_listing('.LandmarksPDP-Wrapper').attr('data-lat');
                value.push([title, address, price, luas, lat, long, url_child]);
            } catch (errorChild) {
                console.log(errorChild);
            }
        }

        const sql = 'INSERT INTO `data` (`title`, `address`, `price`, `luas`, `latitude`, `longitude`, `url`) VALUES ?';
        db.query(sql, [value], (err) => {
            if (err) throw err;
            console.log('data success inserted');
        });

        console.log('finished');
    } catch (err) {
        db.end((err) => {
            if (err) throw err;
            console.log('db disconnect');
        });
        break;
    }
}
