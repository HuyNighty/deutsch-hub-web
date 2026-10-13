function freeze(value) {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

const courseId = "10000000-0000-4000-8000-000000000001";
const lessonId = "10000000-0000-4000-8000-000000000004";
const answerA = "30000000-0000-4000-8000-000000000001";
const answerB = "30000000-0000-4000-8000-000000000002";

// Synthetic research fixtures, not API responses fetched from a server.
// Eligibility evidence belongs to this fixture wrapper, never to OpenLessonTarget.
export const fixtures = freeze({
  publicHome: {
    heading: "Một thế giới để khám phá",
    invitation: "Mở một trang mới về ngôn ngữ, cuộc sống và những câu chuyện ở nước Đức.",
    action: "Bắt đầu khám phá",
    discoveryConcept: "/explore-germany",
  },
  exploreGermany: {
    article: {
      articleId: "20000000-0000-4000-8000-000000000001",
      versionId: "20000000-0000-4000-8000-000000000002",
      slug: "research-nhung-trang-chuyen-nuoc-duc",
      title: "Những trang chuyện về nước Đức",
      summary: "Một bài viết mẫu để cùng quan sát cách một câu chuyện được mở ra, từ nhan đề đến những dòng giới thiệu đầu tiên.",
      primaryCategory: null,
      topics: [],
      coverMediaId: null,
      publishedAt: null,
    },
  },
  myLearning: {
    journey: {
      learningDomain: "DEUTSCH",
      currentLevel: "A1",
      courses: [{
        courseId,
        title: "Tiếng Đức A1",
        level: "A1",
        enrollmentStatus: "IN_PROGRESS",
        progress: { completedLessons: 3, totalLessons: 8, completionPercentage: 37.5, totalStudyMinutes: 90 },
      }],
      assessmentAttempts: [],
    },
    direction: { type: "CONTINUE_COURSE", target: { courseId } },
    nextActivity: { type: "OPEN_LESSON", target: { courseId, lessonId } },
    lessonEligibility: {
      courseId,
      lessonId,
      eligible: true,
      completed: false,
      completedLessonIds: [1, 2, 3].map((number) => `10000000-0000-4000-8000-${String(number).padStart(12, "0")}`),
    },
  },
  assessment: {
    runtime: {
      assessmentAttemptId: "40000000-0000-4000-8000-000000000001",
      taskId: "40000000-0000-4000-8000-000000000002",
      quizAttemptId: "40000000-0000-4000-8000-000000000003",
      quizId: "40000000-0000-4000-8000-000000000004",
      quizRevisionId: "40000000-0000-4000-8000-000000000005",
      status: "IN_PROGRESS",
      startedAt: "2026-10-13T08:00:00Z",
      expiresAt: null,
      submittedAt: null,
      questions: [{
        questionId: "50000000-0000-4000-8000-000000000001",
        content: "Welche Geschichten möchtest du lesen?",
        type: "MULTIPLE_CHOICE",
        order: 1,
        options: [
          { answerId: answerA, content: "Eine Geschichte über den Wald.", order: 1 },
          { answerId: answerB, content: "Geschichten über Alltag, Sprache und unterschiedliche Wege durch eine Stadt.", order: 2 },
        ],
        selectedAnswerIds: [answerA],
      }],
    },
  },
});
