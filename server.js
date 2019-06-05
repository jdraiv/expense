
const port = process.env.PORT || 5000;
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

let allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send({"status": "error"});
    }
    else {
      next();
    }
};

app.use(allowCrossDomain);
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
                res.send({
                    "status": "success", 
                    "data": {
                        "email": user.email, 
                        "budget": user.budget, 
                        "first_name": user.firstName, 
                        "last_name": user.lastName,
                        "expense-jwt": jsonToken,
                        "expense-rtk": refreshToken
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


app.put('/update_budget', authMiddleware.isAuthenticated, (req, res) => {
    const userID = tokenUtils.onlyGetUserID(req);

    User.update({
        budget: req.body['budget']
    }, 
    {
        where: {
            email: userID
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
app.post('/create_expense', authMiddleware.isAuthenticated, (req, res) => {
    const userID = tokenUtils.onlyGetUserID(req);

    Expense.create({
        category: jsonData['category'], 
        total: jsonData['total'], 
        expenseDate: jsonData['date'], 
        payee: jsonData['payee'], 
        email: userID
    }).then((expense) => {
        res.send({"status": "success", "data": expense});
    }).catch((err) => {
        res.send({"status": "error", "data": []})
    });
});


app.post('/get_expenses/', authMiddleware.isAuthenticated, (req, res) => {
    const userID = tokenUtils.onlyGetUserID(req);

    Expense.findAll({
        where: {
            email: userID
        }
    }).then((expenses) => {
        res.send({"status": "success", "data": expenses});
    }).catch((err) => {
        res.send({"status": "error", "data": []});
    });
});


app.post('/delete_expense', authMiddleware.isAuthenticated, (req, res) => {
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