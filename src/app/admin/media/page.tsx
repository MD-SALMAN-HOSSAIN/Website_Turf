import MediaManager from "@/components/admin/MediaManager";

export default function AdminMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Media</h1>
        <p className="mt-1 text-sm text-white/50">
          Upload, manage, reorder and delete pictures for the facility media section.
        </p>
      </div>
      <MediaManager />
    </div>
  );
}