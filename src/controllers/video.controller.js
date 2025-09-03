import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {APIError} from "../utils/APIError.js"
import {APIResponse} from "../utils/APIResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const filter = {}
    if (query) {
        filter.$or = [
            { 
                title: { $regex: query, $options: "i" } 
            }, 
            { 
                description: { $regex: query, $options: "i" } 
            }
        ]
    }
    if (userId)
        filter.owner = userId

    const sortOptions = {}
    sortOptions[sortBy] = sortType === "asc" || sortType === "1" ? 1 : -1

    const skip = (page - 1) * limit

    const [videos, total] = await Promise.all([
        Video.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit))
            .select("-videoFile"),
        Video.countDocuments(filter)
    ])

    const totalPages = Math.ceil(total / limit)

    res.status(200).json(new APIResponse(200,{},"Videos fetched Successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    
    const video = await Video.findOne({
        $or: [{title , description}]
    })
    
    if(!video)
        throw new APIError(404,"Video not Found")

    const videoLocalPath = req.files?.videoFile[0].path
    const thumbnailLocalPath = req.file?.thumbnail.path

    if(!videoLocalPath)
        throw new APIError(400, "Video is required")
    if(!thumbnailLocalPath)
        throw new APIError(400, "Video is required")

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile)
        throw new APIError(400, "Video is required")

    const videoDetails = await Video.create({
        videoFile: videoFile.url,
        thumbnail : thumbnail.url,
        title,
        description,
        duration : videoFile.duration,
        isPublished: true,
        owner: req.user._id
    })

    return res.status(200).json(new APIResponse(200, videoDetails, "Video published Successfully!"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId)
        throw new APIError(404, "Video Not found")

    const video = await Video.findById(videoId)
    return res(200).json(new APIResponse(200, video, "Video found!"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title , description, thumbnail} = req.body

    if(!videoId)
     throw new APIError(404, "Video Not found")

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail
            }
        },
        {
            new: true
        }
    ).select("-videoFile")

    return res.status(200).json(new APIResponse(200, video , "Video updated Successfully!"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId)
        throw new APIError(404, "Video Not Found")

    const video = await Video.findByIdAndDelete(videoId)

    return res.status(201).json(201, video , "Video Deleted Successfully!")

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) throw new APIError(400, "VideoId is required")

    const video = await Video.findById(videoId)
    if (!video) throw new APIError(404, "Video not found")

    video.isPublished = !video.isPublished
    await video.save()

    return res.status(200).json(new APIResponse(200, video, "Publish status toggled successfully!"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}