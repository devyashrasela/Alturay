export default function Card({ children, className = '', hoverable = false, style }) {
  return (
    <div className={`card ${hoverable ? 'card--hoverable' : ''} ${className}`} style={style}>
      {children}
    </div>
  );
}
