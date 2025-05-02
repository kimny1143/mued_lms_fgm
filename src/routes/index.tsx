import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PageLandingMued } from "../screens/PageLandingMued";
import { LoginPage } from "../screens/LoginPage";
import { SignupPage } from "../screens/SignupPage";
import { DashboardPage } from "../screens/DashboardPage";
import { SettingsPage } from "../screens/SettingsPage";
import { MyLessonsPage } from "../screens/MyLessonsPage";
import { MaterialsPage } from "../screens/MaterialsPage";
import { MessagesPage } from "../screens/MessagesPage";
import { PlansPage } from "../screens/PlansPage";
import { SuccessPage } from "../screens/SuccessPage";
import { CancelPage } from "../screens/CancelPage";
import { ExercisePage, ExerciseDetailPage } from "../screens/ExercisePage";
import { ProfileEditPage } from "../screens/ProfileEditPage";
import SignInPage from "../screens/AuthPage/SignInPage";
import UnauthorizedPage from "../screens/ErrorPages/UnauthorizedPage";
import RouteGuard from "../components/RouteGuard";
import { NextAuthProvider } from "../contexts/NextAuthProvider";
import { UserRole } from "../lib/types";

// 公開ルート
const publicRoutes = [
  {
    path: "/",
    element: <PageLandingMued />
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/signup",
    element: <SignupPage />
  },
  {
    path: "/auth/signin",
    element: <SignInPage />
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />
  },
  {
    path: "/success",
    element: <SuccessPage />
  },
  {
    path: "/cancel",
    element: <CancelPage />
  }
];

// 学生用ルート
const studentRoutes = [
  {
    path: "/dashboard",
    element: <DashboardPage />
  },
  {
    path: "/my-lessons",
    element: <MyLessonsPage />
  },
  {
    path: "/materials",
    element: <MaterialsPage />
  },
  {
    path: "/messages",
    element: <MessagesPage />
  },
  {
    path: "/profile/edit",
    element: <ProfileEditPage />
  },
  {
    path: "/exercise",
    element: <ExercisePage />
  },
  {
    path: "/exercise/:id",
    element: <ExerciseDetailPage />
  }
];

// メンター用ルート
const mentorRoutes = [
  {
    path: "/settings",
    element: (
      <RouteGuard requiredRoles={[UserRole.MENTOR, UserRole.ADMIN]}>
        <SettingsPage />
      </RouteGuard>
    )
  }
];

// 管理者用ルート
const adminRoutes = [
  {
    path: "/plans",
    element: (
      <RouteGuard requiredRoles={UserRole.ADMIN}>
        <PlansPage />
      </RouteGuard>
    )
  }
];

// ルーターの定義
const router = createBrowserRouter([
  ...publicRoutes,
  // 認証が必要な学生用ルート
  ...studentRoutes.map(route => ({
    path: route.path,
    element: <RouteGuard>{route.element}</RouteGuard>
  })),
  // メンター・管理者ルート（すでにRouteGuardで囲まれているため、そのまま使用）
  ...mentorRoutes,
  ...adminRoutes
]);

export function AppRoutes() {
  return (
    <NextAuthProvider>
      <RouterProvider router={router} />
    </NextAuthProvider>
  );
} 