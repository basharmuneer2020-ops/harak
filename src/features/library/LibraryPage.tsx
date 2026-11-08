import { ar } from "../../i18n/ar";
import { Page } from "../../ui/Page";

export default function LibraryPage() {
  return (
    <Page title={ar.tabs.library}>
      <p>{ar.placeholder.soon}</p>
    </Page>
  );
}
