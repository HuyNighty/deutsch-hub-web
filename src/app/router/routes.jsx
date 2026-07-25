import { createBrowserRouter } from "react-router-dom";

import Home from "../../pages/home";
import ExploreGermany from "../../pages/explore-germany";
import StudyInGermany from "../../pages/study-in-germany";
import Experiences from "../../pages/experiences";
import Account from "../../pages/account";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import MyCourseDetailPage from "@/pages/learn-german/my-course-detail";
import MyLearningPage from "@/pages/learn-german/my-learning";
import LearnGerman from "@/pages/learn-german";
import CourseDetailPage from "@/pages/learn-german/course-detail";
import LessonPage from "@/pages/learn-german/lesson";

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
    path: "/account",
    element: <Account />,
  },
  {
    path: "/learn-german/courses/:courseId",
    element: <CourseDetailPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  { path: "/my-learning/courses/:courseId", element: <MyCourseDetailPage /> },
  {
    path: "/my-learning/courses/:courseId/lessons/:lessonId",
    element: <LessonPage />,
  },
  {
    path: "/my-learning",
    element: <MyLearningPage />,
  },
]);
