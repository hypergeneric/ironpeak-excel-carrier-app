const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const path = require('path');



dotenv.config();

// Import routes
const pool = require("./helpers/pool");
const authRoutes = require('./routes/authRoutes');
const csvRoutes = require('./routes/csvRoutes');

const configurePassport = require('./passport');

const app = express();

const herokuDomain = process.env.HEROKU_URL_BASE.replace(/\/$/, '');

const allowedOrigins = [
    'http://localhost:3000', // local front-end
    'https://localhost:3000', // local front-end
    'http://localhost', // local front-end
    'https://hypergeneric.com', // Sample front-end
    'https://secret-dawn-68319-79b8049a9538.herokuapp.com',
    'https://ironpeak-carrier-app-0633de823338.herokuapp.com',
    'https://ironpeak-excel-carrier-app-2d9961a2e102.herokuapp.com',
    'https://iroquois-group.webflow.io',
    'https://ironpeaknetwork.com',
    'https://ironpeak.com',
    'https://www.ironpeaknetwork.com',
    'https://www.ironpeak.com',
    `${herokuDomain}`,

];

const corsMiddleware = (req, res, next) => {
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
        return res.status(403).json({ message: 'CORS policy violation: Origin not allowed' });
    }

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
};

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        console.info("origin = ",origin);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('uploads'));
app.use(express.static('public'));

app.enable('trust proxy');
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'your_session_secret',
    resave: true,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: true,
        maxAge: 3600000,
    }
}));

app.use(passport.initialize());
app.use(passport.session());



app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes to render HTML pages
app.get('/', (req, res) => {
    res.render('login', { user: req.user });
});

app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

app.get('/reset-password/:token', (req, res) => {
    const { token } = req.params;
    res.render('reset-password', {token});
});


app.get('/upload', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('upload', { user: req.user });
    } else {
        res.redirect('/');
    }
});

app.get('/list', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const result = await pool.query('SELECT * FROM uploads ORDER BY uploaded_time DESC');
            res.render('uploadsList', { uploads: result.rows });
        } catch (error) {
            console.error('Error fetching uploads:', error);
            res.status(500).json({ message: 'Error fetching uploads' });
        }
    } else {
        res.redirect('/');
    }
});

app.get('/carrier/states/', async (req, res) => {
    if (req.isAuthenticated()) {
        const {id} = req.query;
        res.render('carriersGrid', {id});
    } else {
        res.redirect('/');
    }
});

// Routes for APIs
app.use('/api/auth', authRoutes);
app.use('/api/csv', csvRoutes);

// Start the server
const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

