# Changelog

All notable changes to the Tour Vendor Hub project will be documented in this file.

## [Unreleased] - 2026-01-07

### Added
- **Booking System:**
  - Implemented `useCreateBooking` hook for secure, server-side price fetching.
  - Created `BookingModal` component with date selection, participant count, and special requests.
  - Added "Book Now" integration in `PackageDetails` page.
  - Implemented role-based booking views in `useBookings` hook (Traveler vs Agency).
- **UI/UX Improvements:**
  - Added global `ErrorBoundary` component for graceful error handling.
  - Added `LoadingSpinner` component for consistent loading states.
  - Added `EmptyState` component for consistent empty data presentation.
  - Added toast notifications for critical actions (Booking, Package Creation).
- **Traveler Dashboard:**
  - Implemented "Coming Soon" states for Wishlist and Reviews pages.
  - Added proper booking list with status filtering (Upcoming, Completed, Cancelled).

### Changed
- **Codebase Cleanup:**
  - Removed 11+ unused root-level page files (e.g., `Index.tsx`, `Dashboard.tsx`, `Messages.tsx`) to reduce noise.
  - Consolidated package creation logic: removed `usePackages.ts` creation functions in favor of `useCreatePackage.ts`.
- **Security & Data Integrity:**
  - Removed client-side price passing in booking flow to prevent manipulation.
  - Removed hardcoded/fake data from:
    - `TravelerWishlist.tsx` (Mock items removed)
    - `TravelerReviews.tsx` (Mock reviews removed)
    - `PackagesList.tsx` (Fake "4.8" rating removed)
- **Routing:**
  - Verified and cleaned up `App.tsx` routes, removing references to deleted files.

### Fixed
- **Silent Failures:** Added error handling for itinerary and media creation in package wizard.
- **Data Accuracy:** `PackagesList` now correctly shows "No reviews yet" instead of misleading hardcoded ratings.
- **Navigation:** Fixed broken links and redirects in the Booking flow and Traveler Dashboard.
