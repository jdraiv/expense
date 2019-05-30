
const port = 3000;
const express = require('express');
const app = express();


app.get('/', (req, res) => {
    res.send('Main view');
});


app.listen(3000, () => {
    console.log(`Server running on port ${port}`)
})