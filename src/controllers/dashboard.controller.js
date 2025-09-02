import mongoose, { mongo, Mongoose } from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {APIError} from "../utils/APIError.js"
import {APIResponse} from "../utils/APIResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id

    if(!userId)
        throw new APIError(404, "User not found")

    const channelDetails = await User.aggregate([
        {
            $match: {
                userId : {
                    _id : mongoose.Types.ObjectId(userId)
                }
            }
        },
        {
            $lookup: {
                from : "videos",
                localField: "_id",
                foreignField: "owner",
                as: "views"
            },
            
        },
        {
            $lookup: {
                from: "subsrciptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "likedBy",
                as: "likes"
            }
        },
        {
            $addFields: {
                viewCount : {
                    $sum: "$video.views"
                } ,
                likeCount: {
                    $size: "$likes"
                },
                videoCount: {
                    $size: "$videos"
                },
                subscribers:{
                    $size: "$subscribers"
                },
                averageViewsPerVideo: {
                    $cond: [
                        { $gt: [{ $size: "$videos" }, 0] },
                        { $divide: [{ $sum: "$videos.views" }, { $size: "$videos" }] },
                        0
                    ]
                }
            }
        },
        {
            $project: {
                viewCount: 1,
                likeCount: 1,
                videoCount: 1,
                subscribers: 1,
                averageViewsPerVideo: 1
            }
        }
        
    ])

    if(!channelDetails?.length)
        throw new APIError(404,"Channel does not exist")

    return res.status(200)
    .json(new APIResponse(200,channelDetails,"User Channel fetched Succesfully"))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id

    if(!userId)
        throw new APIError(404, "User not found")

    const getVideos = await User.aggregate([
        {
            $match: {
                userId : {
                    _id: mongoose.Types.ObjectId(userId)
                }
            }
        },
        {
            $lookup: {
                from : "videos",
                localField: "owner",
                foreignField: "views",
                as: "videos"
            },
            
        },
        {
            $addFields: {
                videoCount: {
                    $size: "$videos"
                }
            }
        },
        {
            $project: {
                videos: 1,
                videoCount: 1
            }
        }
        
    ])

    if(!getVideos?.length)
        throw new APIError(400,"No Videos")

    return res.status(200)
    .json(new APIResponse(200,channelDetails,"User Video fetched Succesfully"))
})

export {
    getChannelStats, 
    getChannelVideos
}