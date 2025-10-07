import {asyncHandler} from '../utils/asyncHandler.js'
import { APIError } from '../utils/APIError.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { User } from '../models/user.model.js'
import { APIResponse } from '../utils/APIResponse.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const generateAccessAndRefereshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {refreshToken,accessToken}

    } catch (error) {
        throw new APIError(500, "Something went wrong while generating Access & Refresh Token ")
    }
}

const registerUser = asyncHandler( async (req,res) => {
    const {fullname,username,email,password} = req.body
    if(
        [fullname,username,email,password].some((field) => 
        field?.trim() === "")
    )
    throw new APIError(400, "All fields are required") // check if any field is empty or not

    const existedUser =  await User.findOne({
        $or: [{username},{email}]
    }
    )

    if(existedUser)
        throw new APIError(409, "User with same username or email exists")
    
    const avatarLocalPath = req.files?.avatar[0]?.path

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
        coverImageLocalPath = req.files.coverImage[0].path

    if(!avatarLocalPath){
        throw new APIError(400 , "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new APIError(400, "Avatar is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase() 
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser)
        throw new APIError(500, "Something went wrong while registration")

    return res.status(201).json(
        new APIResponse(200, createdUser, "User created successfully!")
    )

})

const loginUser = asyncHandler( async (req,res) => {
    const {username,email,password} = req.body

    if(!(username || email))
        throw new APIError(400,"Username or Email is required");

    const user = await User.findOne({
        $or: [{username},{email}] // Basically mongodb will find users on the basis of username OR email 
    })

    if(!user)
        throw new APIError(400,"User doesnt exist")

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid)
        throw new APIError(401, "Invalid password")

    const {accessToken,refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new APIResponse(200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User Logged In Sucessfully"
        )
    )

})

const logoutUser = asyncHandler( async(req,res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },{
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken",options)
    .clearCookie("refreshToken" , options)
    .json(new APIResponse(200, {}, "User Logged Out"))
})

const refreshAcessToken = asyncHandler( async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken)
        throw new APIError(401, "Unauthorized request")

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user)
            throw new APIError(401, "Invalid Refresh Token")
    
        if(incomingRefreshToken != user?.incomingRefreshToken)
            throw new APIError(401, "Refesh token is expired or used")
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        res.status(200).cookie("accessToken" , accessToken,options)
        .cookie("refreshToken" , newRefreshToken, options)
        .json(new APIResponse(200,{accessToken,refreshToken : newRefreshToken}, "access token refreshed"))
    } catch (error) {
        throw new APIError(400, error?.message);
        
    }
})

const changeCurrentPassword = asyncHandler( async(req,res) => {
    const {oldPassword,newPassword} = req.body

    const user = await User.findById(req.user._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect)
        throw new APIError(400, "Password incorrect")

    user.password = newPassword

    await user.save({validateBeforeSave: false})

    return res.status(200)
    .json(200, new APIResponse(200,{},"Password Changed Successfully"))

})

// good: explicit JSON response
const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json(new APIError(400, "User fetching failed"));
  }

  // send only required fields if you want
  const { username, email, fullname, avatar, coverImage} = req.user;
  return res.status(200).json(new APIResponse(200, 
    {username, email, fullname, avatar, coverImage},"User fetched Successfully"));
});


const updateAccountDetails = asyncHandler( async(req,res) => {
    const {fullname , email} = req.body

    if(!fullname || !email)
        throw new APIError(400, "All fields are required!")

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email //both formatsare correct
            }
        },
        {
            new:true
        }
    ).select("-password")

    return res.status(200)
    .json(new APIResponse(200,user,"User credentials updated successfully"))

})

const updateAvatar = asyncHandler( async(req,res) => {
    const avatarLocalPath = req?.file.path

    if(!avatarLocalPath)
        throw new APIError(400, "Avatar file is wrong")

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url)
        throw new APIError(400, "Error while uploading Avatar")

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res.status(200).json(new APIResponse(200,user, "Avatar updated successfully"))
})

const updateCoverImage = asyncHandler( async(req,res) => {
    const coverImageLocalPath = req?.file.path

    if(!coverImageLocalPath)
        throw new APIError(400, "Cover Image file is wrong")

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url)
        throw new APIError(400, "Error while uploading Cover Image")

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res.status(200).json(new APIResponse(200,user, "CoverImage updated successfully"))
})

const getUserChannelProfile = asyncHandler( async(req,res) => {
    const {username} = req.params
    if(!username.trim())
        throw new APIError(400, "Username doesnt exist")
    const channel = await User.aggregate([
        {
            $match: { //works like findOne()
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{ //this is acts as join between user and subscriptions
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as:"subscribers"
            }
        },{
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedTo:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in : [req.user?._id,"$subsribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length)
        throw new APIError(404,"Channel does not exist")

    return res.status(200)
    .json(new APIResponse(200,channel[0],"User Channel fetched Succesfully"))
})

const getWatchHistory = asyncHandler( async(req,res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from:"videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                },
                                {
                                    $addFields: {
                                        owner: {
                                            $first: "$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {

        }
    ])

    return res
    .status(200)
    .json(new APIResponse(200),user[0].watchHistory,"watchHistory fetched successfully")
})

export { registerUser, 
    loginUser,logoutUser,
    refreshAcessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
