import {asyncHandler} from '../utils/asyncHandler.js'
import { APIError } from '../utils/APIError.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { User } from '../models/user.model.js'
import { APIResponse } from '../utils/APIResponse.js'

const generateAccessAndRefereshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.accessToken = accessToken
        await user.save({validateBeforeSave : false})

        return {refreshToken,accessToken}

    } catch (error) {
        throw new APIError(500, "Something went wrong while generating Access & Refresh Token ")
    }
}

const registerUser = asyncHandler( async (req,res) => {
    const {fullname,username,email,password} = req.body
    console.log('email: ' , email)
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

    console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path
    // let coverLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
        coverImageLocalPath = req.files.coverImage[0].path

    if(!avatarLocalPath){
        throw new APIError(400 , "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverLocalPath)

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

    const user = User.findOne({
        $or: [{username},{email}] // Basically mongodb will find users on the basis of username OR email 
    })
    
    if(!user)
        return new APIError(400,"User doesnt exist")

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
        APIResponse(200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User Logged In Sucessfully"
        )
    )

})

const logoutUser = asyncHandler( async(req,res) => {
    User.findByIdAndUpdate(req.user._id,
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
    .json(200, {}, "User Logged Out")
})

export { registerUser, loginUser,logoutUser }
