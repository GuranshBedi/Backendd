import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json())
app.use(urlencoded({extended: true}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import 
 import userRouter from './routes/user.routes.js'
 import healthcheckRouter from './routes/healthcheck.route.js'
 import tweetRouter from './routes/tweet.routes.js'
 import likeRouter from './routes/like.routes.js'
 import subscriptionRouter from './routes/subsciption.routes.js'
 import videoRouter from './routes/video.routes.js'
 import playlistRouter from './routes/playlist.routes.js'
 import commentRouter from './routes/comment.routes.js'
 import dashboardRouter from './routes/dashboard.routes.js'

//routes declaration
app.use('/api/v1/users',userRouter)// '/users' becomes the prefix and control goes to userRouter
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)

export { app } //named export thats why its wrapped in curly braces and when it is imported it needs to be called with "app"