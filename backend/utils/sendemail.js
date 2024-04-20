const nodemailer = require('nodemailer');

const sendEmail = async (subject, message, send_to, sent_from, reply_to) => {
    const transposter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
    const option = {
        from: sent_from,
        to: send_to,
        reply: reply_to,
        subject: subject,
        html: message, 
    }
    // send email
    transposter.sendMail(option, function(error, info) {
        if(error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};


module.exports = sendEmail;
