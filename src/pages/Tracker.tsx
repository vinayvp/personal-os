
import AuthGuard from '@/components/AuthGuard';
import TrackingApp from '@/components/TrackingApp';

const Tracker = () => {
  return (
    <AuthGuard>
      <TrackingApp />
    </AuthGuard>
  );
};

export default Tracker;
