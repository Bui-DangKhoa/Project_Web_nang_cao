const nodemailer = require("nodemailer");
const MyConstants = require("./MyConstants");

const buildTransportConfig = () => {
  const user = MyConstants.EMAIL_USER;
  const pass = (MyConstants.EMAIL_PASS || "").replace(/\s+/g, "");

  if (!user || !pass) {
    throw new Error("Email credentials are missing. Please set EMAIL_USER and EMAIL_PASS.");
  }

  const serviceFromEnv = process.env.EMAIL_SERVICE;
  const lowerEmail = user.toLowerCase();

  let service = serviceFromEnv;
  if (!service) {
    if (lowerEmail.includes("@gmail.com")) service = "gmail";
    else if (
      lowerEmail.includes("@outlook.com") ||
      lowerEmail.includes("@hotmail.com") ||
      lowerEmail.includes("@live.com")
    ) {
      service = "hotmail";
    }
  }

  if (service) {
    return {
      service,
      auth: { user, pass },
    };
  }

  return {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 587),
    secure: false,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  };
};

const transporter = nodemailer.createTransport(buildTransportConfig());

const EmailUtil = {
  send(email, id, token) {
    const activateHint = `id=${id}&token=${token}`;
    const text =
      "Thanks for signing up. Use these values to activate your account:\n\t.id: " +
      id +
      "\n\t.token: " +
      token +
      "\n\nOr copy this query string: " +
      activateHint;

    return new Promise((resolve, reject) => {
      const mailOptions = {
        from: MyConstants.EMAIL_USER,
        to: email,
        subject: "Signup | Verification",
        text,
      };

      transporter.sendMail(mailOptions, (err) => {
        if (err) return reject(err);
        return resolve(true);
      });
    });
  },
};

module.exports = EmailUtil;