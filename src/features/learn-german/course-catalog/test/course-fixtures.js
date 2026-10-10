export const catalogCourses = [
  { id: "discovery-b", title: "Deutsch A1 — Grüße", description: "Learn greetings. Guten Tag!", level: "A1", estimatedHours: 12.5, price: 1234567, currency: "VND" },
  { id: "discovery-a", title: "Alltag B2", description: "Authored description: Alltag und Arbeit.", level: "B2", estimatedHours: 20, price: 99.5, currency: "USD" },
];

export const courseViewer = {
  ...catalogCourses[0], enrolled: false, enrollmentStatus: null,
  sections: [
    { id: "section-b", title: "Begrüßung", description: "Authored section: Guten Morgen.", orderIndex: 2, lessons: [
      { id: "lesson-b", title: "Guten Tag", description: "Authored lesson: Greetings.", orderIndex: 2, estimatedMinutes: 17, freePreview: true },
      { id: "lesson-a", title: "Auf Wiedersehen", description: "Authored lesson: Farewells.", orderIndex: 1, estimatedMinutes: 8, freePreview: false },
    ] },
    { id: "section-a", title: "Gespräche", description: "Authored section: Dialoge.", orderIndex: 1, lessons: [
      { id: "lesson-c", title: "Wie geht es dir?", description: "Authored lesson: Conversations.", estimatedMinutes: 12, freePreview: false },
    ] },
  ],
};
