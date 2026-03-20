const admin = require("firebase-admin");
const axios = require("axios");

let initialized = false;

const verifyWithIdentityToolkit = async (idToken) => {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Thiếu FIREBASE_WEB_API_KEY để verify token theo chế độ fallback.",
    );
  }

  const response = await axios.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    { idToken },
    { headers: { "Content-Type": "application/json" } },
  );

  const user = response.data?.users?.[0];
  if (!user) {
    throw new Error("Firebase token không hợp lệ hoặc đã hết hạn.");
  }

  const providerId = user.providerUserInfo?.[0]?.providerId;
  return {
    uid: user.localId,
    email: user.email,
    name: user.displayName,
    picture: user.photoUrl,
    firebase: {
      sign_in_provider: providerId,
    },
  };
};

const initializeFirebaseAdmin = () => {
  if (initialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    initialized = true;
    return;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    initialized = true;
    return;
  }

  throw new Error(
    "Firebase Admin chưa được cấu hình. Cần FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY hoặc GOOGLE_APPLICATION_CREDENTIALS.",
  );
};

const verifyFirebaseIdToken = async (idToken) => {
  try {
    initializeFirebaseAdmin();
    return await admin.auth().verifyIdToken(idToken, true);
  } catch (err) {
    // Dev fallback: verify by Firebase Auth REST API when Admin SDK creds are unavailable.
    if (
      String(err.message || "").includes("Firebase Admin chưa được cấu hình")
    ) {
      return verifyWithIdentityToolkit(idToken);
    }
    throw err;
  }
};

module.exports = {
  verifyFirebaseIdToken,
};
