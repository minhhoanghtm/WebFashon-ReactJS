// api/axiosPublic.js
import axios from "axios";
import { ENV } from "../config/env";

export const axiosPublic = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});