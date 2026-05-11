import { GroupDetailWorkspace } from "@/components/groups/GroupDetailWorkspace";

interface GroupDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { id } = await params;
  return <GroupDetailWorkspace groupId={id} />;
}
