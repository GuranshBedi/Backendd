import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from '../controllers/like.controller.js';


const router = Router();

router.route('/like-video/:videoId').post(verifyJWT,toggleVideoLike);
router.route('/like-tweet/:tweetId').post(verifyJWT,toggleTweetLike)
router.route('/like-comment/:commentId').post(verifyJWT,toggleCommentLike);
router.route('/liked/videos').get(verifyJWT,getLikedVideos);

export default router
