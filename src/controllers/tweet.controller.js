import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {APIError} from "../utils/APIError.js"
import {APIResponse} from "../utils/APIResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    const userId = req.user?._id
    if(!userId)
        throw new APIError(404, "User not found")

    if(!content || content == "")
        throw new APIError(400, "Content is required")

    const tweet = await Tweet.create({
        owner : userId,
        content : content
    })

    return res.status(200).json(new APIResponse(200,tweet,"Tweet created Successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.user?._id

    if(!userId)
        throw new APIError(404, "User not found")

    const tweets = await Tweet.find({
        owner: userId
    })

    return res.status(200).json(new APIResponse(200, tweets, "Tweets fetched Successfully"))
    
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    if(!tweetId)
        throw new APIError(404, "Something is wrong")

    const newTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            content: content
        },
        {
            new:true
        }
    )
    return res.status(200).json(new APIResponse(200,newTweet,"Tweet Updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if(!tweetId)
        throw new APIError(404, "Something is wrong")

    const tweet = await Tweet.findByIdAndDelete(tweetId)

    return res.status(200).json(new APIResponse(200, {}, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}