import jwt from "jsonwebtoken";


export function generateAccessTokenForDataPlaneService() { 
    const payload  =  { 
        service: "data-plane-service"
    }
    const secret = process.env.ACCESS_TOKEN_SECRET || "default_secret";
    if(!secret){ 
        throw new Error("ACCESS_TOKEN_SECRET is not defined");
    }
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    return token;
    
}