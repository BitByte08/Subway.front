# Node 기반 이미지
FROM node:20-bullseye

# 작업 디렉토리
WORKDIR /app

# package.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 복사
COPY . .

# 개발 서버 포트
EXPOSE 5173

# Vite 개발 서버 실행
CMD ["npm", "run", "dev"]
