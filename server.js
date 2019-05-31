
const port = 3000;
const express = require('express');
const app = express();
const Sequelize = require('sequelize');


/* Database Setup */
const dbClient = new Sequelize(process.env.POSTGRE_URI);


/* Models */
const User = dbClient.define('user', {
    email: {
        type: Sequelize.STRING,
        primaryKey: true,
        isUnique: true,
        allowNull: false,
        field: 'email'
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'hashed_password'
    },
    firstName: {
        type: Sequelize.STRING,
        field: 'first_name'
    },
    lastName: {
        type: Sequelize.STRING,
        field: 'last_name'
    },
    budget: {
        type: Sequelize.INTEGER,
        field: 'budget'
    }
}, {
    timestamps: false
})


dbClient.authenticate().then(() => {
    console.log("Connection established");
}).catch((err) => {
    console.log(err);
});


app.get('/', (req, res) => {
    res.send('Main view');
});


app.listen(3000, () => {
    console.log(`Server running on port ${port}`)
})