import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller";

const router = Router()

router.route('/create-tweet').post(verifyJWT,createTweet)
router.route('/tweets').get(verifyJWT,getUserTweets)
router.route('/update/tweet').patch(verifyJWT,updateTweet)
router.route('/delete/tweet').delete(verifyJWT,deleteTweet)

export default router