import express from 'express';
import morgan from 'morgan';
import { createProxyRouter } from './proxy';

const app = express();

app.use(morgan('combined'));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

app.use(createProxyRouter());

export default app;
