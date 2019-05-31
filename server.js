
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

const Expense = dbClient.define('expense', {
    expenseID: {
        type: Sequelize.STRING,
        field: 'expense_id',
        primaryKey: true
    },
    category: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'category'
    },
    onYear: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'on_year'
    },
    onMonth: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'on_month'
    },
    onDay: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'on_day'
    },
    total: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'total'
    },
    payee: {
        type: Sequelize.STRING,
        field: 'payee'
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'email'
        }
    }
}, {
    timestamps: false,
});


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