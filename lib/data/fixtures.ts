import type { Course, LabTest, Question } from "./types";

export const courses: Course[] = [
  {
    id: "course-math1081",
    code: "MATH1081",
    name: "Discrete Mathematics",
    description: "Sets, logic, number theory, graphs and combinatorics.",
    sortOrder: 1,
  },
  {
    id: "course-math1141",
    code: "MATH1141",
    name: "Higher Mathematics 1A",
    description: "Calculus and linear algebra (higher stream).",
    sortOrder: 2,
  },
];

export const labTests: LabTest[] = [
  {
    id: "test-1081-lt1",
    courseId: "course-math1081",
    name: "Lab Test 1",
    term: "2026 T1",
    description:
      "Practice questions covering sets, functions and number theory, with guided worked steps.",
    isPublished: true,
    sortOrder: 1,
    answerSyntax: "numbas",
  },
  {
    id: "test-1081-lt2-draft",
    courseId: "course-math1081",
    name: "Lab Test 2",
    term: "2026 T1",
    description: "Draft — not yet released to students.",
    isPublished: false,
    sortOrder: 2,
    answerSyntax: "numbas",
  },
];

export const questions: Question[] = [
  {
    id: "q-1081-lt1-1",
    labTestId: "test-1081-lt1",
    number: 1,
    promptLatex:
      "In a class of 39 students: 16 study Biology, 21 study English, 10 study both Biology and English, 7 study both Biology and Maths, 12 study both English and Maths, 5 study all three subjects, and 7 study none of these subjects.",
    sortOrder: 1,
    parts: [
      {
        id: "p-1081-lt1-1-a",
        questionId: "q-1081-lt1-1",
        label: "a",
        promptLatex: "How many students study Maths?",
        answerType: "integer",
        answerValue: 19,
        sortOrder: 1,
        steps: [
          {
            id: "s-1081-lt1-1-a-1",
            partId: "p-1081-lt1-1-a",
            number: 1,
            promptLatex:
              "First find $|B \\cup E \\cup M|$: how many students study at least one subject?",
            answerType: "integer",
            answerValue: 32,
            explanationLatex:
              "Since 7 students study none, $|B \\cup E \\cup M| = 39 - 7 = 32$.",
            sortOrder: 1,
            hints: [
              {
                id: "h-1081-lt1-1-a-1-1",
                stepId: "s-1081-lt1-1-a-1",
                number: 1,
                bodyLatex:
                  "The total class size minus those studying none gives the union.",
                sortOrder: 1,
              },
            ],
          },
          {
            id: "s-1081-lt1-1-a-2",
            partId: "p-1081-lt1-1-a",
            number: 2,
            promptLatex:
              "Now solve for $|M|$ using inclusion–exclusion. What is $|M|$?",
            answerType: "integer",
            answerValue: 19,
            explanationLatex:
              "$32 = 16 + 21 + |M| - 10 - 12 - 7 + 5$, so $|M| = 19$.",
            sortOrder: 2,
            hints: [],
          },
        ],
      },
      {
        id: "p-1081-lt1-1-b",
        questionId: "q-1081-lt1-1",
        label: "b",
        promptLatex:
          "Evaluate $|B^c \\cup (E^c \\cap M^c)^c|$.",
        answerType: "integer",
        answerValue: 35,
        sortOrder: 2,
        steps: [],
      },
    ],
  },
  {
    id: "q-1081-lt1-2",
    labTestId: "test-1081-lt1",
    number: 2,
    promptLatex:
      "For an integer $k$, let $S_k = \\{ n \\in \\mathbb{Z} : \\tfrac{5}{4}k + 2 \\le n \\le \\tfrac{5}{4}k + 12 \\}$.",
    noteLatex: "Recall the Numbas syntax for a set $\\{a,b,c\\}$ is set(a,b,c).",
    sortOrder: 2,
    parts: [
      {
        id: "p-1081-lt1-2-a",
        questionId: "q-1081-lt1-2",
        label: "a",
        promptLatex: "What is $S_5 - S_1$?",
        answerType: "set_of_integers",
        answerValue: [14, 15, 16, 17, 18],
        sortOrder: 1,
        steps: [],
      },
      {
        id: "p-1081-lt1-2-b-i",
        questionId: "q-1081-lt1-2",
        label: "b.i",
        promptLatex: "Find $|\\mathcal{P}(S_1 \\times S_5)|$.",
        answerType: "expression",
        answerValue: { mobius: "2^100" },
        sortOrder: 2,
        steps: [],
      },
    ],
  },
  {
    id: "q-1081-lt1-3",
    labTestId: "test-1081-lt1",
    number: 3,
    promptLatex:
      "Consider $f : \\mathbb{R}^+_0 \\to \\mathbb{R}$, $f(x) = x(x+4)^2$. Complete the statement to make it logically true.",
    sortOrder: 3,
    parts: [
      {
        id: "p-1081-lt1-3-a",
        questionId: "q-1081-lt1-3",
        label: "a",
        promptLatex:
          "Since the equation $f(x) = a$ has the following number of solutions, we conclude $f$ is:",
        answerType: "single_choice",
        answerValue: { choice: "not_surjective" },
        answerConfig: {
          options: [
            { value: "injective", label: "injective" },
            { value: "surjective", label: "surjective" },
            { value: "not_injective", label: "not injective" },
            { value: "not_surjective", label: "not surjective" },
          ],
        },
        sortOrder: 1,
        steps: [],
      },
    ],
  },
  {
    id: "q-1081-lt1-4",
    labTestId: "test-1081-lt1",
    number: 4,
    promptLatex:
      "Let $S = \\{0,1,2,3,4,5,6,7\\}$ and $f : S \\to S$ the shift $f(x) = (x+3) \\bmod 8$.",
    sortOrder: 4,
    parts: [
      {
        id: "p-1081-lt1-4-c",
        questionId: "q-1081-lt1-4",
        label: "c",
        promptLatex: "Classify $f$.",
        answerType: "text",
        answerValue: { text: "Bijective" },
        sortOrder: 1,
        steps: [],
      },
    ],
  },
  {
    id: "q-1081-lt1-8",
    labTestId: "test-1081-lt1",
    number: 8,
    promptLatex:
      "For the arrow diagram shown, indicate whether the relation is reflexive, symmetric, and/or transitive.",
    sortOrder: 5,
    parts: [
      {
        id: "p-1081-lt1-8-a",
        questionId: "q-1081-lt1-8",
        label: "a",
        promptLatex: "Select all properties that hold.",
        imageUrl: "/questions/math1081-lt1-q8a.png",
        imageAlt:
          "Arrow diagram on four nodes labelled 1 to 4, showing the relation for part (a).",
        answerType: "multi_select",
        answerValue: { selected: ["reflexive", "symmetric", "transitive"] },
        answerConfig: {
          options: [
            { value: "reflexive", label: "Reflexive" },
            { value: "symmetric", label: "Symmetric" },
            { value: "transitive", label: "Transitive" },
          ],
        },
        sortOrder: 1,
        steps: [],
      },
    ],
  },
];
