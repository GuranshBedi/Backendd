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

//routes declaration
app.use('/api/v1/users',userRouter)// '/users' becomes the prefix and control goes to userRouter


export { app } //named export thats why its wrapped in curly braces and when it is imported it needs to be called with "app"