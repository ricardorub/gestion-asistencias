-- DropIndex
DROP INDEX "GradeCategory_courseId_idx";

-- DropIndex
DROP INDEX "GradeCategory_courseId_order_key";

-- CreateIndex
CREATE INDEX "GradeCategory_courseId_order_idx" ON "GradeCategory"("courseId", "order");
