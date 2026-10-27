import { createFileRoute } from '@tanstack/react-router';
import AdminReviews from '@/pages/AdminReviews';

export const Route = createFileRoute('/admin/reviews')({
  component: AdminReviews,
});
