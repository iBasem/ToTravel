import { PackageEditor } from "@/features/packages/components/editor/PackageEditor";

// Creation goes straight into the full-page editor: the editor autosaves a
// draft as soon as the basics are valid, so no interstitial or modal is needed.
export default function CreatePackage() {
  return <PackageEditor mode="create" />;
}
