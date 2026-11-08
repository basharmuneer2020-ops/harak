import { ar } from "../../i18n/ar";
import { Page } from "../../ui/Page";

export default function MePage() {
  return (
    <Page title={ar.tabs.me}>
      <p>{ar.placeholder.soon}</p>
    </Page>
  );
}
