import mongoose, {isValidObjectId, mongo} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {APIError} from "../utils/APIError.js"
import {APIResponse} from "../utils/APIResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user._id; // comes from JWT middleware

    if (!channelId) {
        throw new APIError(400, "Channel not found");
    }

    const existingSub = await Subscription.findOne({
        channel: channelId,
        subscriber: subscriberId
    })

    let message, subscription

    if (existingSub) {
        await Subscription.findByIdAndDelete(existingSub._id)
        message = "Unsubscribed successfully"
        subscription = null;
    } else {
        subscription = await Subscription.create({
            channel: channelId,
            subscriber: subscriberId
        })
        message = "Subscribed successfully"
    }
    return res.status(200).json(new APIResponse(200, subscription, message))
})


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId)
        throw new APIError(400,"Channel not found")

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as:"subscriberDetails"
            }
        },{
            $unwind: "$subscriberDetails"     // flatten the array
        },
        {
            $project: {
                _id: 0,
                subscriberId: "$subscriberDetails._id",
                username: "$subscriberDetails.username",
            }
        }
    ])

    return res.status(200).json(new APIResponse(200, subscribers, "Subscribers fetched successfully"))
    
})
  
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!subscriberId)
        throw new APIError(400,"Channel not found")

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as:"channelDetails"
            }
        },{
            $unwind: "$channelDetails"     // flatten the array
        },
        {
            $project: {
                _id: 0,
                subscribedToId: "$channelDetails._id",
                username: "$channelDetails.username",
            }
        }
    ])

    return res.status(200).json(new APIResponse(200, subscribedChannels, "Subscribers fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
