import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {APIError} from "../utils/APIError.js"
import {APIResponse} from "../utils/APIResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
    all,
  } = req.query;

  console.log("[getAllVideos] called with:", req.query);


  const filter = {};

  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  if (userId && mongoose.isValidObjectId(userId)) {
    filter.owner = new mongoose.Types.ObjectId(userId);
  }

  const sortOptions = {};
  sortOptions[sortBy] =
    sortType === "asc" || sortType === "1" ? 1 : -1;

  // "all" param lets us fetch everything (no pagination)
  const wantAll = all === "true" || Number(limit) === 0;
  const skip = (page - 1) * limit;

  const queryBuilder = Video.find(filter)
    .sort(sortOptions)
    .select("-videoFile");

  if (!wantAll) queryBuilder.skip(skip).limit(Number(limit));

  const [videos, total] = await Promise.all([
    queryBuilder.exec(),
    Video.countDocuments(filter),
  ]);

  const totalPages = wantAll ? 1 : Math.ceil(total / limit);

  return res.status(200).json(
    new APIResponse(
      200,
      { videos, total, totalPages, page: Number(page) },
      "Videos fetched successfully"
    )
  );
});



const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new APIError(400, "Title and description are required");
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath) throw new APIError(400, "Video file is required");
  if (!thumbnailLocalPath) throw new APIError(400, "Thumbnail file is required");

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile?.url) throw new APIError(500, "Failed to upload video");
  if (!thumbnailFile?.url) throw new APIError(500, "Failed to upload thumbnail");

  const videoDetails = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnailFile.url,
    title,
    description,
    duration: videoFile.duration || 0,
    isPublished: true,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new APIResponse(201, videoDetails, "Video published successfully"));
});



const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId)
        throw new APIError(404, "Video Not found")

    const video = await Video.findById(videoId)
    if(!video)
        throw new APIError(400, "Video doesnt exist")
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
    if(!video)
        throw new APIError(404, "video doesnt exist!")

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