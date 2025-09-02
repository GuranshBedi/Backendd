import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware';
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from '../controllers/video.controller';
import { upload } from '../middlewares/multer.middleware';

const router = Router();

router.route('/all-videos').get(verifyJWT,getAllVideos);
router.route('/publish-video').post(verifyJWT,upload.single("videoFile"),publishAVideo)
router.route('/videos/:videoId').get(verifyJWT,getVideoById);
router.route('/update-video/:videoId').patch(verifyJWT,updateVideo);
router.route('/delete-video/:videoId').delete(verifyJWT,deleteVideo);
router.route('/video/:videoId').patch(verifyJWT,togglePublishStatus);

export default router
