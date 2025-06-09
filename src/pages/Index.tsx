
import AuthGuard from '@/components/AuthGuard';
import TrackingApp from '@/components/TrackingApp';

const Index = () => {
  return (
    <AuthGuard>
      <TrackingApp />
    </AuthGuard>
  );
};

export default Index;
