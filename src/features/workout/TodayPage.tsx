import { ar } from "../../i18n/ar";
import { Page } from "../../ui/Page";

export default function TodayPage() {
  return (
    <Page
      kicker={ar.app.kicker}
      title={ar.app.name}
      docTitle={ar.tabs.today}
      subtitle={ar.app.tagline}
    >
      <p>{ar.placeholder.soon}</p>
    </Page>
  );
}
