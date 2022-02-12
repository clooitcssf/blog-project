const express = require("express")
const cors = require("cors")
const bodyparser = require("body-parser")
const mongoose = require("mongoose")
const fs = require("fs")
const path = require("path")
var ObjectId = require("mongodb").ObjectID
const bcrypt = require("bcrypt")
const app = express()
app.use(cors())
app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())
const databaselink = "mongodb://localhost/Blogposts"
const databasename = "Blogposts"
const collectionname = "Blogs"
const multer = require("multer")
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads")
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now())
    }
})

const inputpassword = bcrypt.hashSync('123', bcrypt.genSaltSync(8), null)
mongoose.connect(databaselink, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    console.log("connected")
})
const imageSchema = new mongoose.Schema({
    name: String,
    desc: String,
    img: {
        data: Buffer,
        contentType: String
    }
})
const imgModel = new mongoose.model("Image", imageSchema)

const blogsSchema = new mongoose.Schema({
    title: String,
    text: String,
    // we need to change the schema to include a textbox array
    tags: [{ type: String }],
    author: { type: String, default: "Christian Looi" },
    date: { type: Date, default: Date.now },
    clicks: { type: Number, default: 0 },
    imagename: {type: String, default:null},
    textBox: [{
        text: String,

        fileName: String

    }]
})
const Blog = new mongoose.model(collectionname, blogsSchema)

app.post("/api/checkpassword", (req, res) => {
    console.log(req.body)
    var hashinput = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null)

    if (bcrypt.compareSync(req.body.password, inputpassword)) {
        console.log("correct password")
        res.send({ success: true })
    }
    else {
        console.log("wrong password")
        res.send({ success: false })
    }
})

app.get("/api/blogs", (req, res) => {
    console.log("giving you the blogs")
    Blog.find({}, (err, items) => {
        res.json(items)
    })
})

app.get("/api/trendingblogs", (req, res) => {


    console.log(req.query.timeframe)
    var d = new Date()
    d.setMonth(d.getMonth() - 1)


    Blog.find({ "date": { $gte: d } }).sort({ "clicks": "desc" }).exec((err, items) => {
        res.json(items)
    })
})

app.post("/api/updateclicks", (req, res) => {
    console.log("updating clicks")
    console.log(req.body._id)
    console.log(req.params._id)
    Blog.findByIdAndUpdate(ObjectId(req.body._id), { $inc: { "clicks": 1 } },(err,docs)=>{
        if(err){
            console.log(err)
        }
        else{
            console.log(docs)
        }
    })
})


app.post("/api/newblog", (req, res) => {
    console.log(req.body)
    var newblog = new Blog(req.body )
    newblog.save()
})
const upload = multer({
    storage: storage
})
var type = upload.single("image")
app.post("/api/uploadFile", type, (req, res, next) => {

    var obj = {
        name: req.file.filename,
        dest: "exampleDescription",
        img: {
            data: fs.readFileSync(path.join(__dirname + "/uploads/" + req.file.filename)),
            contentType: "image/png"
        }

    }
    // imgModel.create(obj)
    var image = new imgModel(obj)
    image.save()
    console.log(image.name)
    res.send(image.name)
})
app.get("/api/image", (req, res) => {
    var imagename = req.query.imagename
 
    imgModel.findOne({"name":imagename}, (err, items) => {
      
        res.json(items)
        // double check the responce here 
        // try going to localhost fivethousand and making a manual query
    })
})
const port = 5000
app.listen(port)