/**
 * Created by E on 23.5.2016.
 */

var channel = process.env.channel;
var rabbitmq_host = process.env.rabbitmq_host;

var twitch_user = process.env.twitch_user;
var twitch_auth = process.env.twitch_auth;

/* Twitch */

var irc = require("tmi.js");

var options = {
    connection: {
        cluster: "aws",
        reconnect: true
    },
    identity: {
        username: twitch_user,
        password: twitch_auth
    },
    channels: ["#" + channel]
};

var client = new irc.client(options);
client.connect();

/* RabbitMQ */

var rabbitmq_ch;
var exchange = "amqp.irc";

var amqp = require("amqplib/callback_api");
amqp.connect("amqp://" + rabbitmq_host, function (err, conn) {
    conn.createChannel(function (err, ch) {
        ch.assertExchange(exchange, "fanout", {durable: false});
        rabbitmq_ch = ch;
    })
});

/* Connector */

client.on("chat", function (channel, user, message, self) {
    var time = Date.now();
    var object = {
        type: "messsage",
        channel: channel,
        user: user,
        message: message,
        time: time
    };
    if(rabbitmq_ch) {
        rabbitmq_ch.publish(exchange, "messages.twitch." + channel, new Buffer(JSON.stringify(object)));
    }
});
