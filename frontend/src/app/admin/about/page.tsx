import PageHeader from "@/components/admin/PageHeader";
import Placeholder from "@/components/admin/Placeholder";

export default function AdminAboutPage() {
  return (
    <>
      <PageHeader
        title="About content"
        description="Edit the public About page — story, values, team, and stats."
      />
      <Placeholder
        title="About-page content management"
        description="Update the company story, mission, team members, and statistics shown on the public About page without redeploying."
      />
    </>
  );
}
