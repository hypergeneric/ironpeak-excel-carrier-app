const { Strategy, ExtractJwt } = require('passport-jwt');
const passport = require('passport');

const pool = require("./helpers/pool");

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};

const strategy = new Strategy(opts, async (jwt_payload, done) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [jwt_payload.id]);
        if (rows.length > 0) {
            return done(null, rows[0]);
        }
        return done(null, false);
    } catch (error) {
        return done(error, false);
    }
});

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (rows) {
            done(null, rows[0]);
        } else {
            done(null, null);
        }
    } catch (error) {
        done(error, null);
    }
});

module.exports = (passport) => {
    passport.use(strategy);
};
