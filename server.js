import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import messageRoutes from './routes/message.js'

const app = express()
dotenv.config()

const port = process.env.PORT || 5000

app.use(express.urlencoded({
    extended: false
}))

app.use(cors())
app.use(express.json())
app.use("/message",messageRoutes)
app.use("/music",express.static("music"))

app.get('/',(req,res)=>{
    res.send("Okay")
})

app.listen(port, () => console.log(`App Listening on port ${port}`));