const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');

const pool = require("./../helpers/pool");

dotenv.config();

const sendResetEmail = async (email, token) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const resetLink = `${process.env.HEROKU_URL_BASE}reset-password/${token}`;
    const mailOptions = {
        from: process.env.RESET_FROM_EMAIL,
        to: email,
        subject: 'Password Reset',
        text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Internal server error' });
            }
            const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ success: true, message: 'Login successful', token, user_id: user.id, user_email: user.email });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length === 0) {
            return res.status(400).json({ message: 'No user found with that email address' });
        }

        const user = rows[0];
        const token = crypto.randomBytes(32).toString('hex'); // Generate a reset token
        const expiration = new Date(Date.now() + 3600000); // Token valid for 1 hour

        await pool.query('UPDATE users SET reset_token = $1, reset_token_expiration = $2 WHERE id = $3', [token, expiration, user.id]);
        await sendResetEmail(email, token);

        res.json({ message: 'Reset link sent to your email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        const expiration = new Date(Date.now());

        const { rows } = await pool.query('SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiration > $2', [token, expiration]);
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const user = rows[0];
        const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash the new password
        await pool.query('UPDATE users SET password = $1, reset_token = NULL, reset_token_expiration = NULL WHERE id = $2', [hashedPassword, user.id]);

        res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};