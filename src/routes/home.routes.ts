import {Router} from 'express';

const homeRoutes = Router();

homeRoutes.get('/', (req, res) => {
  res.render('home');
});

export default homeRoutes;
