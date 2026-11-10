const logos = [
  '/images/anita.svg',
  '/images/golden.svg',
  '/images/bsic.svg',
  '/images/favicon.png',
];

const FloatingLogos = ({ bigger = false, animated = false }: { bigger?: boolean, animated?: boolean }) => {
  return (
    <div className="overflow-x-hidden w-full py-6 bg-transparent relative">
      <div className="flex items-center animate-logo-scroll space-x-24" style={{ width: 'max-content' }}>
        {logos.concat(logos).map((src, i) => {
          const isFavicon = src.endsWith('/favicon.png');
          return (
            <img
              key={i}
              src={src}
              alt="logo"
              className={
                (bigger ? "h-40 sm:h-44 w-auto " : "h-28 w-auto ") +
                "opacity-95 drop-shadow-2xl transition-transform duration-300 hover:scale-110" +
                (animated ? " animate-logo-bounce" : "") +
                (isFavicon ? " scale-[0.4]" : "")
              }
              style={{
                flexShrink: 0,
                animationDelay: animated ? `${(i % logos.length) * 0.5}s` : undefined,
              }}
            />
          );
        })}
      </div>
      <style>{`
        @keyframes logo-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-logo-scroll {
          animation: logo-scroll 30s linear infinite;
          will-change: transform;
        }
        @keyframes logo-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px) scale(1.08); }
        }
        .animate-logo-bounce {
          animation: logo-bounce 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default FloatingLogos;
