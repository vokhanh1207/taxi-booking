'use strict';
const express = require('express');
const app = express();
const port = process.env.PORT || 2000;
const expressHandlebars = require('express-handlebars');

// cau hinh public folder
// app.use(express.static('views'));
app.use(express.static(__dirname + '/assets'));
app.use(express.static(__dirname + '/public'));

app.engine('hbs', expressHandlebars.engine({
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
    extname: 'hbs',
    defaultLayout: 'layout'
}));


app.set('view engine', 'hbs');

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

//khoi dong web server
app.listen(port, () => {
    console.log(`Server is running at ${port}`);
});