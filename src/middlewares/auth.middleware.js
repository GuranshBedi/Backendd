import { APIError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req,_,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " ,"")
    
        if(!token)
        throw new APIError(401,"Unauthorized request")

        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user)
            throw new APIError(401,"Inavlid access token")
    
        req.user = user
        next()
    } catch (error) {
        throw new APIError(401,error?.message || "Invalid Access Token")
    }
})





//refreshToken is a token with a longer life. Whenever a user logs in the server sends accessToken + refereshToken 
//refreshToken is only sent again once the accessTokem expires.
//If the refreshToken expires/invalid , you MUST log in again

//accessToken is a token with a shorter life and it is sent on every request that the user makes.
//Usually stored in cookies or sent in Authorization header.

//cookies are small notes sent by the server to the browser about who you are/identification