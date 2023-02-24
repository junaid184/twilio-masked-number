const WebSocket = require("ws");
const accountSid = process.env.ACCOUNTSID
const authToken = process.env.AUTH_TOKEN
const twilio = require("twilio");
var VoiceResponse = require('twilio').twiml.VoiceResponse;
const client = twilio(accountSid, authToken);
const express = require("express");
const app = express();
const PORT = 8080;
const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });
wss.on("connection", function connection(ws) {
  console.log("New Connection Initiated");

  ws.on("message", function incoming(message) {
    const msg = JSON.parse(message);
    switch (msg.event) {
      case "connected":
        console.log(`A new call has connected.`);
        break;
      case "start":
        console.log(`Starting Media Stream ${msg.streamSid}`);
        break;
      case "media":
        // console.log("recieveing audio....")
        break;
      case "stop":
        console.log(`Call Has Ended`);
        break;
    }
  });
});

app.post('/mask-number.xml', (req, res) => { //twimlApp endpoint
  console.log("req.body", req.body)
  const twiml = new VoiceResponse();
  const dial = twiml.dial();
  dial.number({
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    statusCallback: 'https://935c-43-246-221-119.eu.ngrok.io/status-callback',
    statusCallbackMethod: 'POST'
  }, 'your_desired_number_for_call')
  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});

// Status callback endpoint to track call status
app.post('/status-callback', (req, res) => {
  const status = req.body.CallStatus;
  console.log(`Call status: ${status}`);

  res.sendStatus(200);
});
app.post("/", (req, res) => { //for outbound call
  client.calls
    .create({
      twiml: `<Response>
                <Connect>
                        <Stream url="wss://${req.headers.host}/"/>
                    </Connect>
                    <Say>I will stream the next 60 seconds of audio through your websocket</Say>
                </Response>`,
      to: "+1234567890",
      from: "+98765432123",
    })
    .then((call) => res.send(call))
    .then((e) => {
      console.log(e);
    });
});
server.listen(PORT, () => {
  console.log("server is running on ", PORT);
});
