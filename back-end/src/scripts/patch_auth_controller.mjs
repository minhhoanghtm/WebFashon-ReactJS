import fs from 'fs';

const filePath = 'back-end/src/modules/auth/auth.controller.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. In signIn, include refreshToken in response data
content = content.replace(
  `      { accessToken, userId: user.id || user._id, user },`,
  `      { accessToken, refreshToken, userId: user.id || user._id, user },`
);

// 2. In refreshAccessToken, accept token from cookies OR body OR header
const oldRefresh = `export const refreshAccessToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const ua = req.headers["user-agent"];

    const { accessToken, refreshToken, user } = await authService.refreshAccessToken(token, ip, ua);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    return successResponse(res, { accessToken }, \`Refresh token thành công cho user \${user.fullName}\`);`;

const newRefresh = `export const refreshAccessToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken || req.headers["x-refresh-token"];
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const ua = req.headers["user-agent"];

    const { accessToken, refreshToken, user } = await authService.refreshAccessToken(token, ip, ua);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    return successResponse(res, { accessToken, refreshToken, user }, \`Refresh token thành công cho user \${user.fullName}\`);`;

content = content.replace(oldRefresh.replace(/\r\n/g, '\n'), newRefresh);
content = content.replace(oldRefresh.replace(/\n/g, '\r\n'), newRefresh.replace(/\n/g, '\r\n'));

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched auth.controller.js!');
