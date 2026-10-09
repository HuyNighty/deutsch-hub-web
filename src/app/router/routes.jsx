import { createBrowserRouter } from "react-router-dom";

import Home from "@/pages/Home";
import ExploreGermany from "@/pages/explore-germany";
import StudyInGermany from "@/pages/study-in-germany";
import Experiences from "@/pages/Experiences";

import LearnGerman from "@/pages/learn-german";
import CourseDetailPage from "@/pages/learn-german/course-detail";

import LoginPage from "@/pages/Auth/Login";
import RegisterPage from "@/pages/Auth/Register";

import MyLearningPage from "@/pages/learn-german/my-learning";
import AssessmentCatalogPage from "@/pages/learn-german/assessment-catalog";
import AssessmentHistoryPage from "@/pages/learn-german/assessment-history";
import AssessmentDetailPage from "@/pages/learn-german/assessment-detail";
import AssessmentAttemptPage from "@/pages/learn-german/assessment-attempt";
import AssessmentTaskPage from "@/pages/learn-german/assessment-task";
import AssessmentResultPage from "@/pages/learn-german/assessment-result";
import MyCourseDetailPage from "@/pages/learn-german/my-course-detail";
import LessonPage from "@/pages/learn-german/lesson";

import { ProtectedRoute, GuestRoute } from "@/shared/routing";
import AccountPage from "@/pages/Account";

import AppShell from "@/layouts/AppShell/AppShell";
import ArticleDetailPage from "@/pages/explore-germany/article-detail";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
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
        path: "/explore-germany/:slug",
        element: <ArticleDetailPage />,
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
        element: <ProtectedRoute />,
        children: [
          {
            path: "/account",
            element: <AccountPage />,
          },
          {
            path: "/my-learning",
            element: <MyLearningPage />,
          },
          {
            path: "/my-learning/assessments",
            element: <AssessmentCatalogPage />,
          },
          {
            path: "/my-learning/assessment-history",
            element: <AssessmentHistoryPage />,
          },
          {
            path: "/my-learning/assessments/:assessmentId",
            element: <AssessmentDetailPage />,
          },
          {
            path: "/my-learning/assessment-attempts/:assessmentAttemptId",
            element: <AssessmentAttemptPage />,
          },
          {
            path: "/my-learning/assessment-attempts/:assessmentAttemptId/tasks/:taskId",
            element: <AssessmentTaskPage />,
          },
          {
            path: "/my-learning/assessment-attempts/:assessmentAttemptId/result",
            element: <AssessmentResultPage />,
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
    ],
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
]);
