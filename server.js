
const port = 3000;
const express = require('express');
const app = express();
const Sequelize = require('sequelize');

/* Database Setup */
const dbClient = new Sequelize(process.env.POSTGRE_URI);


// Testing the database connection
dbClient.authenticate().then(() => {
    console.log("Connection enabled");
}).catch((err) => {
    console.log(err);
});


app.get('/', (req, res) => {
    res.send('Main view');
});


app.listen(3000, () => {
    console.log(`Server running on port ${port}`)
})