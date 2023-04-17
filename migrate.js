import mysql from 'mysql';
import dotenv from 'dotenv';
dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
});

db.connect((err) => {
    if (err) throw err;
    console.log('connected');
});

const date = new Date();
let dbName = `data_lamudi_${date.toISOString().slice(0, 10).replace(/\-/g, '')}`;
db.query(`DROP DATABASE IF EXISTS ${dbName}; `, (err) => {
    if (err) throw err;
    console.log('checking database finish');
});

db.query(`CREATE DATABASE ${dbName} `, (err) => {
    if (err) throw err;
    console.log('database success created');
});

const table = `CREATE TABLE ${dbName}.data(id BIGINT NOT NULL AUTO_INCREMENT, title TEXT NULL, address TEXT NULL, price TEXT NULL, luas TEXT NULL, latitude TEXT NULL, longitude TEXT NULL, url TEXT NULL, PRIMARY KEY(id)) ENGINE = InnoDB; `;

db.query(table, (err) => {
    if (err) throw err;
    console.log('table success created');
})

db.end((err) => {
    if (err) throw err;
    console.log('db disconnect');
});

