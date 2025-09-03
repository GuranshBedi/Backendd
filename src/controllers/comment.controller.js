import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {APIError} from "../utils/APIError.js"
import {APIResponse} from "../utils/APIResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!videoId) {
        throw new APIError(400, "Video ID is required");
    }

    const skip = (Number(page) - 1) * Number(limit);

    const comments = await Comment.find({ video: videoId })
        .populate("owner", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const totalComments = await Comment.countDocuments({ video: videoId });

    return res.status(200).json(new APIResponse(200, {comments,totalComments} , "Comments fetched successsfully"))

})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body

     if(!videoId)
        throw new APIError(400,"Video not found")

    const comment = await Comment.create({
        owner: req.user?._id,
        video: videoId,
        content : content
    })

    if(!comment)
        throw new APIError(400 , "comment Error")

    return res.status(200).json(new APIResponse(200,comment,"Comment Added Successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if(!commentId)
        throw new APIError(400,"comment not found")

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if(!comment)
        throw new APIError(400 , "comment Error")

    return res.status(200).json(new APIResponse(200,comment,"Comment Updated Successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if(!commentId)
        throw new APIError(400,"comment not found")

    const comment = await Comment.findByIdAndDelete(commentId)

    if(!comment)
        throw new APIError(400 , "comment Error")

    return res.status(200).json(new APIResponse(200,comment,"Comment Deleted Successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
}