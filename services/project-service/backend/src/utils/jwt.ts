import jwt from 'jsonwebtoken';

export const generateRefreshToken = async(email: string) => {
    const token = jwt.sign( 
        {email: email}, 
        process.env.JWT_SECRET || 'mysecretkey', 
        {expiresIn: '15m'}
    );
    return token
}
export const verifyRefreshToken = async (token: string) => {
  const secret = process.env.JWT_SECRET || 'mysecretkey';
  const verified  = jwt.verify(token, secret);
  return verified;
}
export const verifyAccessToken = async (token: string) => { 
    const secret = process.env.JWT_SECRET
    const verified = jwt.verify(token, secret as string);
    return verified;
}

export const generateAccessToken = async(email: string) => { 
    const token = jwt.sign(
        {email: email},
        process.env.JWT_SECRET as string,
        {expiresIn: '7d'}
    )
    return token;
}