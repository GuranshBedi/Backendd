import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {APIError} from "../utils/APIError.js"
import {APIResponse} from "../utils/APIResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!videoId)
        throw new APIError(400, "Video doesnt exist")

    const filter = { likedBy: userId };
    if (videoId) 
        filter.video = videoId;

    const existingLike = await Like.findOne(filter);

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new APIResponse(200, null, "Unliked successfully"));
    }
    await Like.create(filter);
    return res
        .status(200)
        .json(new APIResponse(200, null, "Liked successfully"));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId)
        throw new APIError(400, "Video doesnt exist")

    const filter = { likedBy: userId };
    if (commentId) 
        filter.comment = commentId;

    const existingLike = await Like.findOne(filter);

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new APIResponse(200, null, "Unliked successfully"));
    }
    await Like.create(filter);
    return res
        .status(200)
        .json(new APIResponse(200, null, "Liked successfully"));

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId)
        throw new APIError(400, "Video doesnt exist")

    const filter = { likedBy: userId };
    if (tweetId) 
        filter.tweet = tweetId;

    const existingLike = await Like.findOne(filter);

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new APIResponse(200, null, "Unliked successfully"));
    }
    await Like.create(filter);
    return res
        .status(200)
        .json(new APIResponse(200, null, "Liked successfully"));
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const { userId } = req.user._id

    const likedVideos = await Like.find({
        likedBy : userId,
        video: {
            $exists: true,
            $ne: null
        }
    }).populate("video").select("-updatedAt")

    if(!likedVideos || likedVideos.length == 0)
        throw new APIError(404,"No Liked Videos Found")

    const videos = likedVideos.map(like => like.video)

    return res.status(200).json(new APIResponse(200,videos,"Liked Videos Fetched Successfully"))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
