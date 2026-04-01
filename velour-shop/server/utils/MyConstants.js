const MyConstants = {
    DB_SERVER: "shoponline.eooq008.mongodb.net",
    DB_USER: "khoa2374802013428_db_user",
    DB_PASS: "0123456789",
    DB_DATABASE: "velour-shop",
    EMAIL_USER: process.env.EMAIL_USER || "buidangkhoa1920@gmail.com",
    EMAIL_PASS: process.env.EMAIL_PASS || "mvnj zkqw hdit anbx",
    JWT_SECRET:
        "2e441861c8cc325313934183382c10477a58d8a8633dbde46186fae84d995f2896d00f6fa37200a79e5b700d651c68e77d9618b330092f7cfe0096c2324815ad",
    JWT_EXPIRES: "3600000", // in milliseconds
};

module.exports = MyConstants;
//khoa2374802013428_db_user:0123456789@shoponline.eooq008.mongodb.net/
