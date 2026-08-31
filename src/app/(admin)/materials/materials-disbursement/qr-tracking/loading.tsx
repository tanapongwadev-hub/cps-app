/**
 * QR Tracking Loading State
 */

import { PageLoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function QrTrackingLoading() {
  return (
    <PageLoadingSkeleton
      title="ติดตาม QR Code"
      rowCount={6}
      showFilters={true}
    />
  );
}
