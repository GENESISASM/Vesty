import { Router } from "express";
import { AuthController } from "../controllers/auth_controller";

const router = Router();

const authRoutes = [
  {
    method: 'post',
    route: '/user/register',
    controller: AuthController.register,
  },
  {
    method: 'post',
    route: '/user/login',
    controller: AuthController.login,
  },
];

authRoutes.forEach(({ method, route, controller }) => {
  (router as any)[method](route, controller);
});

export default router;