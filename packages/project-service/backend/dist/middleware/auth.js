import jwt from 'jsonwebtoken';
export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Access token missing' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ status: 'error', message: 'Invalid access token' });
        }
        req.body.user = user;
        next();
    });
};
export default authenticateToken;
//# sourceMappingURL=auth.js.map