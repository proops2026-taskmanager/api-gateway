import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { jwtMiddleware } from './jwt';
import { createProxyRouter } from './proxy';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

app.use(jwtMiddleware);
app.use(createProxyRouter());

export default app;
