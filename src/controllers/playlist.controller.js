import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {APIError} from "../utils/APIError.js"
import {APIResponse} from "../utils/APIResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || !description)
        throw new APIError(400, "Name and description is required")

    const playlist = await Playlist.create({
        name: name,
        description: description,
        owner : req.user?._id
    })
    if(!playlist)
        throw new APIError(404,"Playlist not found")

    return res.status(200).json(new APIResponse(200,playlist,"Playlist created successfully"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!userId)
        throw new APIError(404, "Invalid User")

    const playlists = await Playlist.find({
        owner: userId
    }
    )

    if(!playlists || playlists.length == 0)
        throw new APIError(400, "No playlists")

    return res.status(200).json(new APIResponse(200, playlists,"User Playlists fetched Successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
     if(!playlistId)
        throw new APIError(404, "Playlist Id invalid")

    const playlist = await Playlist.findById(playlistId)
    
    if(!playlist)
        throw new APIError(404,"Playlist not found")

    return res.status(200).json(new APIResponse(200,playlist,"Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId)
        throw new APIError(404,"Playlist not found!")

    if(!videoId)
        throw new APIError(404,"Video doesnt exist")

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        {
            new:true
        }
    ).populate("videos")

    if(!playlist)
        throw new APIError(400 , "Playlist Not found")

    return res.status(200).json(new APIResponse(200, playlist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId)
        throw new APIError(404,"Playlist not found!")

    if(!videoId)
        throw new APIError(404,"Video doesnt exist")

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new:true
        }
    )

    if(!playlist)
        throw new APIError(400 , "Playlist Not found")

    return res.status(200).json(new APIResponse(200,playlist,"Video removed successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId)
        throw new APIError(404,"Playlist not found!")

    const playlist = await Playlist.findByIdAndDelete(playlistId)

    if(!playlist)
        throw new APIError(400 , "Playlist Not found")

    return res.status(200).json(new APIResponse(200, playlist, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if(!playlistId)
        throw new APIError(404,"playlist not found")


    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name : name,
                description: description
            }
        },
        {
            new:true
        }
    ).populate("videos")

    if(!playlist)
        throw new APIError(400 , "Playlist Not found")

    return res.status(200).json(new APIResponse(200, playlist, "Playlist updated successfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}