const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const obscureHeader = require("./server/middleware/obscureHeader");
const {
  ALLOWED_DOMAIN,
  SCRIPT_SOURCES,
} = require("config");
require('dotenv').config();
const apiRoutes = require("./server/routes")

// Start & init express app
const app = express();
app.enable("trust proxy");
app.use(
  helmet.contentSecurityPolicy({
    defaultSrc: ["'self'"],
    scriptSrc: SCRIPT_SOURCES,
  }),
);
app.use(
  helmet({
    //contentSecurityPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // Allow resources from the same origin
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow scripts from the same origin and inline scripts
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow styles from the same origin and inline styles
        imgSrc: ["'self'", "data:"], // Allow images from the same origin and data URIs
        fontSrc: [
          "'self'",
          "https://fonts.googleapis.com",
          "https://fonts.gstatic.com",
        ], // Example for Google Fonts
        objectSrc: ["'none'"], // Disallow embedding of objects
        frameSrc: ["'self'"], // Allow iframes from the same origin
        //upgradeInsecureRequests: true, // Upgrade HTTP to HTTPS automatically
        //reportUri: "/csp-violation" // Endpoint to report CSP violations (optional)
      },
    },
    hidePoweredBy: true,
  }),
);
app.use(obscureHeader);
app.use(
  express.json({
    limit: "2mb",
  }),
);
app.use(
  express.urlencoded({
    limit: "5mb",
    extended: true,
  }),
);
app.use(
  cors({
    origin: ALLOWED_DOMAIN,
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/example", (req, res) => {
  console.log(`Client IP: ${req.ip}`); // Logs client's IP address
  res.send(`Client IP: ${req.ip}`);
});

// Load APIs
app.use("/api", apiRoutes);

// Serve static build files
app.get("/*", (_, res) =>
  res.json({ msg: "memomeet APIs" })
  // res.send(WELCOME_PAGE)
);

require("./server/models");

const { Server } = require("socket.io");

const server = app.listen(process.env.SRV_PORT, () =>
  console.log(`🚀 Server running at ${process.env.SRV_PORT}`),
);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_DOMAIN,
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    credentials: true,
  }
});

io.on("connection", (socket) => {
  console.log(`User Connected :${socket.id}`);

  // Triggered when a peer hits the join room button.
  socket.on("join", ({ roomId: roomName }) => {
    const { rooms } = io.sockets.adapter;
    socket.join(roomName);
    const room = rooms.get(roomName);
    console.log(`User with ID: ${socket.id} joined room: ${roomName}, Room Size: ${room.size}`);
    socket.to(roomName).emit("joined", { newPeerSocketId: socket.id })
  });

  // // Triggered when server gets an icecandidate from a peer in the room.
  socket.on('ice-candidate', (iceCandidate, targetSocketId) => {
    console.log(`Ice candidate received on server to be able to send to ${targetSocketId} `, iceCandidate)
    socket.to(targetSocketId).emit('ice-candidate', iceCandidate, socket.id)
  })

  // // Triggered when server gets an offer from a peer in the room.
  socket.on("offer", ({ offer, to }) => {
    socket.to(to).emit("offer", { offer, from: socket.id }); // Sends Offer to the other peer in the room.
    console.log(`Offer received on server to be able to send to ${to} `, offer)
  });

  // // Triggered when server gets an answer from a peer in the room.
  socket.on("answer", ({ answer, to }) => {
    socket.to(to).emit('answer', { answer, from: socket.id }); // Sends Answer to the other peer in the room.
    console.log(`Answer received on server to be able to send to ${to} `, answer)
  });

  socket.on('leave', (roomName) => {
    socket.to(roomName).emit('user-left', socket.id);
    socket.leave(roomName);
    const { rooms } = io.sockets.adapter;
    const room = rooms.get(roomName);
    console.log(`User with ID: ${socket.id} left room: ${roomName}, Room Size: ${room ? room.size : 0}`);
  })

});
