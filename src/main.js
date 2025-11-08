import express from "express"
// import cors from "cors"
// const rateLimit = require('express-rate-limit');

import compileRoutes from "./routes/compiler.js"

const app = express();

// Basic security
// app.use(helmet());

// // Logging (morgan -> console)
// app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS
// app.use(cors());

app.use("/compiler", compileRoutes);

app.get("/",  (req, res) => {
    return res.json({
        message: "working"
    })
})

app.listen(8000, () => {
    console.log("Port's running on 8000")
})
