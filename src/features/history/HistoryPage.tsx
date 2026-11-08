import { ar } from "../../i18n/ar";
import { Page } from "../../ui/Page";

export default function HistoryPage() {
  return (
    <Page title={ar.tabs.history}>
      <p>{ar.placeholder.soon}</p>
    </Page>
  );
}
