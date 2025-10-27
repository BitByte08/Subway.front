import axios from "axios";

const api = axios.create({
  baseURL: "https://subway.bitworkspace.kr", // API 서버 기본 URL
  timeout: 10000, // 10초 타임아웃
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;