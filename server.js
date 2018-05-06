var express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    path = require('path'),
    mysql = require('mysql'),
    hash = require('password-hash'),
    engine = require('ejs-locals');

var app = express();

var port = 4711;

var connection = mysql.createConnection({
    port: 3306,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'node'
});
connection.connect();

app.configure(function () {
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(session({
        secret: 'secret',
        resave: false,
        saveUninitialized: true
    }));
    app.use(bodyParser.json());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'site')));
    app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
});

app.engine('html', require('ejs').renderFile);
app.engine('ejs',engine);
app.set('views', __dirname + '/templates');
app.set('view engine', 'ejs');

app.listen(port, function () {
    console.log('Express is listening on port %s', port);
});

//routes
app.get('/api', function (request, response) {
    response.send('Library API is running');
});
app.get('/', function (request, response) {
    var session = request.session;
    if (!session.email) {
        response.render(path.join(__dirname, 'site/login'));
    } else {
        response.render(path.join(__dirname, 'site/index'));
    }
});

app.post('/api/login', function (request, response) {
    connection.query('SELECT * FROM users WHERE email = ?',
        [request.body.email,
            hash.generate(request.body.password)],
        function (error, result) {
            if (error) {
                response.status(500).send({error: error});
            }
            if (result.hasOwnProperty(0)) {
                var password = result[0].password;
                if (hash.verify(request.body.password, password)) {
                    var session = request.session;
                    session.email = request.body.email;
                    session.username = result[0].username;
                    response.send({message: "Correct!"});
                } else {
                    response.send({error: 1, message: "Username or password is incorrect"});
                }
            } else {
                response.send({error: 1, message: "Username or password is incorrect"});
            }
        });
});

app.post('/api/register', function (request, response) {
    connection.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [request.body.username,
            request.body.email,
            hash.generate(request.body.password)],
        function (error, result) {
            if (error) {
				console.log(error);
                response.send({error: 1, message: 'This email is alredy used'});
            } else {
                var session = request.session;
                session.email = request.body.email;
                response.send({message: "Registered!"});
            }
        }
    )
});
app.post('/api/signout', function(request, response) {
    var session = request.session;
    session.email = false;
    response.send({message: "Signed out!"});
});

app.get('/api/transactions', function (request, response) {
    connection.query('SELECT tr.id, tr.name, tr.value, tr.type, tr.category_id, tr.date, cat.name as category, col.color_name as categoryColor ' +
        'FROM transactions as tr ' +
        'LEFT JOIN categories as cat ON tr.category_id = cat.id ' +
        'LEFT JOIN categories_colors as col ON cat.color_id = col.id',
        function (error, result) {
            if (error) {
                response.status(500).send({error: error});
            }
            response.send(result);
        });
});


app.get('/api/colors', function (request, response) {
    connection.query('SELECT * from categories_colors',
        function (error, result) {
            if (error) {
                response.status(500).send({error: 'Could not get the colors!'});
            }
            response.send(result);
        });
});

app.get('/api/categories', function (request, response) {
    connection.query('select * from categories', function (error, result) {
        if (error) {
            response.status(500).send({error: 'Something failed!'});
        }
        response.send(result);
    });
});

app.post('/api/categories', function (request, response) {
    connection.query('insert into categories (name,type,color_id) values(?, ?, ?)',
        [request.body.name,
            request.body.type,
            request.body.color],
        function (error, result) {
            if (error) {
                response.status(500).send({error: 'Something failed!'});
            }
            response.send();
        });
});

app.post('/api/transactions', function (request, response) {
    connection.query('insert into transactions (name,value,category_id,type,date) values (?,?,?,?,?)',
        [request.body.name,
            request.body.value,
            request.body.category_id,
            request.body.type,
            request.body.date],
        function (error, result) {
            if (error) {
                response.status(500).send({error: 'Something failed!'});
            }
            response.send();
        });
});


app.delete('/api/transactions/:id', function (request, response) {
    connection.query('delete from transactions where id = ?', [request.params.id],
        function (error, result) {
            if (error) {
                response.status(500).send({error: 'Something failed!'});
            }
            response.status(200).send();
        });
});


app.put('/api/transactions/:id', function (request, response) {
    connection.query('update transactions set name = ?, value = ?, category_id = ?, date = ? where id = ?',
        [request.body.name,
            request.body.value,
            request.body.category_id,
            request.body.date,
            request.params.id
        ], function (error, result) {
            if (error) {
                response.status(500).send({error: 'Something failed!'});
            }
            response.send();
        });
});



