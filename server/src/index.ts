import express, { Request, Response } from 'express';
import 'dotenv/config';
import cors from 'cors';
import connectDB from './config/db';
import { clerkMiddleware } from '@clerk/express';
import clerkWebhooks from './controllers/clerkWebhooks';

const port = process.env.PORT || 3000;

connectDB();

const app = express();
app.use(cors());

//middleware
app.use(express.json());
app.use(clerkMiddleware());

//api for clerk webhooks
app.use('/api/clerk', clerkWebhooks);

app.get('/', (req: Request, res: Response) => {
  res.send('Api working');
});

app.listen(port, () => {
  console.log('Server running on localhost:', port);
});
