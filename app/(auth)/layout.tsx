import { PhSportMark } from '@/components/layout/ph-sport-mark';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 xl:px-24 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Form content */}
          {children}
        </div>
      </div>

      {/* Right side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary via-gold-500 to-gold-700 relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute inset-0">
          {/* Large shape top right */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          {/* Geometric lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          {/* Diagonal accent */}
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-gold-900/50 to-transparent" />
          {/* Arrow shapes */}
          <div className="absolute top-1/4 right-10 w-32 h-32 border-2 border-white/20 rotate-45" />
          <div className="absolute bottom-1/4 left-10 w-24 h-24 border-2 border-white/20 rotate-12" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <PhSportMark className="h-16 w-auto max-w-[280px] mb-6 text-white" />
          <p className="text-white/80 text-lg text-center max-w-sm">
            Gestión de diseños deportivos
          </p>
        </div>
      </div>
    </div>
  );
}

