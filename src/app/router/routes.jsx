import { createBrowserRouter } from "react-router-dom";

import Home from "../../pages/Home";
import LearnGerman from "../../pages/LearnGerman";
import ExploreGermany from "../../pages/ExploreGermany";
import StudyInGermany from "../../pages/StudyInGermany";
import Experiences from "../../pages/Experiences";
import Account from "../../pages/Account";
import CourseDetailPage from "@/pages/LearnGerman/CourseDetail";

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
]);
