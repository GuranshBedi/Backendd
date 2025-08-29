import {asyncHandler} from '../utils/asyncHandler.js'
import { APIError } from '../utils/APIError.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { User } from '../models/user.model.js'
import { APIResponse } from '../utils/APIResponse.js'

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

export { registerUser }
