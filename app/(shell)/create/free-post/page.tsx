import { createFreePostAction } from "@/app/(shell)/create/actions";
import { AppShell } from "@/components/app-shell";
import { FreePostForm } from "@/components/post-create/create-forms";
import { getPostCreateAccessState } from "@/lib/post-create/server";

export const dynamic = "force-dynamic";

export default async function FreePostCreatePage() {
  const accessState = await getPostCreateAccessState();

  return (
    <AppShell
      title="일반 게시글 작성"
      subtitle="세션 후기와 전략 메모를 제목·본문 중심으로 정리하고, 초안과 게시 상태를 CTA에서 즉시 구분합니다."
    >
      <FreePostForm
        action={createFreePostAction}
        accessState={accessState}
        currentPath="/create/free-post"
      />
    </AppShell>
  );
}
