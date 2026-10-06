/**
 * SafeExam Pro — Smart Question Auto-Picker
 * 
 * Selects questions according to the Ph.D Entrance pattern:
 * - Common pool (Universal Part A, e.g. 20 questions)
 * - Department-specific pools (Part B, e.g. 30 questions per department)
 * With intelligent difficulty balance and shortfall detection.
 */

export interface AvailableQuestionItem {
  id: string;
  bank_id: string;
  department_id?: string | null;
  is_common?: boolean | null;
  subject?: string;
  topic?: string | null;
  difficulty?: number;
  type?: string;
  content?: any;
  options?: any;
  correct_answer?: any;
  explanation?: string | null;
}

export interface DepartmentSummary {
  departmentId: string;
  departmentName?: string;
  departmentCode?: string;
  availableCount: number;
  requestedCount: number;
  selectedCount: number;
  shortfall: number;
}

export interface AutoPickResult {
  commonQuestionIds: string[];
  deptQuestionIdsByDept: Record<string, string[]>;
  allSelectedQuestionIds: string[];
  stats: {
    requestedCommon: number;
    availableCommon: number;
    selectedCommon: number;
    commonShortfall: number;
    departments: DepartmentSummary[];
    isFullySufficient: boolean;
  };
}

/**
 * Shuffles an array immutably using Fisher-Yates algorithm.
 */
function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Picks N questions from a pool trying to balance difficulty if possible.
 */
function pickBalancedQuestions(pool: AvailableQuestionItem[], count: number): AvailableQuestionItem[] {
  if (pool.length <= count) {
    return [...pool];
  }

  // Group by difficulty: 1 (Easy), 2 (Medium), 3 (Hard)
  const easy = shuffleArray(pool.filter((q) => (q.difficulty ?? 2) === 1));
  const medium = shuffleArray(pool.filter((q) => (q.difficulty ?? 2) === 2));
  const hard = shuffleArray(pool.filter((q) => (q.difficulty ?? 2) >= 3));

  // Desired distribution: ~30% Easy, ~50% Medium, ~20% Hard
  const targetEasy = Math.round(count * 0.3);
  const targetMedium = Math.round(count * 0.5);
  const targetHard = count - targetEasy - targetMedium;

  const selected: AvailableQuestionItem[] = [];

  const takeFromBucket = (bucket: AvailableQuestionItem[], amount: number) => {
    const taken = bucket.splice(0, amount);
    selected.push(...taken);
  };

  takeFromBucket(easy, targetEasy);
  takeFromBucket(medium, targetMedium);
  takeFromBucket(hard, targetHard);

  // If still need more due to bucket exhaustion, gather all remaining and pick
  const remainingNeeded = count - selected.length;
  if (remainingNeeded > 0) {
    const leftover = shuffleArray([...easy, ...medium, ...hard]);
    selected.push(...leftover.slice(0, remainingNeeded));
  }

  return selected.slice(0, count);
}

/**
 * Auto-selects questions for Part A (Common) and Part B (per department).
 */
export function autoPickExamQuestions({
  allQuestions,
  targetDepartmentIds,
  commonCount = 20,
  deptCount = 30,
  departmentMetaMap = {},
}: {
  allQuestions: AvailableQuestionItem[];
  targetDepartmentIds: string[];
  commonCount?: number;
  deptCount?: number;
  departmentMetaMap?: Record<string, { name: string; code?: string }>;
}): AutoPickResult {
  // 1. Separate common pool
  const commonPool = allQuestions.filter(
    (q) => q.is_common === true || (!q.department_id && q.is_common !== false)
  );

  const selectedCommon = pickBalancedQuestions(commonPool, commonCount);
  const commonQuestionIds = selectedCommon.map((q) => q.id);
  const commonShortfall = Math.max(0, commonCount - selectedCommon.length);

  // 2. Department-specific pools
  const deptQuestionIdsByDept: Record<string, string[]> = {};
  const departmentSummaries: DepartmentSummary[] = [];
  const allDeptSelectedIds: string[] = [];

  for (const deptId of targetDepartmentIds) {
    const deptPool = allQuestions.filter(
      (q) => !q.is_common && q.department_id === deptId
    );

    const selectedDept = pickBalancedQuestions(deptPool, deptCount);
    const ids = selectedDept.map((q) => q.id);
    deptQuestionIdsByDept[deptId] = ids;
    allDeptSelectedIds.push(...ids);

    const shortfall = Math.max(0, deptCount - ids.length);
    const meta = departmentMetaMap[deptId];

    departmentSummaries.push({
      departmentId: deptId,
      departmentName: meta?.name || "Unknown Department",
      departmentCode: meta?.code || undefined,
      availableCount: deptPool.length,
      requestedCount: deptCount,
      selectedCount: ids.length,
      shortfall,
    });
  }

  const allSelectedQuestionIds = Array.from(
    new Set([...commonQuestionIds, ...allDeptSelectedIds])
  );

  const isFullySufficient =
    commonShortfall === 0 &&
    departmentSummaries.every((dept) => dept.shortfall === 0);

  return {
    commonQuestionIds,
    deptQuestionIdsByDept,
    allSelectedQuestionIds,
    stats: {
      requestedCommon: commonCount,
      availableCommon: commonPool.length,
      selectedCommon: commonQuestionIds.length,
      commonShortfall,
      departments: departmentSummaries,
      isFullySufficient,
    },
  };
}

/**
 * Summarizes the entire question pool availability for the wizard UI.
 */
export function analyzeQuestionPoolAvailability({
  allQuestions,
  targetDepartmentIds,
  commonCount = 20,
  deptCount = 30,
  departmentMetaMap = {},
}: {
  allQuestions: AvailableQuestionItem[];
  targetDepartmentIds: string[];
  commonCount?: number;
  deptCount?: number;
  departmentMetaMap?: Record<string, { name: string; code?: string }>;
}) {
  const commonQuestions = allQuestions.filter(
    (q) => q.is_common === true || (!q.department_id && q.is_common !== false)
  );

  const deptSummaries = targetDepartmentIds.map((deptId) => {
    const count = allQuestions.filter(
      (q) => !q.is_common && q.department_id === deptId
    ).length;
    const meta = departmentMetaMap[deptId];
    return {
      departmentId: deptId,
      name: meta?.name || "Department",
      code: meta?.code || "",
      available: count,
      required: deptCount,
      isSufficient: count >= deptCount,
    };
  });

  return {
    commonAvailable: commonQuestions.length,
    commonRequired: commonCount,
    isCommonSufficient: commonQuestions.length >= commonCount,
    departments: deptSummaries,
  };
}
