
const port = process.env.PORT || 3000;
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');

/* Express App */
const app = express();

/* Personal Middleware */
const authMiddleware = require("./middleware/isAuthenticated.js");

// Utils
const tokenUtils = require("./utils/tokens.js");


/* Middleware Setup */

// Without this, the web application is not able to interact with the server
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});


app.use(bodyParser.json());
app.use(cookieParser(process.env.COOKIE_PARSER_KEY));


/* Database Setup */
const dbClient = new Sequelize(process.env.DATABASE_URL);


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
        type: Sequelize.DATEONLY,
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
    res.send("Expense APIS!");
});


app.post('/register', (req, res) => {
    let jsonData = req.body;

    bcrypt.hash(jsonData['password'], bcrypt.genSaltSync(11)).then((hashedPassword) => {
        User.create({
            email: jsonData['email'], 
            password: hashedPassword, 
            firstName: jsonData['first_name'], 
            lastName: jsonData['last_name'], 
            budget: 0
        }).then((user) => {
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
        let jsonToken = tokenUtils.createJWT(jsonData['email']);
        let refreshToken = tokenUtils.createRTK(jsonData['email']);

        bcrypt.compare(jsonData['password'], user.password).then((result) => {
            if (result) {
                res.cookie('expense-jwt', jsonToken, {signed: true, httpOnly: true});
                res.cookie('expense-rtk', refreshToken, {signed: true, httpOnly: true});

                res.send({
                    "status": "success", 
                    "data": {
                        "email": user.email, 
                        "budget": user.budget, 
                        "first_name": user.firstName, 
                        "last_name": user.lastName
                    }
                });
            }
            else {
                res.send({"status": "error", "message": "Incorrect email or password"});
            }
        }).catch((err) => {
            res.send({"status": "error"});
        });
    });
});


app.post('/logout', (req, res) => {
    res.cookie('expense-jwt', "", {maxAge: 0, overwrite: true});
    res.cookie('expense-rtk',  "", {maxAge: 0, overwrite: true});

    res.send({"status": "success", "message": "Successful logout"});
});


app.put('/update_budget', authMiddleware.isAuthenticated, (req, res, next) => {
    let decodedJsonToken = tokenUtils.decodeJWT(req);

    User.update({
        budget: req.body['budget']
    }, 
    {
        where: {
            email: decodedJsonToken.userID
        }
    }).then((result) => {
        if (result == 1) {
            res.send({"status": "success"});
        }
        else {
            res.send({"status": "Unable to update budget"});
        }
    }).catch((err) => {
        res.send({"status": "error"});
    });
});


/* APIS for Expenses */
app.post('/create_expense', authMiddleware.isAuthenticated, (req, res, next) => {
    let jsonData = req.body;
    let decodedJsonToken = tokenUtils.decodeJWT(req);

    Expense.create({
        category: jsonData['category'], 
        total: jsonData['total'], 
        expenseDate: jsonData['date'], 
        payee: jsonData['payee'], 
        email: decodedJsonToken.userID
    }).then((expense) => {
        res.send({"status": "success", "data": expense});
    }).catch((err) => {
        res.send({"status": "error", "data": []})
    });
});


app.post('/get_expenses', authMiddleware.isAuthenticated, (req, res, next) => {
    let decodedJsonToken = tokenUtils.decodeJWT(req);

    Expense.findAll({
        where: {
            email: decodedJsonToken.userID
        }
    }).then((expenses) => {
        res.send({"status": "success", "data": expenses});
    }).catch((err) => {
        res.send({"status": "error", "data": []});
    });
});


app.post('/delete_expense', authMiddleware.isAuthenticated, (req, res, next) => {
    Expense.destroy({
        where: {
            expenseID: req.body['id']
        }
    }).then((result) => {
        if (result == 1) {
            res.send({"status": "success", "message": "Product deleted"});
        }
        else {
            res.send({"status": "error", "message": "Unable to delete product"});
        }
    }).catch((err) => {
        res.send({"status": "error"});
    });
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})