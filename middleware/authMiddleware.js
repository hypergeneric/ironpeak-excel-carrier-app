const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {

    if (req.isAuthenticated()) {
        next();
        return;
    }

    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    console.log('Received token:', token);

    jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('Token verification failed:', err);
            res.redirect('/');
            return res.status(500).json({ message: 'Failed to authenticate token' });
        }

        req.userId = decoded.id;
        next();
    });
};
