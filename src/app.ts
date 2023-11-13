import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import homeRoutes from './routes/home.routes';

dotenv.config();

const app = express();

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', homeRoutes);

app.listen(PORT, () => {
  const externalUrl = process.env.RENDER_EXTERNAL_URL;

  if (externalUrl) {
    console.log(`Server running on: ${externalUrl}`);

    return;
  }

  console.log(`Server running on: http://${HOST}:${PORT}/`);
});
