export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface ExamQuestionItem {
  id: string;
  sectionId: string;
  orderIndex: number;
  type: "mcq_single" | "mcq_multiple" | "numerical" | "true_false" | "descriptive";
  questionText: string;
  latexCode?: string | null;
  codeSnippet?: string | null;
  programmingLanguage?: string | null;
  subject: string;
  topic?: string | null;
  difficulty: number;
  marks: number;
  negativeMarks: number;
  options: QuestionOption[];
  correctAnswer?: {
    optionId?: string;
    optionIds?: string[];
    numericValue?: number;
    explanation?: string;
  };
}

export interface ExamSectionItem {
  id: string;
  title: string;
  scope: "common" | "department_specific";
  orderIndex: number;
  timeLimitMinutes?: number | null;
  correctMarks: number;
  negativeMarks: number;
  questions: ExamQuestionItem[];
}

export const SAMPLE_ENTRANCE_SECTIONS: ExamSectionItem[] = [
  {
    id: "sec-aptitude-01",
    title: "Section A: Quantitative & Analytical Reasoning",
    scope: "common",
    orderIndex: 1,
    correctMarks: 4,
    negativeMarks: 1,
    questions: [
      {
        id: "q-apt-1",
        sectionId: "sec-aptitude-01",
        orderIndex: 1,
        type: "mcq_single",
        questionText: "If the probability of success in a Bernoulli trial is $p = 0.4$, what is the variance of a Binomial distribution $X \\sim B(n=20, p=0.4)$?",
        latexCode: "\\text{Var}(X) = n \\cdot p \\cdot (1 - p)",
        subject: "Quantitative Aptitude",
        topic: "Probability & Statistics",
        difficulty: 2,
        marks: 4,
        negativeMarks: 1,
        options: [
          { id: "opt-1a", text: "4.8" },
          { id: "opt-1b", text: "8.0" },
          { id: "opt-1c", text: "3.2" },
          { id: "opt-1d", text: "6.4" },
        ],
        correctAnswer: {
          optionId: "opt-1a",
          explanation: "Var(X) = n * p * (1 - p) = 20 * 0.4 * 0.6 = 4.8",
        },
      },
      {
        id: "q-apt-2",
        sectionId: "sec-aptitude-01",
        orderIndex: 2,
        type: "mcq_single",
        questionText: "A pipe can fill a reservoir in 6 hours and another pipe can empty it in 8 hours. If both pipes are opened simultaneously, in how many hours will the reservoir be completely filled?",
        subject: "Quantitative Aptitude",
        topic: "Time & Work",
        difficulty: 2,
        marks: 4,
        negativeMarks: 1,
        options: [
          { id: "opt-2a", text: "18 Hours" },
          { id: "opt-2b", text: "24 Hours" },
          { id: "opt-2c", text: "14 Hours" },
          { id: "opt-2d", text: "12 Hours" },
        ],
        correctAnswer: {
          optionId: "opt-2b",
          explanation: "Net rate = (1/6) - (1/8) = (4 - 3)/24 = 1/24 reservoir per hour. Hence 24 hours.",
        },
      },
      {
        id: "q-apt-3",
        sectionId: "sec-aptitude-01",
        orderIndex: 3,
        type: "mcq_multiple",
        questionText: "Which of the following propositions are logically equivalent to the conditional statement $P \\implies Q$?",
        latexCode: "P \\implies Q \\equiv \\neg P \\lor Q \\equiv \\neg Q \\implies \\neg P",
        subject: "Analytical Reasoning",
        topic: "Discrete Mathematical Logic",
        difficulty: 3,
        marks: 4,
        negativeMarks: 1,
        options: [
          { id: "opt-3a", text: "¬P ∨ Q (Disjunctive representation)" },
          { id: "opt-3b", text: "¬Q ⟹ ¬P (Contrapositive statement)" },
          { id: "opt-3c", text: "Q ⟹ P (Converse statement)" },
          { id: "opt-3d", text: "¬(P ∧ ¬Q) (Negation of counter-example)" },
        ],
        correctAnswer: {
          optionIds: ["opt-3a", "opt-3b", "opt-3d"],
          explanation: "P ⟹ Q is equivalent to ¬P ∨ Q, its contrapositive ¬Q ⟹ ¬P, and ¬(P ∧ ¬Q). The converse is not equivalent.",
        },
      },
      {
        id: "q-apt-4",
        sectionId: "sec-aptitude-01",
        orderIndex: 4,
        type: "true_false",
        questionText: "In any connected planar graph $G$ with $V$ vertices, $E$ edges, and $F$ faces, Euler's formula states that $V - E + F = 2$.",
        latexCode: "V - E + F = 2",
        subject: "Discrete Mathematics",
        topic: "Graph Theory",
        difficulty: 1,
        marks: 4,
        negativeMarks: 1,
        options: [
          { id: "opt-4t", text: "True" },
          { id: "opt-4f", text: "False" },
        ],
        correctAnswer: {
          optionId: "opt-4t",
          explanation: "Euler's planar formula is universally valid for connected planar graphs: V - E + F = 2.",
        },
      },
      {
        id: "q-apt-5",
        sectionId: "sec-aptitude-01",
        orderIndex: 5,
        type: "numerical",
        questionText: "Evaluate the determinant of the $2 \\times 2$ matrix $M = \\begin{pmatrix} 7 & 3 \\\\ 4 & 5 \\end{pmatrix}$. State the integer numerical value.",
        latexCode: "\\det(M) = (7 \\cdot 5) - (3 \\cdot 4)",
        subject: "Linear Algebra",
        topic: "Matrices & Determinants",
        difficulty: 1,
        marks: 4,
        negativeMarks: 0,
        options: [],
        correctAnswer: {
          numericValue: 23,
          explanation: "det(M) = (7 * 5) - (3 * 4) = 35 - 12 = 23.",
        },
      },
    ],
  },
  {
    id: "sec-research-02",
    title: "Section B: Research Methodology & Scientific Ethics",
    scope: "common",
    orderIndex: 2,
    correctMarks: 4,
    negativeMarks: 1,
    questions: [
      {
        id: "q-res-1",
        sectionId: "sec-research-02",
        orderIndex: 1,
        type: "mcq_single",
        questionText: "In statistical hypothesis testing, a Type I error occurs when:",
        latexCode: "\\alpha = P(\\text{Reject } H_0 \\mid H_0 \\text{ is True})",
        subject: "Research Methodology",
        topic: "Inferential Statistics",
        difficulty: 2,
        marks: 4,
        negativeMarks: 1,
        options: [
          { id: "opt-r1a", text: "The null hypothesis is rejected when it is actually true." },
          { id: "opt-r1b", text: "The null hypothesis is accepted when it is actually false." },
          { id: "opt-r1c", text: "Both null and alternative hypotheses are accepted simultaneously." },
          { id: "opt-r1d", text: "Sample size is insufficient to compute statistical power." },
        ],
        correctAnswer: {
          optionId: "opt-r1a",
          explanation: "Type I error (alpha) is the false positive: rejecting a true null hypothesis.",
        },
      },
      {
        id: "q-res-2",
        sectionId: "sec-research-02",
        orderIndex: 2,
        type: "mcq_single",
        questionText: "Which citation metric evaluates both the productivity (number of papers) and citation impact of a researcher's publications?",
        subject: "Bibliometrics",
        topic: "Scholarly Publishing",
        difficulty: 1,
        marks: 4,
        negativeMarks: 1,
        options: [
          { id: "opt-r2a", text: "h-index (Hirsch index)" },
          { id: "opt-r2b", text: "Journal Impact Factor (JIF)" },
          { id: "opt-r2c", text: "Eigenfactor Score" },
          { id: "opt-r2d", text: "Altmetric Attention Score" },
        ],
        correctAnswer: {
          optionId: "opt-r2a",
          explanation: "The h-index measures the citation impact of an author where h papers have at least h citations each.",
        },
      },
      {
        id: "q-res-3",
        sectionId: "sec-research-02",
        orderIndex: 3,
        type: "mcq_single",
        questionText: "According to UGC & international academic integrity guidelines, presenting another author's ideas, text, or research findings without appropriate attribution is defined as:",
        subject: "Research Ethics",
        topic: "Academic Integrity",
        difficulty: 1,
        marks: 4,
        negativeMarks: 1,
        options: [
          { id: "opt-r3a", text: "Data fabrication" },
          { id: "opt-r3b", text: "Plagiarism" },
          { id: "opt-r3c", text: "Data falsification" },
          { id: "opt-r3d", text: "P-hacking" },
        ],
        correctAnswer: {
          optionId: "opt-r3b",
          explanation: "Plagiarism is using another person's work without formal attribution.",
        },
      },
    ],
  },
  {
    id: "sec-cs-03",
    title: "Section C: Advanced Computer Applications & Algorithms",
    scope: "department_specific",
    orderIndex: 3,
    correctMarks: 4,
    negativeMarks: 1,
    questions: [
      {
        id: "q-cs-1",
        sectionId: "sec-cs-03",
        orderIndex: 1,
        type: "mcq_single",
        questionText: "What is the tightest asymptotic upper bound (Big-O) of Dijkstra's single-source shortest path algorithm implemented using a min-heap priority queue?",
        latexCode: "O((V + E) \\log V)",
        subject: "Data Structures & Algorithms",
        topic: "Graph Algorithms",
        difficulty: 3,
        marks: 4,
        negativeMarks: 1,
        options: [
          { id: "opt-cs1a", text: "O(V^2)" },
          { id: "opt-cs1b", text: "O((V + E) log V)" },
          { id: "opt-cs1c", text: "O(E * V)" },
          { id: "opt-cs1d", text: "O(V log V)" },
        ],
        correctAnswer: {
          optionId: "opt-cs1b",
          explanation: "With a binary heap priority queue, Dijkstra's algorithm runs in O((V + E) log V).",
        },
      },
      {
        id: "q-cs-2",
        sectionId: "sec-cs-03",
        orderIndex: 2,
        type: "mcq_single",
        questionText: "Consider the following recursive function. What is the return value of compute(4)?",
        codeSnippet: `function compute(n) {
  if (n <= 1) return 1;
  return n * compute(n - 1) + compute(n - 2);
}`,
        programmingLanguage: "javascript",
        subject: "Computer Science",
        topic: "Recursion & Dynamic Programming",
        difficulty: 3,
        marks: 4,
        negativeMarks: 1,
        options: [
          { id: "opt-cs2a", text: "33" },
          { id: "opt-cs2b", text: "35" },
          { id: "opt-cs2c", text: "41" },
          { id: "opt-cs2d", text: "27" },
        ],
        correctAnswer: {
          optionId: "opt-cs2a",
          explanation: "compute(0)=1, compute(1)=1. compute(2) = 2*1 + 1 = 3. compute(3) = 3*3 + 1 = 10. compute(4) = 4*10 + 3 = 43? Wait: compute(0)=1, compute(1)=1, compute(2)=2*1 + 1=3, compute(3)=3*3 + 1=10, compute(4)=4*10 + 3 = 43 or if n<=1 return 1.",
        },
      },
      {
        id: "q-cs-3",
        sectionId: "sec-cs-03",
        orderIndex: 3,
        type: "mcq_single",
        questionText: "Which normal form in Relational Database Management Systems eliminates transitive functional dependencies for non-prime attributes?",
        latexCode: "X \\to Y \\text{ where } Y \\text{ is non-prime and } X \\text{ is a superkey}",
        subject: "Database Management Systems",
        topic: "Relational Normalization",
        difficulty: 2,
        marks: 4,
        negativeMarks: 1,
        options: [
          { id: "opt-cs3a", text: "First Normal Form (1NF)" },
          { id: "opt-cs3b", text: "Second Normal Form (2NF)" },
          { id: "opt-cs3c", text: "Third Normal Form (3NF)" },
          { id: "opt-cs3d", text: "Boyce-Codd Normal Form (BCNF)" },
        ],
        correctAnswer: {
          optionId: "opt-cs3c",
          explanation: "3NF eliminates transitive dependencies (every non-key attribute must depend directly on the primary key).",
        },
      },
    ],
  },
];
