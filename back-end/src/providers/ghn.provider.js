import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const ghnClient = axios.create({
    baseURL: process.env.GHN_BASE_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api',
    headers: {
        Token: process.env.GHN_TOKEN,
        'Content-Type': 'application/json',
    }
});