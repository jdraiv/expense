
const port = 3000;
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


/* Middleware Setup */
app.use(bodyParser.json());
app.use(cookieParser('supersecret'));


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
        type: Sequelize.INTEGER,
        field: 'expense_id',
        primaryKey: true,
        autoIncrement: true
    },
    category: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'category'
    },
    expenseDate: {
        type: Sequelize.DATE,
        field: 'expense_date'
    },
    total: {
        type: Sequelize.INTEGER,
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


app.post('/register', (req, res) => {
    let jsonData = req.body;

    bcrypt.hash(jsonData['password'], bcrypt.genSaltSync(11)).then((hashedPassword) => {
        User.create({email: jsonData['email'], password: hashedPassword, firstName: jsonData['first_name'], lastName: jsonData['last_name'], budget: 0}).then((user) => {
            res.send({"status": "success"});
        }).catch((err) => {
            res.send({"status": "error"});
        });
    });
});


app.post('/auth', (req, res) => {
    let jsonData = req.body;

    User.findOne({
        where: {
            email: jsonData['email']
        }
    }).then((user) => {
        // Now that the user has been found, we can proceed to validate the password

        // We create the tokens before entering the compare task
        let jsonToken = jwt.sign({userID: user.email, exp: Math.floor(Date.now() / 1000) + (60 * 15)}, 'supersecret');
        let refreshToken = jwt.sign({userID: user.email}, 'supersecret', {expiresIn: '360h'});

        bcrypt.compare(jsonData['password'], user.password).then((result) => {
            if (result) {
                res.cookie('expense-jwt', jsonToken, {signed: true, httpOnly: true});
                res.cookie('expense-rtk', refreshToken, {signed: true, httpOnly: true});

                res.send({"status": "success"});
            }
            else {
                res.send({"status": "error", "message": "Incorrect email or password"});
            }
        }).catch((err) => {
            console.log(err);
        })
    });
});


app.listen(3000, () => {
    console.log(`Server running on port ${port}`)
})