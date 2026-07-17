import { createBrowserRouter } from "react-router-dom";

import Home from "../../pages/Home";
import LearnGerman from "../../pages/LearnGerman";
import ExploreGermany from "../../pages/ExploreGermany";
import StudyInGermany from "../../pages/StudyInGermany";
import Experiences from "../../pages/Experiences";
import Account from "../../pages/Account";
import CourseDetailPage from "@/pages/LearnGerman/CourseDetail";
import LoginForm from "@/features/auth/components/LoginForm";
import RegisterForm from "@/features/auth/components/RegisterForm";
import MyCourseDetailPage from "@/features/my-learning/my-course-detail";
import LessonPage from "@/pages/LearnGerman/Lesson";

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
    element: <LoginForm />,
  },
  {
    path: "/register",
    element: <RegisterForm />,
  },
  { path: "/my-learning/courses/:courseId", element: <MyCourseDetailPage /> },
  {
    path: "/my-learning/courses/:courseId/lessons/:lessonId",
    element: <LessonPage />,
  },
]);
