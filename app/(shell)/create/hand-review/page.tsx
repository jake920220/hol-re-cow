import { createHandReviewAction } from "@/app/(shell)/create/actions";
import { AppShell } from "@/components/app-shell";
import { HandReviewForm } from "@/components/post-create/create-forms";
import { getPostCreateAccessState } from "@/lib/post-create/server";

export const dynamic = "force-dynamic";

export default async function HandReviewCreatePage() {
  const accessState = await getPostCreateAccessState();

  return (
    <AppShell
      title="핸드리뷰 작성"
      subtitle="구조화 입력과 자유 서술을 함께 담고, 저장 요청은 posts 와 hand_reviews 모두 서버에서만 처리합니다."
    >
      <HandReviewForm
        action={createHandReviewAction}
        accessState={accessState}
        currentPath="/create/hand-review"
      />
    </AppShell>
  );
}
