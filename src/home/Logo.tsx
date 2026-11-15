import { CodeXml } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'md' | 'sm' }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="xd-logo-mark" style={size === 'sm' ? { width: 28, height: 28, borderRadius: 8 } : undefined}>
        <CodeXml size={size === 'sm' ? 15 : 18} strokeWidth={2.4} />
      </span>
      <span className={`font-extrabold tracking-tight ${size === 'sm' ? 'text-[15px]' : 'text-[17px]'}`}>
        <span className="xd-gradient-text">XDev</span>CodeStudio
      </span>
    </span>
  );
}
