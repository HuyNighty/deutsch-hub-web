import { createBrowserRouter } from "react-router-dom";

import Home from "@/pages/home";
import ExploreGermany from "@/pages/explore-germany";
import StudyInGermany from "@/pages/study-in-germany";
import Experiences from "@/pages/experiences";

import LearnGerman from "@/pages/learn-german";
import CourseDetailPage from "@/pages/learn-german/course-detail";

import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";

import Account from "@/pages/account";
import MyLearningPage from "@/pages/learn-german/my-learning";
import MyCourseDetailPage from "@/pages/learn-german/my-course-detail";
import LessonPage from "@/pages/learn-german/lesson";

import { ProtectedRoute, GuestRoute } from "@/shared/routing";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/learn-german",
    element: <LearnGerman />,
  },
  {
    path: "/learn-german/courses/:courseId",
    element: <CourseDetailPage />,
  },
  {
    path: "/explore-germany",
    element: <ExploreGermany />,
  },
  {
    path: "/study-in-germany",
    element: <StudyInGermany />,
  },
  {
    path: "/experiences",
    element: <Experiences />,
  },
  {
    element: <GuestRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/account",
        element: <Account />,
      },
      {
        path: "/my-learning",
        element: <MyLearningPage />,
      },
      {
        path: "/my-learning/courses/:courseId",
        element: <MyCourseDetailPage />,
      },
      {
        path: "/my-learning/courses/:courseId/lessons/:lessonId",
        element: <LessonPage />,
      },
    ],
  },
]);
