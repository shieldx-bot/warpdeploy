import jwt from 'jsonwebtoken';
export const generateRefreshToken = async (email) => {
    const token = jwt.sign({ email: email }, process.env.JWT_SECRET || 'mysecretkey', { expiresIn: '15m' });
    return token;
};
export const verifyRefreshToken = async (token) => {
    const secret = process.env.JWT_SECRET || 'mysecretkey';
    const verified = jwt.verify(token, secret);
    return verified;
};
export const verifyAccessToken = async (token) => {
    const secret = process.env.JWT_SECRET;
    const verified = jwt.verify(token, secret);
    return verified;
};
export const generateAccessToken = async (email) => {
    const token = jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return token;
};
//# sourceMappingURL=jwt.js.map