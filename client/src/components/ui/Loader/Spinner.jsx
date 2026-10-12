export function Spinner({ size = 'md' }) {
  return <div className={`spinner ${size === 'lg' ? 'spinner--lg' : ''}`} />;
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner size="lg" />
    </div>
  );
}
